from sqlalchemy.orm import Session
from app.db.models.user import User
from app.schemas.user import UserCreate
from datetime import datetime, UTC
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        created_at=datetime.now(UTC),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user