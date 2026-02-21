from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List

from .models import Submission
from .schemas import SubmissionCreate, SubmissionGrade
from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate
from fastapi import HTTPException
from app.features.courses.models_assignment import Assignment
from app.features.courses.models_materials import LearningMaterial
from app.features.enrollments.models_teacher import TeacherCourse
from app.core.storage import get_minio_client

async def create_submission(db: AsyncSession, student_id: int, schema: SubmissionCreate) -> Submission:
    # 1. Check for duplicates
    result = await db.scalars(
        select(Submission)
        .where(Submission.student_id == student_id)
        .where(Submission.assignment_id == schema.assignment_id)
    )
    existing = result.first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment.")
        
    # 2. Check deadline enforcement
    assignment_result = await db.scalars(
        select(Assignment).where(Assignment.material_id == schema.assignment_id)
    )
    assignment = assignment_result.first()
    
    if assignment and assignment.due_date:
        # assignment.due_date is typically scalar datetime.date or mapped string. Let's cast to str to compare if it's string or use date comparison
        current_date_str = datetime.utcnow().date().isoformat()
        due_date_str = assignment.due_date.isoformat() if hasattr(assignment.due_date, 'isoformat') else str(assignment.due_date)
        if current_date_str > due_date_str:
            raise HTTPException(status_code=400, detail="Submission deadline has passed.")

    submission = Submission(
        student_id=student_id,
        assignment_id=schema.assignment_id,
        file_url=str(schema.file_url),
        object_name=schema.object_name,
        comments=schema.comments,
    )
    db.add(submission)

    await db.commit()
    await db.refresh(submission)
    
    await log_action(db, ActivityLogCreate(
        user_id=student_id,
        action="submit_assignment",
        entity_type="submission",
        entity_id=submission.id,
        details=f"Student {student_id} submitted to assignment {schema.assignment_id}"
    ))
    
    # Refetch with student loaded to match SubmissionRead schema
    result = await db.scalars(
        select(Submission)
        .options(selectinload(Submission.student))
        .where(Submission.id == submission.id)
    )
    sub = result.first()
    if sub and sub.object_name:
        try:
            sub.file_url = get_minio_client().generate_presigned_url(sub.object_name, expiry=3600)
        except Exception:
            pass
            
    return sub

async def get_student_submissions(db: AsyncSession, student_id: int, limit: int = 100, offset: int = 0) -> dict:
    stmt = select(Submission).options(selectinload(Submission.student)).where(Submission.student_id == student_id).order_by(Submission.submitted_at.desc())
    count = (await db.scalar(select(func.count(Submission.id)).where(Submission.student_id == student_id))) or 0
    results = (await db.scalars(stmt.offset(offset).limit(limit))).all()
    
    minio_client = get_minio_client()
    for sub in results:
        if sub.object_name:
            try:
                sub.file_url = minio_client.generate_presigned_url(sub.object_name, expiry=3600)
            except Exception:
                pass
                
    return {"total_count": count, "results": results}

async def _verify_teacher_course(db: AsyncSession, teacher_id: int, assignment_id: int):
    # Get course_id for this assignment
    material_result = await db.scalars(
        select(LearningMaterial).where(LearningMaterial.id == assignment_id)
    )
    material = material_result.first()
    if not material:
        raise HTTPException(status_code=404, detail="Assignment not found.")
        
    # Check teacher_course mapping
    teacher_mapping_result = await db.scalars(
        select(TeacherCourse).where(
            TeacherCourse.teacher_id == teacher_id,
            TeacherCourse.course_id == material.course_id
        )
    )
    teacher_mapping = teacher_mapping_result.first()
    if not teacher_mapping:
        raise HTTPException(status_code=403, detail="You do not teach this course.")

async def get_assignment_submissions(db: AsyncSession, assignment_id: int, teacher_id: int, limit: int = 100, offset: int = 0) -> dict:
    await _verify_teacher_course(db, teacher_id, assignment_id)
    
    stmt = select(Submission).options(selectinload(Submission.student)).where(Submission.assignment_id == assignment_id).order_by(Submission.submitted_at.desc())
    count = (await db.scalar(select(func.count(Submission.id)).where(Submission.assignment_id == assignment_id))) or 0
    results = (await db.scalars(stmt.offset(offset).limit(limit))).all()
    
    minio_client = get_minio_client()
    for sub in results:
        if sub.object_name:
            try:
                sub.file_url = minio_client.generate_presigned_url(sub.object_name, expiry=3600)
            except Exception:
                pass
                
    return {"total_count": count, "results": results}

async def grade_submission(db: AsyncSession, submission_id: int, teacher_id: int, schema: SubmissionGrade) -> Submission:
    result = await db.scalars(
        select(Submission)
        .options(selectinload(Submission.student))
        .where(Submission.id == submission_id)
    )
    submission = result.first()
    if not submission:
        return None
        
    await _verify_teacher_course(db, teacher_id, submission.assignment_id)
    
    submission.grade = schema.grade
    submission.feedback = schema.feedback
    submission.graded_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(submission)
    
    # Trigger notification
    await create_notification(db, NotificationCreate(
        user_id=submission.student_id,
        type="assignment_graded",
        message=f"Your assignment submission has been graded: {schema.grade}/100"
    ))
    
    await log_action(db, ActivityLogCreate(
        user_id=teacher_id,
        action="assignment_graded",
        entity_type="submission",
        entity_id=submission.id,
        details=f"Graded submission {submission.id} with {schema.grade}/100"
    ))
    
    # Refetch with student loaded to avoid MissingGreenlet after refresh
    result = await db.scalars(
        select(Submission)
        .options(selectinload(Submission.student))
        .where(Submission.id == submission.id)
    )
    sub = result.first()
    if sub and sub.object_name:
        try:
            sub.file_url = get_minio_client().generate_presigned_url(sub.object_name, expiry=3600)
        except Exception:
            pass
            
    return sub
