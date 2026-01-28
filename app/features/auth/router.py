import secrets
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.features.auth.jwt import create_access_token
from app.features.auth.schemas import RefreshRequest, TokenResponse, LogoutRequest, ChangePasswordRequest
from app.features.auth.hashing import verify_password, hash_password
from app.features.auth.service import (
    create_refresh_token,
    get_valid_refresh_token,
    rotate_refresh_token,
    revoke_all_user_tokens,
    revoke_token,
    find_refresh_token,
)
from app.features.users.models import User
from app.features.auth.dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # 1️⃣ Fetch user
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

    create_refresh_token(
        db=db,
        user=user,
        raw_token=raw_refresh_token,
    )

    # 4️⃣ Return BOTH
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    token, reused = find_refresh_token(db, data.refresh_token)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # reuse detection
    if reused:
        revoke_all_user_tokens(db, token.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected. All sessions revoked.",
        )

    # expiry check (optional but recommended)
    if token.expires_at < datetime.now(UTC):
        revoke_token(db, token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    user = db.query(User).filter(
        User.id == token.user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        revoke_all_user_tokens(db, token.user_id)
        raise HTTPException(status_code=401, detail="User not found")

    new_raw_refresh = secrets.token_urlsafe(64)

    rotate_refresh_token(
        db=db,
        old_token=token,
        new_raw_token=new_raw_refresh,
    )

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

@router.post("/logout")
def logout(
    data: LogoutRequest,
    db: Session = Depends(get_db),
):
    token = get_valid_refresh_token(db, data.refresh_token)

    if not token:
        # Idempotent logout (safe even if already revoked)
        return {"detail": "Logged out"}

    revoke_token(db, token)
    return {"detail": "Logged out"}

@router.post("/logout-all")
def logout_all(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_all_user_tokens(db, current_user.id)
    return {"detail": "Logged out from all sessions"}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1️⃣ Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # 2️⃣ Update password
    current_user.password_hash = hash_password(data.new_password)
    current_user.updated_at = datetime.now(UTC)
    db.commit()

    # 3️⃣ Revoke ALL refresh tokens (logout everywhere)
    revoke_all_user_tokens(db, current_user.id)

    return {"detail": "Password changed successfully. Logged out from all sessions."}