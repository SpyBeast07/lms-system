from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.users.schemas import UserCreate, UserRead, UserUpdate
from app.features.users import service as user_crud
from app.features.auth.dependencies import require_role, check_role_hierarchy
from app.core.pagination import PaginatedResponse

router = APIRouter(prefix="/users", tags=["Users"])

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User


# ---------- CREATE ----------
@router.post("/", response_model=UserRead)
async def create_user_api(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "principal", "teacher")),
    school_info = Depends(validate_school_subscription)
):
    if current_user.role == "super_admin" and user_in.role not in ["super_admin", "principal"]:
        raise HTTPException(status_code=403, detail="Super Admins can only create Super Admins and Principals")
    elif current_user.role == "principal" and user_in.role != "teacher":
        raise HTTPException(status_code=403, detail="Principals can only create Teachers")
    elif current_user.role == "teacher" and user_in.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only create Students")

    # Super admin can pass a school_id in the body (e.g. when creating a principal for a specific school).
    # For all other roles, fall back to the creator's own school_id.
    effective_school_id = user_in.school_id if current_user.role == "super_admin" else current_user.school_id
    return await user_crud.create_user(db, user_in, school_id=effective_school_id)


# ---------- LIST ----------
@router.get("/", response_model=PaginatedResponse[UserRead])
async def list_users_api(
    page: int = 1,
    limit: int = 10,
    deleted: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "principal", "teacher")),
    school_info = Depends(validate_school_subscription)
):
    target_roles = []
    if current_user.role == "super_admin":
        target_roles = ["super_admin", "principal"]
    elif current_user.role == "principal":
        target_roles = ["teacher"]
    elif current_user.role == "teacher":
        target_roles = ["student"]
    
    # Pass school_id filter unless super_admin
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    return await user_crud.list_users(db, page, limit, is_deleted=deleted, allowed_roles=target_roles, school_id=school_id)


# ---------- GET BY ID ----------
@router.get("/{user_id}", response_model=UserRead)
async def get_user_api(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "principal", "teacher")),
    school_info = Depends(validate_school_subscription)
):
    # Pass school_id filter unless super_admin
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    user = await user_crud.get_user(db, user_id, school_id=school_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role == "super_admin" and user.role not in ["super_admin", "principal"]:
        raise HTTPException(status_code=403, detail="Super Admins can only view Super Admins and Principals")
    elif current_user.role == "principal" and user.role != "teacher":
        raise HTTPException(status_code=403, detail="Principals can only view Teachers")
    elif current_user.role == "teacher" and user.role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only view Students")
        
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