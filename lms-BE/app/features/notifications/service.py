from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from .models import Notification
from .schemas import NotificationCreate

async def create_notification(db: AsyncSession, schema: NotificationCreate) -> Notification:
    notification = Notification(
        user_id=schema.user_id,
        type=schema.type,
        message=schema.message
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def get_user_notifications(db: AsyncSession, user_id: int) -> List[Notification]:
    stmt = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    result = await db.scalars(stmt)
    return result.all()

async def mark_notification_read(db: AsyncSession, notification_id: int, user_id: int) -> Notification | None:
    result = await db.scalars(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))
    notification = result.first()
    if notification:
        notification.is_read = True
        await db.commit()
        await db.refresh(notification)
    return notification

async def mark_all_read(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
