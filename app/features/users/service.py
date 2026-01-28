from sqlalchemy.orm import Session
from app.features.users.models import User
from app.features.users.schemas import UserCreate
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

def list_users(db: Session):
    return (
        db.query(User)
        .filter(User.is_deleted == False)
        .all()
    )

def get_user(db: Session, user_id: int):
    return (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_deleted == False
        )
        .first()
    )

def update_user(db: Session, user: User, data):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    user.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return user

def soft_delete_user(db: Session, user: User):
    user.is_deleted = True
    user.updated_at = datetime.now(UTC)
    db.commit()

def restore_user(db: Session, user: User):
    user.is_deleted = False
    user.updated_at = datetime.now(UTC)
    db.commit()

def hard_delete_user(db: Session, user: User):
    db.delete(user)
    db.commit()