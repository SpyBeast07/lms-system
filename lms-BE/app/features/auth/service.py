import secrets
from datetime import datetime, timedelta, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from fastapi import HTTPException, status

from app.features.auth.models import RefreshToken
from app.features.users.models import User
from app.features.auth.security import hash_token, verify_token, verify_password, hash_password
from app.features.auth.jwt import create_access_token
from app.features.auth.schemas import TokenResponse, RefreshRequest, LogoutRequest, ChangePasswordRequest

REFRESH_TOKEN_DAYS = 2

class AuthService:
    @staticmethod
    async def login(db: AsyncSession, form_data) -> TokenResponse:
        """
        Authenticate user and issue new access & refresh tokens.
        """
        result = await db.execute(
            select(User).filter(
                User.email == form_data.username,
                User.is_deleted == False,
            )
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        
        is_password_valid = await verify_password(form_data.password, user.password_hash)
        if not is_password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # 2️⃣ Create ACCESS token (JWT)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role,
                "name": user.name,
            }
        )

        # 3️⃣ Create REFRESH token (random)
        raw_refresh_token = secrets.token_urlsafe(64)
        
        await AuthService._create_refresh_token(db, user, raw_refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    async def refresh_token(db: AsyncSession, data: RefreshRequest) -> TokenResponse:
        """
        Validate refresh token, check for reuse, check expiry, and issue new tokens.
        """
        token, reused = await AuthService._find_refresh_token(db, data.refresh_token)

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Reuse detection
        if reused:
            await AuthService._revoke_all_user_tokens(db, token.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token reuse detected. All sessions revoked.",
            )

        # Expiry check
        if token.expires_at < datetime.now(UTC):
            await AuthService._revoke_token(db, token)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        result = await db.execute(
            select(User).filter(
                User.id == token.user_id,
                User.is_deleted == False,
            )
        )
        user = result.scalars().first()

        if not user:
            await AuthService._revoke_all_user_tokens(db, token.user_id)
            raise HTTPException(status_code=401, detail="User not found")

        # Rotate token
        new_raw_refresh = secrets.token_urlsafe(64)
        await AuthService._rotate_refresh_token(db, token, new_raw_refresh)

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role,
                "name": user.name,
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer",
        }

    @staticmethod
    async def logout(db: AsyncSession, data: LogoutRequest):
        """
        Revoke specific refresh token.
        """
        token = await AuthService._get_valid_refresh_token(db, data.refresh_token)
        
        if not token:
            # Idempotent
            return {"detail": "Logged out"}

        await AuthService._revoke_token(db, token)
        return {"detail": "Logged out"}

    @staticmethod
    async def logout_all(db: AsyncSession, user_id: int):
        """
        Revoke all refresh tokens for a user.
        """
        await AuthService._revoke_all_user_tokens(db, user_id)
        return {"detail": "Logged out from all sessions"}

    @staticmethod
    async def change_password(db: AsyncSession, user: User, data: ChangePasswordRequest):
        """
        Verify old password, update to new password, and revoke all sessions.
        """
        # 1️⃣ Verify current password (async)
        is_valid = await verify_password(data.current_password, user.password_hash)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # 2️⃣ Update password (async hash)
        user.password_hash = await hash_password(data.new_password)
        user.updated_at = datetime.now(UTC)
        await db.commit()

        # 3️⃣ Revoke ALL refresh tokens
        await AuthService._revoke_all_user_tokens(db, user.id)

        return {"detail": "Password changed successfully. Logged out from all sessions."}

    # ---------- Internal Helpers (previously CRUD functions) ----------

    @staticmethod
    async def _create_refresh_token(db: AsyncSession, user: User, raw_token: str):
        token = RefreshToken(
            user_id=user.id,
            token_hash=await hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
        )
        db.add(token)
        await db.commit()
        await db.refresh(token)
        return token

    @staticmethod
    async def _get_valid_refresh_token(db: AsyncSession, raw_token: str):
        result = await db.execute(
            select(RefreshToken).filter(
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(UTC),
            )
        )
        tokens = result.scalars().all()

        for token in tokens:
            if await verify_token(raw_token, token.token_hash):
                return token
        return None

    @staticmethod
    async def _revoke_token(db: AsyncSession, token: RefreshToken):
        token.revoked = True
        await db.commit()

    @staticmethod
    async def _rotate_refresh_token(db: AsyncSession, old_token: RefreshToken, new_raw_token: str):
        old_token.revoked = True
        
        new_token = RefreshToken(
            user_id=old_token.user_id,
            token_hash=await hash_token(new_raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
            replaced_by=old_token.id,
        )
        db.add(new_token)
        await db.commit()
        return new_token

    @staticmethod
    async def _revoke_all_user_tokens(db: AsyncSession, user_id: int):
        stmt = update(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        ).values(revoked=True)
        
        await db.execute(stmt)
        await db.commit()

    @staticmethod
    async def _find_refresh_token(db: AsyncSession, raw_token: str):
        result = await db.execute(select(RefreshToken))
        tokens = result.scalars().all()
        for token in tokens:
            if await verify_token(raw_token, token.token_hash):
                if token.revoked:
                    return token, True
                return token, False
        return None, False