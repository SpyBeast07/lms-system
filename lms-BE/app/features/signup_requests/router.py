from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user, require_role
from . import service
from .schemas import (
    SignupRequestCreate,
    SignupRequestRead,
    SignupApprovalRequest,
    PaginatedSignupRequests,
)

router = APIRouter(tags=["Signup Requests"])


@router.post("/signup", response_model=SignupRequestRead, status_code=201)
async def submit_signup_request(
    data: SignupRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — submit an account request for admin review."""
    return await service.create_signup_request(db, data)


@router.get("/signup-requests", response_model=PaginatedSignupRequests)
async def list_signup_requests(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    show_all: bool = Query(False, description="Include approved/rejected requests"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    """Admin only — list pending (or all) signup requests."""
    if show_all:
        return await service.get_all_requests(db, page, size)
    return await service.get_pending_requests(db, page, size)


@router.patch("/signup-requests/{request_id}/approve", response_model=SignupRequestRead)
async def approve_request(
    request_id: int,
    data: SignupApprovalRequest = SignupApprovalRequest(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    """Admin only — approve a signup request, optionally overriding the role."""
    return await service.approve_signup_request(db, request_id, data)


@router.patch("/signup-requests/{request_id}/reject", response_model=SignupRequestRead)
async def reject_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    """Admin only — reject a signup request."""
    return await service.reject_signup_request(db, request_id)
