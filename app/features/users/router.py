from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.users.schemas import UserCreate, UserRead, UserUpdate
from app.features.users import service as user_crud
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/users", tags=["Users"])


# ---------- CREATE ----------
@router.post("/", response_model=UserRead)
async def create_user_api(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    return await user_crud.create_user(db, user_in)


# ---------- LIST ----------
@router.get("/")
async def list_users_api(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    return await user_crud.list_users(db)


# ---------- GET BY ID ----------
@router.get("/{user_id}", response_model=UserRead)
async def get_user_api(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------- UPDATE ----------
@router.put("/{user_id}", response_model=UserRead)
async def update_user_api(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await user_crud.update_user(db, user, data)


# ---------- SOFT DELETE ----------
@router.delete("/{user_id}")
async def delete_user_api(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_crud.soft_delete_user(db, user)
    return {"status": "deleted"}


# ---------- RESTORE ----------
@router.post("/{user_id}/restore")
async def restore_user_api(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_any(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_crud.restore_user(db, user)
    return {"status": "restored"}