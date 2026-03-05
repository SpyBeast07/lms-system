from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.features.courses.schemas_assignment import (
    AssignmentRead,
    AssignmentTeacherRead,
    StudentAssignmentCreate,
    StudentAssignmentRead,
)
from app.features.courses.models_assignment import Assignment
from app.features.courses.models_question import Question
from app.features.courses.models_student_assignment import StudentAssignment
from app.features.courses.models_answer import StudentAnswer
from app.features.courses.service_assignment import create_student_attempt
from app.features.auth.dependencies import require_role
from app.features.users.models import User
from app.core.school_guard import validate_school_subscription

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.get("/{assignment_id}")
async def get_assignment_details(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "student", "admin", "principal")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    
    # Load with questions and options
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.questions).selectinload(Question.options),
            selectinload(Assignment.material)
        )
        .filter(Assignment.material_id == assignment_id)
    )
    result = await db.execute(stmt)
    assignment = result.scalars().first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check school isolation
    if school_id and assignment.material.school_id != school_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if current_user.role in ["teacher", "admin", "principal"]:
        return AssignmentTeacherRead.model_validate(assignment)
    
    return AssignmentRead.model_validate(assignment)

@router.post("/submit", response_model=StudentAssignmentRead)
async def submit_assignment_attempt_api(
    data: StudentAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("student")),
    school_info = Depends(validate_school_subscription)
):
    return await create_student_attempt(db, current_user.id, data, school_id=current_user.school_id)

@router.get("/attempts/{attempt_id}")
async def get_attempt_details_api(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "student", "admin", "principal")),
    school_info = Depends(validate_school_subscription)
):
    stmt = (
        select(StudentAssignment)
        .options(
            selectinload(StudentAssignment.answers)
            .selectinload(StudentAnswer.question)
            .selectinload(Question.options)
        )
        .filter(StudentAssignment.id == attempt_id)
    )
    result = await db.execute(stmt)
    attempt = result.scalars().first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if current_user.role in ["teacher", "admin", "principal"]:
        from app.features.courses.schemas_assignment import StudentAssignmentTeacherRead
        return StudentAssignmentTeacherRead.model_validate(attempt)
    
    return StudentAssignmentRead.model_validate(attempt)
