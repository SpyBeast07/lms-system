from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, UTC
from typing import List, Optional

from app.features.courses.models_materials import LearningMaterial
from app.features.courses.models_assignment import Assignment
from app.features.courses.models_question import Question
from app.features.courses.models_mcq import MCQOption
from app.features.courses.models_student_assignment import StudentAssignment
from app.features.courses.models_answer import StudentAnswer
from app.features.courses.schemas_assignment import AssignmentCreate, AssignmentRead, StudentAssignmentCreate
from app.features.activity_logs.service import log_action
from app.features.activity_logs.schemas import ActivityLogCreate
from app.features.notifications.service import create_notification
from app.features.notifications.schemas import NotificationCreate
from app.features.enrollments.models_student import StudentCourse

async def create_advanced_assignment(
    db: AsyncSession, teacher_id: int, data: AssignmentCreate, school_id: int
) -> LearningMaterial:
    # 1. Create LearningMaterial
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        school_id=school_id,
        title=data.title,
        type="assignment",
    )
    db.add(material)
    await db.flush()

    # 2. Create Assignment metadata
    assignment = Assignment(
        material_id=material.id,
        assignment_type=data.assignment_type,
        total_marks=data.total_marks,
        due_date=data.due_date,
        max_attempts=data.max_attempts,
        description=data.description,
        reference_materials=[rm.model_dump() for rm in data.reference_materials],
    )
    db.add(assignment)

    # 3. Create Questions & Options if not FILE_UPLOAD
    if data.assignment_type in ["MCQ", "TEXT"] and data.questions:
        for q_data in data.questions:
            question = Question(
                assignment_id=material.id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                marks=q_data.marks,
                order_index=q_data.order_index,
            )
            db.add(question)
            await db.flush()

            if q_data.question_type == "MCQ" and q_data.options:
                for opt_data in q_data.options:
                    option = MCQOption(
                        question_id=question.id,
                        option_text=opt_data.option_text,
                        is_correct=opt_data.is_correct,
                    )
                    db.add(option)

    await db.commit()
    await db.refresh(material)

    # Activity Logging & Notifications
    await log_action(db, ActivityLogCreate(
        user_id=teacher_id,
        course_id=material.course_id,
        action="create_assignment",
        entity_type="material",
        entity_id=material.id,
        details=f"Created {data.assignment_type} assignment: {data.title}"
    ), school_id=school_id)
    
    stmt = select(StudentCourse.student_id).where(StudentCourse.course_id == material.course_id)
    result = await db.execute(stmt)
    for student_id in result.scalars().all():
        await create_notification(db, NotificationCreate(
            user_id=student_id,
            type="assignment_created",
            message=f"New assignment posted: {data.title}",
            entity_id=material.id
        ), school_id=school_id)

    return material

from fastapi import HTTPException

async def create_student_attempt(
    db: AsyncSession, student_id: int, data: StudentAssignmentCreate, school_id: int
) -> StudentAssignment:
    # 0. Load assignment and material to enforce business rules
    stmt_assign = (
        select(Assignment, LearningMaterial)
        .join(LearningMaterial, Assignment.material_id == LearningMaterial.id)
        .filter(Assignment.material_id == data.assignment_id)
    )
    result_assign = await db.execute(stmt_assign)
    row = result_assign.first()
    if not row:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment, material = row
    
    # Check school isolation
    if material.school_id != school_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Check student enrollment
    stmt_enroll = select(StudentCourse).filter(
        StudentCourse.student_id == student_id,
        StudentCourse.course_id == material.course_id
    )
    res_enroll = await db.execute(stmt_enroll)
    if not res_enroll.scalars().first():
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Check due date
    if datetime.now(UTC).date() > assignment.due_date:
        raise HTTPException(status_code=400, detail="Submission deadline has passed")

    # 1. Get current attempt number
    stmt = (
        select(func.max(StudentAssignment.attempt_number))
        .filter(
            StudentAssignment.student_id == student_id,
            StudentAssignment.assignment_id == data.assignment_id
        )
    )
    result = await db.execute(stmt)
    current_max = result.scalar() or 0
    new_attempt_number = current_max + 1

    # Check attempt limit
    if new_attempt_number > assignment.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")

    # 2. Create StudentAssignment record
    attempt = StudentAssignment(
        student_id=student_id,
        assignment_id=data.assignment_id,
        attempt_number=new_attempt_number,
        submitted_at=datetime.now(UTC),
        status="submitted",
    )
    db.add(attempt)
    await db.flush()

    # 3. Create StudentAnswer records
    for ans_data in data.answers:
        answer = StudentAnswer(
            student_assignment_id=attempt.id,
            question_id=ans_data.question_id,
            selected_option_id=ans_data.selected_option_id,
            answer_text=ans_data.answer_text,
        )
        db.add(answer)

    await db.flush()

    # 4. Auto-evaluate if needed
    assignment_stmt = select(Assignment).filter(Assignment.material_id == data.assignment_id)
    assign_res = await db.execute(assignment_stmt)
    assignment = assign_res.scalars().first()

    if assignment and str(assignment.assignment_type).upper() == "MCQ":
        await evaluate_mcq_submission(db, attempt.id)
    
    await db.commit()
    
    # Refetch with answers loaded to avoid MissingGreenlet during serialization
    stmt = (
        select(StudentAssignment)
        .options(
            selectinload(StudentAssignment.answers)
            .selectinload(StudentAnswer.question)
            .selectinload(Question.options)
        )
        .filter(StudentAssignment.id == attempt.id)
    )
    result = await db.execute(stmt)
    attempt = result.scalars().first()

    await log_action(db, ActivityLogCreate(
        user_id=student_id,
        action="submit_assignment",
        entity_type="student_assignment",
        entity_id=attempt.id,
        details=f"Submitted attempt {new_attempt_number} for assignment {data.assignment_id}"
    ), school_id=school_id)

    return attempt

async def evaluate_mcq_submission(db: AsyncSession, student_assignment_id: int):
    # Load attempt with answers and questions
    stmt = (
        select(StudentAssignment)
        .options(
            selectinload(StudentAssignment.answers)
            .selectinload(StudentAnswer.question)
            .selectinload(Question.options)
        )
        .filter(StudentAssignment.id == student_assignment_id)
    )
    result = await db.execute(stmt)
    attempt = result.scalars().first()
    
    if not attempt:
        return None

    total_score = 0
    for answer in attempt.answers:
        if answer.question.question_type == "MCQ" and answer.selected_option_id:
            # Find correct option
            correct_opt = next((o for o in answer.question.options if o.is_correct), None)
            if correct_opt and answer.selected_option_id == correct_opt.id:
                answer.marks_obtained = answer.question.marks
                total_score += answer.question.marks
            else:
                answer.marks_obtained = 0
        
    attempt.total_score = total_score
    attempt.status = "evaluated"
    return attempt
