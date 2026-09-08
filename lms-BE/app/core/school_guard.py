from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, UTC
from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.features.schools.models import School
from sqlalchemy import select

async def validate_school_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to validate that the school associated with the current user 
    has an active subscription. Super admins bypass this check.
    """
    if current_user.role == "super_admin":
        return None

    if not current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any school"
        )

    # Fetch school
    result = await db.execute(select(School).where(School.id == current_user.school_id))
    school = result.scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated school not found"
        )

    if school.subscription_end < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="School subscription has expired. Access denied."
        )

    return school
