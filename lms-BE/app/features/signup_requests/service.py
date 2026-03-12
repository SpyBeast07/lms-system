from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from fastapi import HTTPException
from datetime import datetime, UTC
from typing import Optional

from .models import SignupRequest
from .schemas import SignupRequestCreate, SignupApprovalRequest, PaginatedSignupRequests, SignupRequestRead
from app.features.auth.security import hash_password
from app.features.users.models import User
from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate


async def _notify_admins(db: AsyncSession, request: SignupRequest, school_id: Optional[int] = None) -> None:
    """Fire a notification to every super_admin about a new signup request."""
    admin_ids = await db.scalars(
        select(User.id).where(
            User.role == "super_admin",
            User.is_deleted == False,
        )
    )
    for admin_id in admin_ids.all():
        await create_notification(
            db,
            NotificationCreate(
                user_id=admin_id,
                type="signup_request",
                message=f"New signup request from {request.name} ({request.email}) as {request.requested_role}.",
                entity_id=request.id,
            ),
            school_id=school_id
        )


async def create_signup_request(
    db: AsyncSession, data: SignupRequestCreate
) -> SignupRequest:
    if data.requested_role == "principal" and not data.school_id:
        raise HTTPException(
            status_code=400,
            detail="Principals must select a school to manage.",
        )
    # Check for duplicate email in users table
    existing_user = await db.scalar(
        select(User).where(User.email == data.email, User.is_deleted == False)
    )
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please log in.",
        )

    # Check for duplicate pending/approved request
    existing_req = await db.scalar(
        select(SignupRequest).where(SignupRequest.email == data.email)
    )
    if existing_req:
        if existing_req.status == "pending":
            raise HTTPException(
                status_code=409,
                detail="A signup request with this email is already pending admin review.",
            )
        elif existing_req.status == "approved":
            raise HTTPException(
                status_code=409,
                detail="This email has already been approved. Please log in.",
            )
        # Rejected — allow re-application by updating the existing record
        existing_req.name = data.name
        existing_req.password_hash = await hash_password(data.password)
        existing_req.requested_role = data.requested_role
        existing_req.school_id = data.school_id
        existing_req.status = "pending"
        existing_req.approved_role = None
        existing_req.approved_at = None
        existing_req.created_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(existing_req)
        await _notify_admins(db, existing_req, school_id=data.school_id)
        return existing_req

    password_hash = await hash_password(data.password)

    request = SignupRequest(
        name=data.name,
        email=data.email,
        password_hash=password_hash,
        requested_role=data.requested_role,
        school_id=data.school_id,
        status="pending",
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    await _notify_admins(db, request, school_id=data.school_id)
    return request


async def get_pending_requests(
    db: AsyncSession, page: int = 1, size: int = 20, target_role: str | None = None, school_id: Optional[int] = None
) -> PaginatedSignupRequests:
    count_query = select(func.count(SignupRequest.id)).where(SignupRequest.status == "pending")
    items_query = select(SignupRequest).where(SignupRequest.status == "pending")
    
    if school_id:
        count_query = count_query.where(SignupRequest.school_id == school_id)
        items_query = items_query.where(SignupRequest.school_id == school_id)

    if target_role:
        count_query = count_query.where(SignupRequest.requested_role == target_role)
        items_query = items_query.where(SignupRequest.requested_role == target_role)

    total = await db.scalar(count_query) or 0
    stmt = items_query.options(joinedload(SignupRequest.school)).order_by(SignupRequest.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.scalars(stmt)
    items = result.all()

    mapped_items = []
    for item in items:
        item_dict = {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "requested_role": item.requested_role,
            "approved_role": item.approved_role,
            "status": item.status,
            "school_id": item.school_id,
            "school_name": item.school.name if item.school else None,
            "created_at": item.created_at,
            "approved_at": item.approved_at,
        }
        mapped_items.append(SignupRequestRead(**item_dict))

    return PaginatedSignupRequests(
        items=mapped_items,
        total=total,
        page=page,
        size=size,
        pages=max(1, (total + size - 1) // size),
    )


async def get_all_requests(
    db: AsyncSession, page: int = 1, size: int = 20, target_role: str | None = None, school_id: Optional[int] = None
) -> PaginatedSignupRequests:
    count_query = select(func.count(SignupRequest.id))
    items_query = select(SignupRequest)

    if school_id:
        count_query = count_query.where(SignupRequest.school_id == school_id)
        items_query = items_query.where(SignupRequest.school_id == school_id)

    if target_role:
        count_query = count_query.where(SignupRequest.requested_role == target_role)
        items_query = items_query.where(SignupRequest.requested_role == target_role)

    total = await db.scalar(count_query) or 0
    stmt = items_query.options(joinedload(SignupRequest.school)).order_by(SignupRequest.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.scalars(stmt)
    items = result.all()

    mapped_items = []
    for item in items:
        item_dict = {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "requested_role": item.requested_role,
            "approved_role": item.approved_role,
            "status": item.status,
            "school_id": item.school_id,
            "school_name": item.school.name if item.school else None,
            "created_at": item.created_at,
            "approved_at": item.approved_at,
        }
        mapped_items.append(SignupRequestRead(**item_dict))

    return PaginatedSignupRequests(
        items=mapped_items,
        total=total,
        page=page,
        size=size,
        pages=max(1, (total + size - 1) // size),
    )


async def approve_signup_request(
    db: AsyncSession, request_id: int, data: SignupApprovalRequest, current_user: User
) -> SignupRequest:
    query = select(SignupRequest).where(SignupRequest.id == request_id)
    if current_user.role != "super_admin":
        query = query.where(SignupRequest.school_id == current_user.school_id)
        
    result = await db.execute(query)
    request = result.scalars().first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Signup request not found.")
    if request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {request.status}.",
        )

    # Determine final role (override or use requested)
    final_role = data.approved_role or request.requested_role

    if current_user.role == "super_admin" and final_role != "principal":
        raise HTTPException(status_code=403, detail="Super Admins can only approve principal requests")
    if current_user.role == "principal" and final_role != "teacher":
        raise HTTPException(status_code=403, detail="Principals can only approve teacher requests")
    if current_user.role == "teacher" and final_role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only approve student requests")

    # Check for duplicate email in users
    existing_user = await db.scalar(
        select(User).where(User.email == request.email, User.is_deleted == False)
    )
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists in the system.",
        )

    # Create the real User record
    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=request.password_hash,
        role=final_role,
        school_id=request.school_id
    )
    db.add(new_user)

    # Update the request
    request.status = "approved"
    request.approved_role = final_role
    request.approved_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(request)

    await log_action(db, ActivityLogCreate(
        user_id=current_user.id,
        action="signup_request_approved",
        entity_type="signup_request",
        entity_id=request.id,
        details=f"Signup request for '{request.name}' ({request.email}) approved as '{final_role}'"
    ), school_id=request.school_id)

    return request


async def reject_signup_request(
    db: AsyncSession, request_id: int, current_user: User
) -> SignupRequest:
    query = select(SignupRequest).where(SignupRequest.id == request_id)
    if current_user.role != "super_admin":
        query = query.where(SignupRequest.school_id == current_user.school_id)
        
    result = await db.execute(query)
    request = result.scalars().first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Signup request not found.")
    if request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {request.status}.",
        )

    if current_user.role == "super_admin" and request.requested_role != "principal":
        raise HTTPException(status_code=403, detail="Super Admins can only reject principal requests")
    if current_user.role == "principal" and request.requested_role != "teacher":
        raise HTTPException(status_code=403, detail="Principals can only reject teacher requests")
    if current_user.role == "teacher" and request.requested_role != "student":
        raise HTTPException(status_code=403, detail="Teachers can only reject student requests")

    request.status = "rejected"
    await db.commit()
    await db.refresh(request)

    await log_action(db, ActivityLogCreate(
        user_id=current_user.id,
        action="signup_request_rejected",
        entity_type="signup_request",
        entity_id=request.id,
        details=f"Signup request for '{request.name}' ({request.email}) rejected"
    ), school_id=request.school_id)

    return request
