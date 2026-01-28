from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.features.auth.schemas import RefreshRequest, TokenResponse, LogoutRequest, ChangePasswordRequest
from app.features.auth.service import AuthService
from app.features.auth.dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return AuthService.login(db, form_data)

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    return AuthService.refresh_token(db, data)

@router.post("/logout")
def logout(
    data: LogoutRequest,
    db: Session = Depends(get_db),
):
    return AuthService.logout(db, data)

@router.post("/logout-all")
def logout_all(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AuthService.logout_all(db, current_user.id)

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AuthService.change_password(db, current_user, data)