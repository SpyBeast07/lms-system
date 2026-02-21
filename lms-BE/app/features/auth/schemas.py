from datetime import datetime
from typing import List
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    email: EmailStr | None = None
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8)


class UserInfo(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

class PasswordChangeRequestRead(BaseModel):
    id: int
    user_id: int
    status: str
    created_at: datetime
    resolved_at: datetime | None = None
    user: UserInfo

    class Config:
        from_attributes = True

class PaginatedPasswordChangeRequests(BaseModel):
    items: List[PasswordChangeRequestRead]
    total: int
    page: int
    size: int