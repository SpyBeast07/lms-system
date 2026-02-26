from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.schemas import UserRead
from . import schemas, service

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

@router.get("/my", response_model=schemas.PaginatedActivityLogs)
async def get_my_logs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Any authenticated user can view their own work-related activity logs (auth events excluded)."""
    AUTH_ACTIONS = ["login", "logout", "refresh_token"]
    return await service.get_activity_logs(
        db=db,
        page=page,
        size=size,
        user_id=current_user.id,
        exclude_actions=AUTH_ACTIONS,
        school_id=current_user.school_id
    )

@router.get("/", response_model=schemas.PaginatedActivityLogs)
async def get_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Admin/Principal endpoint to fetch paginated and filtered activity logs."""
    if current_user.role not in ("super_admin", "principal"):
        raise HTTPException(status_code=403, detail="Only admins or principals can view activity logs")
        
    target_role = "teacher" if current_user.role == "principal" else None
    school_id = current_user.school_id if current_user.role != "super_admin" else None
        
    return await service.get_activity_logs(
        db=db, 
        page=page, 
        size=size, 
        user_id=user_id, 
        action=action,
        user_role=target_role,
        school_id=school_id
    )
