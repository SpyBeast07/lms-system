from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.features.schools.models import School
from app.features.schools.schemas import SchoolCreate, SchoolUpdate
from app.features.users.models import User
from fastapi import HTTPException
from datetime import datetime, UTC
from typing import Optional

async def create_school(db: AsyncSession, school_in: SchoolCreate) -> School:
    db_school = School(**school_in.model_dump(exclude_none=True))
    db.add(db_school)
    await db.commit()
    await db.refresh(db_school)
    return db_school

async def get_school(db: AsyncSession, school_id: int) -> Optional[School]:
    result = await db.execute(select(School).where(School.id == school_id))
    return result.scalar_one_or_none()

async def list_schools(
    db: AsyncSession, 
    page: int = 1, 
    size: int = 10
) -> dict:
    skip = (page - 1) * size
    
    # Count total
    count_stmt = select(func.count()).select_from(School)
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Get items with principal
    stmt = (
        select(School, User)
        .outerjoin(User, (User.school_id == School.id) & (User.role == "principal") & (User.is_deleted == False))
        .order_by(desc(School.created_at))
        .offset(skip)
        .limit(size)
    )
    result = await db.execute(stmt)
    
    items = []
    # Distinct is handled generally, but for safety in iteration:
    for school, principal in result.all():
        school_dict = {
            "id": school.id,
            "name": school.name,
            "subscription_start": school.subscription_start,
            "subscription_end": school.subscription_end,
            "max_teachers": school.max_teachers,
            "created_at": school.created_at,
            "updated_at": school.updated_at,
            "principal": None
        }
        if principal:
            school_dict["principal"] = {
                "id": principal.id,
                "name": principal.name,
                "email": principal.email
            }
        items.append(school_dict)
    
    pages = (total + size - 1) // size
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

async def update_school(db: AsyncSession, school_id: int, school_in: SchoolUpdate) -> Optional[School]:
    db_school = await get_school(db, school_id)
    if not db_school:
        return None
        
    update_data = school_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_school, field, value)
        
    await db.commit()
    await db.refresh(db_school)
    return db_school

async def validate_subscription(db: AsyncSession, school_id: int):
    school = await get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=403, detail="School not found")
        
    if school.subscription_end < datetime.now(UTC):
        raise HTTPException(status_code=403, detail="Subscription expired")

async def get_school_teacher_count(db: AsyncSession, school_id: int) -> int:
    stmt = select(func.count()).select_from(User).where(
        User.school_id == school_id,
        User.role == "teacher",
        User.is_deleted == False
    )
    result = await db.execute(stmt)
    return result.scalar() or 0

async def validate_teacher_limit(db: AsyncSession, school_id: int):
    school = await get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=400, detail="School not found")
        
    count = await get_school_teacher_count(db, school_id)
    if count >= school.max_teachers:
        raise HTTPException(status_code=400, detail=f"Teacher limit reached ({school.max_teachers})")

async def assign_principal(db: AsyncSession, school_id: int, user_id: int) -> Optional[User]:
    from app.features.users.models import User
    result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == False))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    school = await get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    user.school_id = school_id
    user.role = "principal"
    await db.commit()
    await db.refresh(user)
    return user
