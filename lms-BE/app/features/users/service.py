from typing import Optional
from datetime import datetime, UTC
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.features.users.models import User
from app.features.users.schemas import UserCreate
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



async def list_users(db: AsyncSession, page: int = 1, limit: int = 10, is_deleted: Optional[bool] = None):
    # Skip calculation
    skip = (page - 1) * limit
    
    # Base queries
    query = select(User)
    count_query = select(func.count(User.id))
    
    # Apply filter if provided
    if is_deleted is not None:
        query = query.filter(User.is_deleted == is_deleted)
        count_query = count_query.filter(User.is_deleted == is_deleted)
    
    # Get items
    result = await db.execute(
        query.offset(skip).limit(limit)
    )
    items = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

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