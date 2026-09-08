from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.features.courses.schemas_discussion import (
    CoursePostCreate, CoursePostRead, PostReplyCreate, PostReplyRead, CoursePostWithReplies
)
import app.features.courses.service_discussion as discussion_service

router = APIRouter(tags=["Course Discussion"])

@router.post("/courses/{course_id}/posts", response_model=CoursePostRead)
async def create_course_post(
    course_id: int,
    post_in: CoursePostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await discussion_service.create_post(db, course_id, post_in, current_user)

@router.get("/courses/{course_id}/posts", response_model=List[CoursePostRead])
async def list_course_posts(
    course_id: int,
    post_type: Optional[str] = Query(None, description="Filter by post type"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await discussion_service.get_posts(db, course_id, current_user, post_type)

@router.get("/posts/{post_id}", response_model=CoursePostWithReplies)
async def get_post_details(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await discussion_service.get_post_with_replies(db, post_id, current_user)

@router.post("/posts/{post_id}/reply", response_model=PostReplyRead)
async def reply_to_post(
    post_id: int,
    reply_in: PostReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await discussion_service.create_reply(db, post_id, reply_in, current_user)
