from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.users.schemas import UserCreate, UserRead, UserUpdate
from app.features.users import service as user_crud
from app.features.auth.dependencies import require_role, check_role_hierarchy
from app.core.pagination import PaginatedResponse

router = APIRouter(prefix="/users", tags=["Users"])


# ---------- CREATE ----------
@router.post("/", response_model=UserRead)
async def create_user_api(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    if not check_role_hierarchy(current_user.role, user_in.role):
        raise HTTPException(
            status_code=403, 
            detail=f"Role '{current_user.role}' cannot create users with role '{user_in.role}'"
        )
    return await user_crud.create_user(db, user_in)


# ---------- LIST ----------
@router.get("/", response_model=PaginatedResponse[UserRead])
async def list_users_api(
    page: int = 1,
    limit: int = 10,
    deleted: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    target_roles = None
    if current_user.role == "principal":
        target_roles = ["teacher", "student"]
    elif current_user.role == "teacher":
        target_roles = ["student"]
        
    return await user_crud.list_users(db, page, limit, is_deleted=deleted, allowed_roles=target_roles)


# ---------- GET BY ID ----------
@router.get("/{user_id}", response_model=UserRead)
async def get_user_api(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not check_role_hierarchy(current_user.role, user.role):
        raise HTTPException(status_code=403, detail="Insufficient permissions to view this user")
        
    return user


# ---------- UPDATE ----------
@router.put("/{user_id}", response_model=UserRead)
async def update_user_api(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not check_role_hierarchy(current_user.role, user.role):
        raise HTTPException(status_code=403, detail="Insufficient permissions to update this user")
        
    if data.role and not check_role_hierarchy(current_user.role, data.role):
        raise HTTPException(status_code=403, detail=f"Cannot change role to '{data.role}'")

    return await user_crud.update_user(db, user, data)


# ---------- SOFT DELETE ----------
@router.delete("/{user_id}")
async def delete_user_api(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not check_role_hierarchy(current_user.role, user.role):
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete this user")

    await user_crud.soft_delete_user(db, user)
    return {"status": "deleted"}


# ---------- RESTORE ----------
@router.post("/{user_id}/restore")
async def restore_user_api(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal", "teacher")),
):
    user = await user_crud.get_user_any(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not check_role_hierarchy(current_user.role, user.role):
        raise HTTPException(status_code=403, detail="Insufficient permissions to restore this user")

    await user_crud.restore_user(db, user)
    return {"status": "restored"}


# ---------- HARD DELETE ----------
@router.delete("/{user_id}/permanent")
async def hard_delete_user_api(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    user = await user_crud.get_user_any(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_crud.hard_delete_user(db, user)
    return {"status": "permanently_deleted"}