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

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.logout_all(db, current_user.id)

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    return await AuthService.change_password(db, current_user, data, school_id=current_user.school_id)


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
        
    return await AuthService.change_password(db, user, data, school_id=user.school_id)


# --- Admin Approval Flow ---


@router.get("/password-requests", response_model=PaginatedPasswordChangeRequests)
async def get_password_requests(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    current_admin: User = Depends(require_role("super_admin", "principal", "teacher")),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    target_role = None
    if current_admin.role == "super_admin":
        target_role = "principal"
    elif current_admin.role == "principal":
        target_role = "teacher"
    elif current_admin.role == "teacher":
        target_role = "student"
        
    school_id = current_admin.school_id if current_admin.role != "super_admin" else None
    return await AuthService.get_password_requests(db, page, limit, status, target_role, school_id=school_id)


@router.patch("/password-requests/{request_id}/approve")
async def approve_password_request(
    request_id: int,
    current_admin: User = Depends(require_role("super_admin", "principal", "teacher")),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_admin.school_id if current_admin.role != "super_admin" else None
    return await AuthService.approve_password_request(db, current_admin, request_id, school_id=school_id)


@router.patch("/password-requests/{request_id}/reject")
async def reject_password_request(
    request_id: int,
    current_admin: User = Depends(require_role("super_admin", "principal", "teacher")),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_admin.school_id if current_admin.role != "super_admin" else None
    return await AuthService.reject_password_request(db, current_admin, request_id, school_id=school_id)