from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.features.users.models import User
from app.features.auth.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


from sqlalchemy.orm import joinedload

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")
    token_role = payload.get("role")
    token_school_id = payload.get("school_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(
        select(User).options(joinedload(User.school)).filter(
            User.id == int(user_id),
            User.is_deleted == False,
        )
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Attach token payload properties to user context
    user.token_role = token_role
    user.token_school_id = token_school_id

    if user.role != "super_admin":
        from datetime import datetime, UTC
        if not user.school:
            raise HTTPException(status_code=403, detail="School not found")
        if user.school.subscription_end < datetime.now(UTC):
            raise HTTPException(status_code=403, detail="School subscription expired")

    return user

def require_role(*allowed_roles: str):
    async def role_guard(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_guard

def check_role_hierarchy(current_role: str, target_role: str) -> bool:
    if current_role == "super_admin":
        return True
    if current_role == "principal" and target_role in ("teacher", "student"):
        return True
    if current_role == "teacher" and target_role == "student":
        return True
    return False