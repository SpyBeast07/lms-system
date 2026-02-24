from typing import Optional
from datetime import datetime, UTC
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.features.users.models import User
from app.features.users.schemas import UserCreate
from app.features.auth.hashing import hash_password
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate

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
    await db.refresh(user)  # refresh before reading attributes

    await log_action(db, ActivityLogCreate(
        action="user_created",
        entity_type="user",
        entity_id=user.id,
        details=f"User '{user.name}' ({user.email}) created with role '{user.role}'"
    ))

    return user


async def list_users(db: AsyncSession, page: int = 1, limit: int = 10, is_deleted: Optional[bool] = None, allowed_roles: Optional[list] = None):
    skip = (page - 1) * limit

    query = select(User).order_by(User.id.desc())
    count_query = select(func.count(User.id))

    if is_deleted is not None:
        query = query.filter(User.is_deleted == is_deleted)
        count_query = count_query.filter(User.is_deleted == is_deleted)

    if allowed_roles:
        query = query.filter(User.role.in_(allowed_roles))
        count_query = count_query.filter(User.role.in_(allowed_roles))

    result = await db.execute(query.offset(skip).limit(limit))
    items = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    return {"items": items, "total": total, "page": page, "limit": limit}


async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(User).filter(User.id == user_id, User.is_deleted == False)
    )
    return result.scalars().first()


async def get_user_any(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalars().first()


async def update_user(db: AsyncSession, user: User, data):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    user.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)
    return user


async def soft_delete_user(db: AsyncSession, user: User):
    # Capture values BEFORE commit — commit expires all ORM attributes
    uid, uname, uemail = user.id, user.name, user.email
    user.is_deleted = True
    user.updated_at = datetime.now(UTC)
    await db.commit()

    await log_action(db, ActivityLogCreate(
        action="user_deleted",
        entity_type="user",
        entity_id=uid,
        details=f"User '{uname}' ({uemail}) deleted"
    ))


async def restore_user(db: AsyncSession, user: User):
    # Capture values BEFORE commit — commit expires all ORM attributes
    uid, uname, uemail = user.id, user.name, user.email
    user.is_deleted = False
    user.updated_at = datetime.now(UTC)
    await db.commit()

    await log_action(db, ActivityLogCreate(
        action="user_restored",
        entity_type="user",
        entity_id=uid,
        details=f"User '{uname}' ({uemail}) restored"
    ))


async def hard_delete_user(db: AsyncSession, user: User):
    await db.delete(user)
    await db.commit()