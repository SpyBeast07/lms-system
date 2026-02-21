from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional

from .models import ActivityLog
from .schemas import ActivityLogCreate, PaginatedActivityLogs

async def log_action(db: AsyncSession, schema: ActivityLogCreate) -> ActivityLog:
    log = ActivityLog(
        user_id=schema.user_id,
        action=schema.action,
        entity_type=schema.entity_type,
        entity_id=schema.entity_id,
        details=schema.details
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

async def get_activity_logs(
    db: AsyncSession, 
    page: int = 1, 
    size: int = 20, 
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    exclude_actions: Optional[list] = None,
) -> PaginatedActivityLogs:
    
    query = select(ActivityLog).options(selectinload(ActivityLog.user))
    count_query = select(func.count()).select_from(ActivityLog)
    
    if user_id is not None:
        query = query.where(ActivityLog.user_id == user_id)
        count_query = count_query.where(ActivityLog.user_id == user_id)
        
    if action is not None:
        query = query.where(ActivityLog.action == action)
        count_query = count_query.where(ActivityLog.action == action)

    if exclude_actions:
        query = query.where(ActivityLog.action.not_in(exclude_actions))
        count_query = count_query.where(ActivityLog.action.not_in(exclude_actions))
        
    total = (await db.scalar(count_query)) or 0
    pages = (total + size - 1) // size
    
    stmt = query.order_by(desc(ActivityLog.created_at)).offset((page - 1) * size).limit(size)
    result = await db.scalars(stmt)
    items = result.all()
    
    return PaginatedActivityLogs(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )
