from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

from typing import Optional

from app.core.rate_limiter import limiter

from app.core.database import get_db
from app.features.auth.schemas import (
    RefreshRequest, 
    TokenResponse, 
    LogoutRequest, 
    ChangePasswordRequest,
    PaginatedPasswordChangeRequests
)
from app.features.auth.service import AuthService
from app.features.auth.dependencies import get_current_user, require_role


router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.login(db, form_data)

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.refresh_token(db, data)

@router.post("/logout")
async def logout(
    data: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.logout(db, data)

@router.post("/logout-all")
async def logout_all(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.logout_all(db, current_user.id)

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.change_password(db, current_user, data)


@router.post("/public-change-password")
async def public_change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.future import select
    from fastapi import HTTPException
    from app.features.users.models import User
    
    if not data.email:
        raise HTTPException(status_code=400, detail="Email is required for public password change requests")
    
    result = await db.execute(select(User).filter(User.email == data.email, User.is_deleted == False))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return await AuthService.change_password(db, user, data)


# --- Admin Approval Flow ---


@router.get("/password-requests", response_model=PaginatedPasswordChangeRequests)
async def get_password_requests(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    current_admin=Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.get_password_requests(db, page, limit, status)


@router.patch("/password-requests/{request_id}/approve")
async def approve_password_request(
    request_id: int,
    current_admin=Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.approve_password_request(db, current_admin, request_id)


@router.patch("/password-requests/{request_id}/reject")
async def reject_password_request(
    request_id: int,
    current_admin=Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.reject_password_request(db, current_admin, request_id)