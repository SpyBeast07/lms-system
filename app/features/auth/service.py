import secrets
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.features.auth.models import RefreshToken
from app.features.users.models import User
from app.features.auth.security import hash_token, verify_token, verify_password, hash_password
from app.features.auth.jwt import create_access_token
from app.features.auth.schemas import TokenResponse, RefreshRequest, LogoutRequest, ChangePasswordRequest

REFRESH_TOKEN_DAYS = 2

class AuthService:
    @staticmethod
    def login(db: Session, form_data) -> TokenResponse:
        """
        Authenticate user and issue new access & refresh tokens.
        """
        user = (
            db.query(User)
            .filter(
                User.email == form_data.username,
                User.is_deleted == False,
            )
            .first()
        )

        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # 2️⃣ Create ACCESS token (JWT)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role,
            }
        )

        # 3️⃣ Create REFRESH token (random)
        raw_refresh_token = secrets.token_urlsafe(64)
        
        AuthService._create_refresh_token(db, user, raw_refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def refresh_token(db: Session, data: RefreshRequest) -> TokenResponse:
        """
        Validate refresh token, check for reuse, check expiry, and issue new tokens.
        """
        token, reused = AuthService._find_refresh_token(db, data.refresh_token)

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Reuse detection
        if reused:
            AuthService._revoke_all_user_tokens(db, token.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token reuse detected. All sessions revoked.",
            )

        # Expiry check
        if token.expires_at < datetime.now(UTC):
            AuthService._revoke_token(db, token)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = db.query(User).filter(
            User.id == token.user_id,
            User.is_deleted == False,
        ).first()

        if not user:
            AuthService._revoke_all_user_tokens(db, token.user_id)
            raise HTTPException(status_code=401, detail="User not found")

        # Rotate token
        new_raw_refresh = secrets.token_urlsafe(64)
        AuthService._rotate_refresh_token(db, token, new_raw_refresh)

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role,
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer",
        }

    @staticmethod
    def logout(db: Session, data: LogoutRequest):
        """
        Revoke specific refresh token.
        """
        token = AuthService._get_valid_refresh_token(db, data.refresh_token)
        
        if not token:
            # Idempotent
            return {"detail": "Logged out"}

        AuthService._revoke_token(db, token)
        return {"detail": "Logged out"}

    @staticmethod
    def logout_all(db: Session, user_id: int):
        """
        Revoke all refresh tokens for a user.
        """
        AuthService._revoke_all_user_tokens(db, user_id)
        return {"detail": "Logged out from all sessions"}

    @staticmethod
    def change_password(db: Session, user: User, data: ChangePasswordRequest):
        """
        Verify old password, update to new password, and revoke all sessions.
        """
        # 1️⃣ Verify current password
        if not verify_password(data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # 2️⃣ Update password
        user.password_hash = hash_password(data.new_password)
        user.updated_at = datetime.now(UTC)
        db.commit()

        # 3️⃣ Revoke ALL refresh tokens
        AuthService._revoke_all_user_tokens(db, user.id)

        return {"detail": "Password changed successfully. Logged out from all sessions."}

    # ---------- Internal Helpers (previously CRUD functions) ----------

    @staticmethod
    def _create_refresh_token(db: Session, user: User, raw_token: str):
        token = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
        )
        db.add(token)
        db.commit()
        db.refresh(token)
        return token

    @staticmethod
    def _get_valid_refresh_token(db: Session, raw_token: str):
        tokens = db.query(RefreshToken).filter(
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(UTC),
        ).all()

        for token in tokens:
            if verify_token(raw_token, token.token_hash):
                return token
        return None

    @staticmethod
    def _revoke_token(db: Session, token: RefreshToken):
        token.revoked = True
        db.commit()

    @staticmethod
    def _rotate_refresh_token(db: Session, old_token: RefreshToken, new_raw_token: str):
        old_token.revoked = True
        
        new_token = RefreshToken(
            user_id=old_token.user_id,
            token_hash=hash_token(new_raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
            replaced_by=old_token.id,
        )
        db.add(new_token)
        db.commit()
        return new_token

    @staticmethod
    def _revoke_all_user_tokens(db: Session, user_id: int):
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        ).update({"revoked": True})
        db.commit()

    @staticmethod
    def _find_refresh_token(db: Session, raw_token: str):
        tokens = db.query(RefreshToken).all()
        for token in tokens:
            if verify_token(raw_token, token.token_hash):
                if token.revoked:
                    return token, True
                return token, False
        return None, False