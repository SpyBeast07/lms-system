import secrets
from datetime import datetime, timedelta, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from sqlalchemy import update, func
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.features.auth.models import RefreshToken, PasswordChangeRequest
from app.features.users.models import User
from app.features.auth.security import hash_token, verify_token, verify_password, hash_password
from app.features.auth.jwt import create_access_token
from app.features.auth.schemas import TokenResponse, RefreshRequest, LogoutRequest, ChangePasswordRequest

from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate

from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate

REFRESH_TOKEN_DAYS = 2

class AuthService:
    @staticmethod
    async def login(db: AsyncSession, form_data) -> TokenResponse:
        """
        Authenticate user and issue new access & refresh tokens.
        """
        result = await db.execute(
            select(User)
            .options(joinedload(User.school))
            .filter(
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
                "base_role": user.role,       # Add authentic base role here
                "name": user.name,
                "school_id": user.school_id,
                "school_name": user.school.name if user.school else None,
                "subscription_end": user.school.subscription_end.isoformat() if user.school else None
            }
        )

        # 3️⃣ Create REFRESH token (random)
        raw_refresh_token = secrets.token_urlsafe(64)
        
        await AuthService._create_refresh_token(db, user, raw_refresh_token)

        await log_action(db, ActivityLogCreate(
            user_id=user.id,
            action="login",
            entity_type="user",
            entity_id=user.id,
            details=f"User {user.email} logged in"
        ))

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
            select(User)
            .options(joinedload(User.school))
            .filter(
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
                "base_role": user.role,       # Add authentic base role here
                "name": user.name,
                "school_id": user.school_id,
                "school_name": user.school.name if user.school else None,
                "subscription_end": user.school.subscription_end.isoformat() if user.school else None
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer",
        }

    @staticmethod
    async def switch_role(db: AsyncSession, user: User, target_role: str) -> TokenResponse:
        """
        Issue new tokens with a different role if the user has permission.
        e.g., Principal switching to Teacher view.
        """
        # Define allowed role switches
        allowed_switches = {
            "super_admin": ["principal", "teacher", "student"],
            "principal": ["teacher", "student"],
            "teacher": ["student"]
        }

        # User is ALWAYS allowed to switch back to their authentic base role
        if target_role != user.role and target_role not in allowed_switches.get(user.role, []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot switch from {user.role} to {target_role}"
            )

        # Re-fetch user to make sure we load relationships 
        result = await db.execute(select(User).options(joinedload(User.school)).filter(User.id == user.id))
        full_user = result.scalars().first()

        # Update the token data to reflect the *new* target role
        access_token = create_access_token(
            data={
                "sub": str(full_user.id),
                "role": target_role,          # Note: Emitting the new active role here
                "base_role": full_user.role,  # Track authentic base role
                "name": full_user.name,
                "school_id": full_user.school_id,
                "school_name": full_user.school.name if full_user.school else None,
                "subscription_end": full_user.school.subscription_end.isoformat() if full_user.school else None
            }
        )

        # Issue a new refresh token for this session
        raw_refresh_token = secrets.token_urlsafe(64)
        await AuthService._create_refresh_token(db, full_user, raw_refresh_token)

        # Log
        await log_action(db, ActivityLogCreate(
            user_id=full_user.id,
            action="role_switched",
            entity_type="user",
            entity_id=full_user.id,
            details=f"User {full_user.email} switched role to {target_role}"
        ))

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
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
    async def change_password(db: AsyncSession, user: User, data: ChangePasswordRequest, school_id: Optional[int] = None):
        """
        Verify old password and create a password change request. Notify admins of the same school.
        """
        # 1️⃣ Verify current password (async)
        is_valid = await verify_password(data.current_password, user.password_hash)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # 2️⃣ Create a Password Change Request
        new_hash = await hash_password(data.new_password)
        request = PasswordChangeRequest(
            user_id=user.id,
            new_password_hash=new_hash,
            status="pending",
            school_id=school_id
        )
        db.add(request)
        await db.commit()

        # 3️⃣ Log Action
        await log_action(db, ActivityLogCreate(
            user_id=user.id,
            action="password_change_requested",
            entity_type="user",
            entity_id=user.id,
            details=f"User '{user.name}' requested a password change"
        ), school_id=school_id)

        # 4️⃣ Notify Admins of the same school
        admin_query = select(User).filter(User.is_deleted == False)
        if school_id:
            admin_query = admin_query.filter(User.school_id == school_id, User.role.in_(["principal", "teacher"]))
        else:
            admin_query = admin_query.filter(User.role == "super_admin")
            
        admins_result = await db.execute(admin_query)
        admins = admins_result.scalars().all()
        for admin in admins:
            # Determine if this admin should see this request based on roles
            should_notify = False
            if admin.role == "super_admin" and user.role == "principal":
                should_notify = True
            elif admin.role == "principal" and user.role == "teacher":
                should_notify = True
            elif admin.role == "teacher" and user.role == "student":
                should_notify = True
                
            if should_notify:
                await create_notification(db, NotificationCreate(
                    user_id=admin.id,
                    type="password_change_request",
                    message=f"User '{user.name}' ({user.email}) requested a password change.",
                    entity_id=request.id
                ), school_id=school_id)

        return {"detail": "Password change request submitted for admin approval."}

    @staticmethod
    async def get_password_requests(db: AsyncSession, page: int = 1, limit: int = 10, status_filter: Optional[str] = None, target_role: Optional[str] = None, school_id: Optional[int] = None):
        skip = (page - 1) * limit
        
        query = select(PasswordChangeRequest).options(joinedload(PasswordChangeRequest.user))
        count_query = select(func.count(PasswordChangeRequest.id))

        if status_filter:
            query = query.filter(PasswordChangeRequest.status == status_filter)
            count_query = count_query.filter(PasswordChangeRequest.status == status_filter)

        if target_role:
            query = query.join(User).filter(User.role == target_role)
            count_query = count_query.join(User).filter(User.role == target_role)

        if school_id:
            query = query.filter(PasswordChangeRequest.school_id == school_id)
            count_query = count_query.filter(PasswordChangeRequest.school_id == school_id)

        query = query.order_by(PasswordChangeRequest.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        items = result.scalars().all()

        count_result = await db.execute(count_query)
        total = count_result.scalar_one()

        return {"items": items, "total": total, "page": page, "size": limit}

    @staticmethod
    async def approve_password_request(db: AsyncSession, current_admin: User, request_id: int, school_id: Optional[int] = None):
        request_query = select(PasswordChangeRequest).filter(PasswordChangeRequest.id == request_id)
        if school_id:
            request_query = request_query.filter(PasswordChangeRequest.school_id == school_id)
            
        result = await db.execute(request_query)
        request = result.scalars().first()
        if not request:
            raise HTTPException(status_code=404, detail="Password change request not found")
        if request.status != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

        user_result = await db.execute(select(User).filter(User.id == request.user_id))
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if current_admin.role == "super_admin" and user.role != "principal":
            raise HTTPException(status_code=403, detail="Super Admins can only approve principal requests")
        if current_admin.role == "principal" and user.role != "teacher":
            raise HTTPException(status_code=403, detail="Principals can only approve teacher requests")
        if current_admin.role == "teacher" and user.role != "student":
            raise HTTPException(status_code=403, detail="Teachers can only approve student requests")

        # 1️⃣ Update password and request status
        user.password_hash = request.new_password_hash
        user.updated_at = datetime.now(UTC)
        request.status = "approved"
        request.resolved_at = datetime.now(UTC)
        await db.commit()

        # 2️⃣ Revoke ALL refresh tokens for the user
        await AuthService._revoke_all_user_tokens(db, user.id)

        # 3️⃣ Logging for Admin AND User
        log_msg = f"Password change request #{request.id} for user '{user.name}' was approved"
        
        # Admin log
        await log_action(db, ActivityLogCreate(
            user_id=current_admin.id,
            action="password_change_approved",
            entity_type="user",
            entity_id=user.id,
            details=log_msg
        ), school_id=school_id)
        # User log
        await log_action(db, ActivityLogCreate(
            user_id=user.id,
            action="password_changed",
            entity_type="user",
            entity_id=user.id,
            details="Your password was successfully changed by an admin"
        ), school_id=school_id)

        # 4️⃣ Notify user
        await create_notification(db, NotificationCreate(
            user_id=user.id,
            type="password_change_approved",
            message="Your password change request has been approved. You must log in again.",
            entity_id=request.id
        ), school_id=school_id)

        return {"detail": "Password change request approved. User sessions have been revoked."}

    @staticmethod
    async def reject_password_request(db: AsyncSession, current_admin: User, request_id: int, school_id: Optional[int] = None):
        request_query = select(PasswordChangeRequest).filter(PasswordChangeRequest.id == request_id)
        if school_id:
            request_query = request_query.filter(PasswordChangeRequest.school_id == school_id)
            
        result = await db.execute(request_query)
        request = result.scalars().first()
        if not request:
            raise HTTPException(status_code=404, detail="Password change request not found")
        if request.status != "pending":
            raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

        # 1️⃣ Update request status
        request.status = "rejected"
        request.resolved_at = datetime.now(UTC)
        await db.commit()

        # 2️⃣ Fetch user for logging/notification
        user_result = await db.execute(select(User).filter(User.id == request.user_id))
        user = user_result.scalars().first()
        
        if user:
            if current_admin.role == "super_admin" and user.role != "principal":
                raise HTTPException(status_code=403, detail="Super Admins can only reject principal requests")
            if current_admin.role == "principal" and user.role != "teacher":
                raise HTTPException(status_code=403, detail="Principals can only reject teacher requests")
            if current_admin.role == "teacher" and user.role != "student":
                raise HTTPException(status_code=403, detail="Teachers can only reject student requests")

        if user:
            # 3️⃣ Logging
            log_msg = f"Password change request #{request.id} for user '{user.name}' was rejected"
            # Admin log
            await log_action(db, ActivityLogCreate(
                user_id=current_admin.id,
                action="password_change_rejected",
                entity_type="user",
                entity_id=user.id,
                details=log_msg
            ), school_id=school_id)
            # User log
            await log_action(db, ActivityLogCreate(
                user_id=user.id,
                action="password_change_rejected",
                entity_type="user",
                entity_id=user.id,
                details="Your password change request was rejected by an admin"
            ), school_id=school_id)

            # 4️⃣ Notify user
            await create_notification(db, NotificationCreate(
                user_id=user.id,
                type="password_change_rejected",
                message="Your password change request was rejected.",
                entity_id=request.id
            ), school_id=school_id)

        return {"detail": "Password change request rejected."}

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