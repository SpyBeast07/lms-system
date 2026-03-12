from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException
from typing import List, Optional

from app.features.courses.models_discussion import CoursePost, PostReply
from app.features.courses.schemas_discussion import CoursePostCreate, PostReplyCreate
from app.features.users.models import User
from app.features.enrollments.models_student import StudentCourse
from app.features.enrollments.models_teacher import TeacherCourse

async def check_course_access(db: AsyncSession, course_id: int, user: User):
    """
    Checks if a user has access to a course based on enrollment or role.
    Principals and Super Admins have access to all courses in their school.
    Teachers and Students must be enrolled.
    """
    if user.role == "super_admin":
        return True
    
    if user.role == "principal":
        # Check if course belongs to the same school
        from app.features.courses.models import Course
        stmt = select(Course).where(Course.id == course_id, Course.school_id == user.school_id)
        course = await db.scalar(stmt)
        if course:
            return True
        return False

    if user.role == "teacher":
        stmt = select(TeacherCourse).where(
            TeacherCourse.course_id == course_id,
            TeacherCourse.teacher_id == user.id
        )
        mapping = await db.scalar(stmt)
        return mapping is not None

    if user.role == "student":
        stmt = select(StudentCourse).where(
            StudentCourse.course_id == course_id,
            StudentCourse.student_id == user.id
        )
        mapping = await db.scalar(stmt)
        return mapping is not None

    return False

async def create_post(db: AsyncSession, course_id: int, post_in: CoursePostCreate, user: User):
    if not await check_course_access(db, course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")

    if post_in.type == 'ANNOUNCEMENT' and user.role not in ['teacher', 'principal', 'super_admin']:
        raise HTTPException(status_code=403, detail="Only teachers and principals can create announcements")

    new_post = CoursePost(
        course_id=course_id,
        school_id=user.school_id,
        author_id=user.id,
        title=post_in.title,
        content=post_in.content,
        type=post_in.type,
        is_pinned=post_in.is_pinned
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    new_post.author = user
    return new_post

async def get_posts(db: AsyncSession, course_id: int, user: User, post_type: Optional[str] = None):
    if not await check_course_access(db, course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")

    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(selectinload(CoursePost.author)).where(CoursePost.course_id == course_id)
    if post_type:
        stmt = stmt.where(CoursePost.type == post_type)
    
    # Order by pinned first, then by created_at descending
    stmt = stmt.order_by(CoursePost.is_pinned.desc(), CoursePost.created_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_post(db: AsyncSession, post_id: int, user: User):
    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(selectinload(CoursePost.author)).where(CoursePost.id == post_id)
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not await check_course_access(db, post.course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")
    
    return post

async def create_reply(db: AsyncSession, post_id: int, reply_in: PostReplyCreate, user: User):
    stmt = select(CoursePost).where(CoursePost.id == post_id)
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if not await check_course_access(db, post.course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")

    new_reply = PostReply(
        post_id=post_id,
        author_id=user.id,
        content=reply_in.content,
        parent_reply_id=reply_in.parent_reply_id
    )
    db.add(new_reply)
    await db.commit()
    await db.refresh(new_reply)
    new_reply.author = user
    return new_reply

async def get_post_with_replies(db: AsyncSession, post_id: int, user: User):
    stmt = select(CoursePost).where(CoursePost.id == post_id)
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not await check_course_access(db, post.course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")
    
    # Fetch replies and their authors
    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(
        selectinload(CoursePost.author),
        selectinload(CoursePost.replies).selectinload(PostReply.author)
    ).where(CoursePost.id == post_id)
    result = await db.execute(stmt)
    return result.scalar_one()
