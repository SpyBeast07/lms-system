from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.schemas import UserRead
from . import schemas, service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

@router.get("/", response_model=List[schemas.NotificationRead])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Get all notifications for the current user."""
    return await service.get_user_notifications(db, current_user.id, school_id=current_user.school_id)

@router.patch("/{notification_id}/read", response_model=schemas.NotificationRead)
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Mark a specific notification as read."""
    notification = await service.mark_notification_read(db, notification_id, current_user.id, school_id=current_user.school_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Mark all notifications as read for the current user."""
    await service.mark_all_read(db, current_user.id, school_id=current_user.school_id)
    return None
