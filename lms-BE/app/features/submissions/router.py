from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.rate_limiter import limiter

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.schemas import UserRead
from . import schemas, service

router = APIRouter(prefix="/submissions", tags=["Submissions"])

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

@router.post("/", response_model=schemas.SubmissionRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def submit_assignment(
    request: Request,
    schema: schemas.SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Students post a submission to an assignment."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
        
    return await service.create_submission(db, current_user.id, schema, school_id=current_user.school_id)

@router.get("/student/{student_id}", response_model=schemas.PaginatedSubmissions)
async def get_submissions_by_student(
    student_id: int,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Students fetch their submissions."""
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Can only view your own submissions")
        
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    return await service.get_student_submissions(db, student_id, school_id=school_id, limit=limit, offset=offset)

@router.get("/assignment/{assignment_id}", response_model=schemas.PaginatedSubmissions)
async def get_submissions_by_assignment(
    assignment_id: int,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Teachers view all submissions for an assignment."""
    if current_user.role not in ["teacher", "super_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    return await service.get_assignment_submissions(db, assignment_id, current_user.id, school_id=school_id, limit=limit, offset=offset)

@router.patch("/{submission_id}/grade", response_model=schemas.SubmissionRead)
async def grade_submission(
    submission_id: int,
    schema: schemas.SubmissionGrade,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    school_info = Depends(validate_school_subscription)
):
    """Teachers grade a submission."""
    if current_user.role not in ["teacher", "super_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    submission = await service.grade_submission(db, submission_id, current_user.id, school_id=school_id, schema=schema)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission
