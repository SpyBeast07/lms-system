from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserRead
from app.crud.user import create_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserRead)
def create_user_api(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    return create_user(db, user_in)