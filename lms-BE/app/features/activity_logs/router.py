from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.schemas import UserRead
from . import schemas, service

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

@router.get("/", response_model=schemas.PaginatedActivityLogs)
async def get_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to fetch paginated and filtered activity logs."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only admins can view activity logs")
        
    return await service.get_activity_logs(
        db=db, 
        page=page, 
        size=size, 
        user_id=user_id, 
        action=action
    )
