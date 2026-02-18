from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.features.users.models import User
from app.features.users.schemas import UserCreate
from datetime import datetime, UTC
from app.features.auth.hashing import hash_password

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=await hash_password(user_in.password),
        role=user_in.role,
        created_at=datetime.now(UTC),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def list_users(db: AsyncSession):
    result = await db.execute(
        select(User).filter(User.is_deleted == False)
    )
    return result.scalars().all()

async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(User).filter(
            User.id == user_id,
            User.is_deleted == False
        )
    )
    return result.scalars().first()

async def get_user_any(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(User).filter(User.id == user_id)
    )
    return result.scalars().first()

async def update_user(db: AsyncSession, user: User, data):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    user.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)
    return user

async def soft_delete_user(db: AsyncSession, user: User):
    user.is_deleted = True
    user.updated_at = datetime.now(UTC)
    await db.commit()

async def restore_user(db: AsyncSession, user: User):
    user.is_deleted = False
    user.updated_at = datetime.now(UTC)
    await db.commit()

async def hard_delete_user(db: AsyncSession, user: User):
    await db.delete(user)
    await db.commit()