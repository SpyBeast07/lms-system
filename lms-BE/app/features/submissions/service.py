from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional

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
from app.features.enrollments.models_student import StudentCourse
from app.features.courses.models_student_assignment import StudentAssignment
from app.features.users.models import User
from app.core.storage import get_minio_client

async def create_submission(db: AsyncSession, student_id: int, schema: SubmissionCreate, school_id: int) -> Submission:
    # 1. Fetch assignment and check deadline
    assignment_result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.material))
        .where(Assignment.material_id == schema.assignment_id)
    )
    assignment = assignment_result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    if assignment.due_date:
        current_date = datetime.utcnow().date()
        if current_date > assignment.due_date:
            raise HTTPException(status_code=400, detail="Submission deadline has passed.")

    # 2. Check student enrollment
    stmt_enroll = select(StudentCourse).filter(
        StudentCourse.student_id == student_id,
        StudentCourse.course_id == assignment.material.course_id
    )
    res_enroll = await db.execute(stmt_enroll)
    if not res_enroll.scalars().first():
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # 3. Check for attempt limits
    current_attempts = await db.scalar(
        select(func.count(Submission.id))
        .where(Submission.student_id == student_id)
        .where(Submission.assignment_id == schema.assignment_id)
    )
    
    if current_attempts >= assignment.max_attempts:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum attempts ({assignment.max_attempts}) reached for this assignment."
        )

    submission = Submission(
        student_id=student_id,
        assignment_id=schema.assignment_id,
        school_id=school_id,
        file_url=str(schema.file_url),
        object_name=schema.object_name,
        comments=schema.comments,
    )
    db.add(submission)

    await db.commit()
    await db.refresh(submission)
    
    await log_action(db, ActivityLogCreate(
        user_id=student_id,
        course_id=assignment.material.course_id,
        action="submit_assignment",
        entity_type="submission",
        entity_id=submission.id,
        details=f"Student {student_id} submitted to assignment {schema.assignment_id} in school {school_id}"
    ), school_id=school_id)
    
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

async def get_student_submissions(db: AsyncSession, student_id: int, school_id: int, limit: int = 100, offset: int = 0) -> dict:
    # 1. Fetch File Submissions
    sub_stmt = select(Submission).options(
        selectinload(Submission.student),
        selectinload(Submission.assignment).selectinload(Assignment.material)
    ).where(
        Submission.student_id == student_id,
        Submission.school_id == school_id
    ).order_by(Submission.submitted_at.desc())
    
    file_submissions = (await db.scalars(sub_stmt)).all()
    
    # 2. Fetch Assessment Attempts (MCQ/TEXT)
    adv_stmt = select(StudentAssignment).options(
        selectinload(StudentAssignment.student),
        selectinload(StudentAssignment.assignment).selectinload(Assignment.material)
    ).where(
        StudentAssignment.student_id == student_id
    ).order_by(StudentAssignment.submitted_at.desc())
    
    assessment_attempts = (await db.scalars(adv_stmt)).all()
    
    # 3. Standardize into Unified format
    unified_results = []
    minio_client = get_minio_client()
    
    # Standardize File Submissions
    for sub in file_submissions:
        file_url = sub.file_url
        obj_name = sub.object_name

        # Fallback for older submissions that lack an explicitly tracked object_name
        if not obj_name and file_url and '/lms-files/' in file_url:
            obj_name = file_url.split('/lms-files/')[-1]

        if obj_name:
            try:
                file_url = minio_client.generate_presigned_url(obj_name, expiry=3600)
            except Exception as e:
                print(f"Failed to generate presigned URL for {obj_name}: {e}")
        
        unified_results.append({
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "submission_type": "FILE_UPLOAD",
            "title": sub.assignment.material.title if sub.assignment and sub.assignment.material else "Unknown",
            "submitted_at": sub.submitted_at,
            "status": "graded" if sub.graded_at else "submitted",
            "file_url": file_url,
            "grade": sub.grade,
            "total_marks": sub.assignment.total_marks if sub.assignment else None,
            "feedback": sub.feedback,
            "student": sub.student
        })

    # Standardize Assessment Attempts
    for att in assessment_attempts:
        unified_results.append({
            "id": att.id,
            "assignment_id": att.assignment_id,
            "student_id": att.student_id,
            "submission_type": att.assignment.assignment_type if att.assignment else "MCQ",
            "title": att.assignment.material.title if att.assignment and att.assignment.material else "Assessment",
            "submitted_at": att.submitted_at,
            "status": att.status,
            "total_score": float(att.total_score) if att.total_score is not None else None,
            "total_marks": att.assignment.total_marks if att.assignment else None,
            "attempt_number": att.attempt_number,
            "student": att.student
        })

    # Sort combined list by submitted_at desc
    unified_results.sort(key=lambda x: (x["submitted_at"].replace(tzinfo=None) if x["submitted_at"] else datetime.min), reverse=True)
    
    total_count = len(unified_results)
    # Apply pagination manually on the combined list
    paged_results = unified_results[offset : offset + limit]
    
    return {"total_count": total_count, "results": paged_results}

async def _verify_teacher_course(db: AsyncSession, teacher_id: int, assignment_id: int, school_id: Optional[int] = None):
    # Get course_id for this assignment
    query = select(LearningMaterial).where(LearningMaterial.id == assignment_id)
    if school_id:
        query = query.filter(LearningMaterial.school_id == school_id)
        
    material_result = await db.scalars(query)
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
    return material

async def get_assignment_submissions(db: AsyncSession, assignment_id: int, teacher_id: int, school_id: int, limit: int = 100, offset: int = 0) -> dict:
    await _verify_teacher_course(db, teacher_id, assignment_id, school_id)
    
    # 1. Fetch File Submissions
    sub_stmt = select(Submission).options(
        selectinload(Submission.student),
        selectinload(Submission.assignment).selectinload(Assignment.material)
    ).where(
        Submission.assignment_id == assignment_id,
        Submission.school_id == school_id
    ).order_by(Submission.submitted_at.desc())
    
    file_submissions = (await db.scalars(sub_stmt)).all()

    # 2. Fetch Assessment Attempts
    adv_stmt = select(StudentAssignment).options(
        selectinload(StudentAssignment.student),
        selectinload(StudentAssignment.assignment).selectinload(Assignment.material)
    ).where(
        StudentAssignment.assignment_id == assignment_id
    ).order_by(StudentAssignment.submitted_at.desc())
    
    assessment_attempts = (await db.scalars(adv_stmt)).all()

    # 3. Standardize
    unified_results = []
    minio_client = get_minio_client()

    for sub in file_submissions:
        file_url = sub.file_url
        obj_name = sub.object_name
        
        if not obj_name and file_url and '/lms-files/' in file_url:
            obj_name = file_url.split('/lms-files/')[-1]
            
        if obj_name:
            try:
                file_url = minio_client.generate_presigned_url(obj_name, expiry=3600)
            except Exception as e:
                print(f"Failed to generate presigned URL for {obj_name}: {e}")
        
        unified_results.append({
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "submission_type": "FILE_UPLOAD",
            "title": "File Submission",
            "submitted_at": sub.submitted_at,
            "status": "graded" if sub.graded_at else "submitted",
            "file_url": file_url,
            "grade": sub.grade,
            "total_marks": sub.assignment.total_marks if sub.assignment else None,
            "feedback": sub.feedback,
            "student": sub.student
        })

    for att in assessment_attempts:
        unified_results.append({
            "id": att.id,
            "assignment_id": att.assignment_id,
            "student_id": att.student_id,
            "submission_type": att.assignment.assignment_type if att.assignment else "MCQ",
            "title": "Assessment Attempt",
            "submitted_at": att.submitted_at,
            "status": att.status,
            "total_score": float(att.total_score) if att.total_score is not None else None,
            "total_marks": att.assignment.total_marks if att.assignment else None,
            "attempt_number": att.attempt_number,
            "student": att.student
        })

    unified_results.sort(key=lambda x: (x["submitted_at"].replace(tzinfo=None) if x["submitted_at"] else datetime.min), reverse=True)
    
    total_count = len(unified_results)
    paged_results = unified_results[offset : offset + limit]
    
    return {"total_count": total_count, "results": paged_results}

async def grade_submission(db: AsyncSession, submission_id: int, teacher_id: int, school_id: int, schema: SubmissionGrade) -> dict:
    if schema.submission_type == "FILE_UPLOAD":
        result = await db.execute(
            select(Submission)
            .options(
                selectinload(Submission.student),
                selectinload(Submission.assignment).selectinload(Assignment.material)
            )
            .where(Submission.id == submission_id, Submission.school_id == school_id)
        )
        submission = result.scalar_one_or_none()
        if not submission:
            return None
            
        await _verify_teacher_course(db, teacher_id, submission.assignment_id, school_id)
        
        submission.grade = schema.grade
        submission.feedback = schema.feedback
        submission.graded_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(submission)
        
        # Trigger notification
        max_m = submission.assignment.total_marks if submission.assignment and submission.assignment.total_marks else 100
        await create_notification(db, NotificationCreate(
            user_id=submission.student_id,
            type="assignment_graded",
            message=f"Your assignment submission has been graded: {schema.grade}/{max_m}",
            entity_id=submission.id
        ), school_id=school_id)
        
        await log_action(db, ActivityLogCreate(
            user_id=teacher_id,
            course_id=submission.assignment.material.course_id,
            action="assignment_graded",
            entity_type="submission",
            entity_id=submission.id,
            details=f"Graded submission {submission.id} with {schema.grade}/{max_m}"
        ), school_id=school_id)
        
        # Refetch to get unified output format
        file_url = submission.file_url
        obj_name = submission.object_name
        
        if not obj_name and file_url and '/lms-files/' in file_url:
            obj_name = file_url.split('/lms-files/')[-1]
            
        if obj_name:
            try:
                minio_client = get_minio_client()
                file_url = minio_client.generate_presigned_url(obj_name, expiry=3600)
            except Exception as e:
                print(f"Failed to generate presigned URL after grading for {obj_name}: {e}")
                
        return {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "student_id": submission.student_id,
            "submission_type": "FILE_UPLOAD",
            "title": "File Submission",
            "submitted_at": submission.submitted_at,
            "status": "graded" if submission.graded_at else "submitted",
            "file_url": file_url,
            "grade": submission.grade,
            "total_marks": submission.assignment.total_marks if submission.assignment else None,
            "feedback": submission.feedback,
            "student": submission.student
        }
    else:
        # It's an MCQ or TEXT assessment
        result = await db.execute(
            select(StudentAssignment)
            .options(
                selectinload(StudentAssignment.student),
                selectinload(StudentAssignment.assignment).selectinload(Assignment.material)
            )
            .where(StudentAssignment.id == submission_id)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            return None
            
        await _verify_teacher_course(db, teacher_id, attempt.assignment_id, school_id)
        
        attempt.total_score = schema.grade
        attempt.teacher_feedback = schema.feedback
        attempt.status = "evaluated"
        
        await db.commit()
        await db.refresh(attempt)
        
        # Trigger notification
        await create_notification(db, NotificationCreate(
            user_id=attempt.student_id,
            type="assignment_graded",
            message=f"Your assessment attempt has been graded: {schema.grade}/{attempt.assignment.total_marks if attempt.assignment else 100}",
            entity_id=attempt.id
        ), school_id=school_id)
        
        return {
            "id": attempt.id,
            "assignment_id": attempt.assignment_id,
            "student_id": attempt.student_id,
            "submission_type": attempt.assignment.assignment_type if attempt.assignment else "MCQ",
            "title": "Assessment Attempt",
            "submitted_at": attempt.submitted_at,
            "status": attempt.status,
            "total_score": float(attempt.total_score) if attempt.total_score is not None else None,
            "total_marks": attempt.assignment.total_marks if attempt.assignment else None,
            "attempt_number": attempt.attempt_number,
            "feedback": attempt.teacher_feedback,
            "student": attempt.student
        }

async def get_all_teacher_submissions(
    db: AsyncSession, 
    teacher_id: int, 
    school_id: int, 
    course_id: Optional[int] = None,
    student_name: Optional[str] = None,
    limit: int = 10, 
    offset: int = 0
) -> dict:
    # 1. Get Teacher's assigned Courses
    teacher_courses_stmt = select(TeacherCourse.course_id).where(TeacherCourse.teacher_id == teacher_id)
    teacher_course_ids = (await db.scalars(teacher_courses_stmt)).all()
    
    if not teacher_course_ids:
        return {"total_count": 0, "results": []}

    # If course_id filter is provided, ensure it's one of the teacher's courses
    target_course_ids = [course_id] if course_id and course_id in teacher_course_ids else teacher_course_ids

    # 2. Fetch File Submissions
    sub_stmt = select(Submission).join(Assignment, Submission.assignment_id == Assignment.material_id).join(LearningMaterial, Assignment.material_id == LearningMaterial.id).join(User, Submission.student_id == User.id).options(
        selectinload(Submission.student),
        selectinload(Submission.assignment).selectinload(Assignment.material)
    ).where(
        LearningMaterial.course_id.in_(target_course_ids),
        Submission.school_id == school_id
    )
    
    if student_name:
        sub_stmt = sub_stmt.where(User.name.ilike(f"%{student_name}%"))
        
    file_submissions = (await db.scalars(sub_stmt)).all()

    # 3. Fetch Assessment Attempts
    adv_stmt = select(StudentAssignment).join(Assignment, StudentAssignment.assignment_id == Assignment.material_id).join(LearningMaterial, Assignment.material_id == LearningMaterial.id).join(User, StudentAssignment.student_id == User.id).options(
        selectinload(StudentAssignment.student),
        selectinload(StudentAssignment.assignment).selectinload(Assignment.material)
    ).where(
        LearningMaterial.course_id.in_(target_course_ids)
    )
    
    if student_name:
        adv_stmt = adv_stmt.where(User.name.ilike(f"%{student_name}%"))
        
    assessment_attempts = (await db.scalars(adv_stmt)).all()

    # 4. Standardize and Unified Format
    unified_results = []
    minio_client = get_minio_client()

    for sub in file_submissions:
        file_url = sub.file_url
        obj_name = sub.object_name
        if not obj_name and file_url and '/lms-files/' in file_url:
            obj_name = file_url.split('/lms-files/')[-1]
            
        if obj_name:
            try:
                file_url = minio_client.generate_presigned_url(obj_name, expiry=3600)
            except Exception:
                pass
        
        unified_results.append({
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "submission_type": "FILE_UPLOAD",
            "title": sub.assignment.material.title if sub.assignment and sub.assignment.material else "File Submission",
            "submitted_at": sub.submitted_at,
            "status": "graded" if sub.graded_at else "submitted",
            "file_url": file_url,
            "grade": sub.grade,
            "total_marks": sub.assignment.total_marks if sub.assignment else None,
            "feedback": sub.feedback,
            "student": sub.student
        })

    for att in assessment_attempts:
        unified_results.append({
            "id": att.id,
            "assignment_id": att.assignment_id,
            "student_id": att.student_id,
            "submission_type": att.assignment.assignment_type if att.assignment else "MCQ",
            "title": att.assignment.material.title if att.assignment and att.assignment.material else "Assessment Attempt",
            "submitted_at": att.submitted_at,
            "status": att.status,
            "total_score": float(att.total_score) if att.total_score is not None else None,
            "total_marks": att.assignment.total_marks if att.assignment else None,
            "attempt_number": att.attempt_number,
            "feedback": att.teacher_feedback,
            "student": att.student
        })

    # Sort combined list by submitted_at desc
    unified_results.sort(key=lambda x: (x["submitted_at"].replace(tzinfo=None) if x["submitted_at"] else datetime.min), reverse=True)
    
    total_count = len(unified_results)
    paged_results = unified_results[offset : offset + limit]
    
    return {"total_count": total_count, "results": paged_results}

