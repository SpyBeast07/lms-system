from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

from app.core.rate_limiter import limiter

from app.core.database import get_db
from app.features.auth.schemas import RefreshRequest, TokenResponse, LogoutRequest, ChangePasswordRequest
from app.features.auth.service import AuthService
from app.features.auth.dependencies import get_current_user


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