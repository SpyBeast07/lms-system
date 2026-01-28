from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.users.schemas import UserCreate, UserRead, UserUpdate
from app.features.users import service as user_crud
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/users", tags=["Users"])


# ---------- CREATE ----------
@router.post("/", response_model=UserRead)
def create_user_api(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    return user_crud.create_user(db, user_in)


# ---------- LIST ----------
@router.get("/")
def list_users_api(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin")),
):
    return user_crud.list_users(db)


# ---------- GET BY ID ----------
@router.get("/{user_id}", response_model=UserRead)
def get_user_api(user_id: int, db: Session = Depends(get_db)):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------- UPDATE ----------
@router.put("/{user_id}", response_model=UserRead)
def update_user_api(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user_crud.update_user(db, user, data)


# ---------- SOFT DELETE ----------
@router.delete("/{user_id}")
def delete_user_api(user_id: int, db: Session = Depends(get_db)):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_crud.soft_delete_user(db, user)
    return {"status": "deleted"}


# ---------- RESTORE ----------
@router.post("/{user_id}/restore")
def restore_user_api(user_id: int, db: Session = Depends(get_db)):
    user = user_crud.get_user_any(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_crud.restore_user(db, user)
    return {"status": "restored"}