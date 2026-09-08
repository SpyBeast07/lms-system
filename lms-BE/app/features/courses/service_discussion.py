from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException
from typing import List, Optional
import json
from datetime import datetime, timezone

from app.features.courses.models_discussion import CoursePost, PostReply
from app.features.courses.schemas_discussion import CoursePostCreate, PostReplyCreate
from app.features.users.models import User
from app.features.enrollments.models_student import StudentCourse
from app.features.enrollments.models_teacher import TeacherCourse
from app.core.redis_client import get_redis

async def check_course_access(db: AsyncSession, course_id: int, user: User):
    if user.role == "super_admin":
        return True
    
    if user.role == "principal":
        from app.features.courses.models import Course
        stmt = select(Course).where(Course.id == course_id, Course.school_id == user.school_id)
        course = await db.scalar(stmt)
        return course is not None

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

async def get_redis_posts_for_course(course_id: int) -> List[dict]:
    redis = await get_redis()
    raw_posts = await redis.hgetall("pending_course_posts")
    posts = []
    for pid, pdata in raw_posts.items():
        try:
            p = json.loads(pdata)
            if p.get("course_id") == course_id:
                posts.append(p)
        except:
            continue
    return posts

async def get_redis_replies_for_post(post_id: int) -> List[dict]:
    redis = await get_redis()
    raw_replies = await redis.hgetall("pending_post_replies")
    replies = []
    for rid, rdata in raw_replies.items():
        try:
            r = json.loads(rdata)
            if r.get("post_id") == post_id:
                replies.append(r)
        except:
            continue
    return replies

async def create_post(db: AsyncSession, course_id: int, post_in: CoursePostCreate, user: User):
    if not await check_course_access(db, course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")

    if post_in.type == 'ANNOUNCEMENT' and user.role not in ['teacher', 'principal', 'super_admin']:
        raise HTTPException(status_code=403, detail="Only teachers and principals can create announcements")

    redis = await get_redis()
    post_id = await redis.incr("discussion_global_post_id")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    post_data = {
        "id": post_id,
        "course_id": course_id,
        "school_id": user.school_id,
        "author_id": user.id,
        "title": post_in.title,
        "content": post_in.content,
        "type": post_in.type,
        "is_pinned": post_in.is_pinned,
        "created_at": now_iso,
        "updated_at": now_iso,
        "author_name": user.name,
        "author": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    }
    
    await redis.hset("pending_course_posts", str(post_id), json.dumps(post_data))
    
    # Broadcast
    await redis.publish(f"course_{course_id}", json.dumps({
        "event": "new_post",
        "data": post_data
    }))
    
    return post_data

async def get_posts(db: AsyncSession, course_id: int, user: User, post_type: Optional[str] = None):
    if not await check_course_access(db, course_id, user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")

    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(selectinload(CoursePost.author)).where(CoursePost.course_id == course_id)
    if post_type:
        stmt = stmt.where(CoursePost.type == post_type)
    
    stmt = stmt.order_by(CoursePost.is_pinned.desc(), CoursePost.created_at.desc())
    result = await db.execute(stmt)
    db_posts = result.scalars().all()
    
    # Convert DB posts to dict to merge with Redis
    merged = []
    for dp in db_posts:
        merged.append({
            "id": dp.id,
            "course_id": dp.course_id,
            "school_id": dp.school_id,
            "author_id": dp.author_id,
            "title": dp.title,
            "content": dp.content,
            "type": dp.type,
            "is_pinned": dp.is_pinned,
            "created_at": dp.created_at,
            "updated_at": dp.updated_at,
            "author_name": dp.author.name if dp.author else None
        })
        
    redis_posts = await get_redis_posts_for_course(course_id)
    if post_type:
        redis_posts = [rp for rp in redis_posts if rp.get("type") == post_type]
        
    merged.extend(redis_posts)
    # Sort merged: pinned first, then created_at desc (by isoformat string if from Redis, or datetime if from DB)
    merged.sort(key=lambda x: (not x["is_pinned"], str(x["created_at"])), reverse=True)
    
    return merged

async def get_post(db: AsyncSession, post_id: int, user: User):
    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(selectinload(CoursePost.author)).where(CoursePost.id == post_id)
    post = await db.scalar(stmt)
    
    if post:
        if not await check_course_access(db, post.course_id, user):
            raise HTTPException(status_code=403, detail="You do not have access to this course")
        return post

    # Try Redis
    redis = await get_redis()
    raw = await redis.hget("pending_course_posts", str(post_id))
    if not raw:
        raise HTTPException(status_code=404, detail="Post not found")
        
    p = json.loads(raw)
    if not await check_course_access(db, p["course_id"], user):
        raise HTTPException(status_code=403, detail="You do not have access to this course")
    return p

async def create_reply(db: AsyncSession, post_id: int, reply_in: PostReplyCreate, user: User):
    post_data = await get_post(db, post_id, user)
    course_id = post_data.course_id if hasattr(post_data, 'course_id') else post_data["course_id"]
    
    redis = await get_redis()
    reply_id = await redis.incr("discussion_global_reply_id")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    reply_data = {
        "id": reply_id,
        "post_id": post_id,
        "author_id": user.id,
        "parent_reply_id": reply_in.parent_reply_id,
        "content": reply_in.content,
        "created_at": now_iso,
        "author_name": user.name,
        "author": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    }
    
    await redis.hset("pending_post_replies", str(reply_id), json.dumps(reply_data))
    
    # Broadcast
    await redis.publish(f"course_{course_id}", json.dumps({
        "event": "new_reply",
        "data": reply_data
    }))
    
    return reply_data

async def get_post_with_replies(db: AsyncSession, post_id: int, user: User):
    from sqlalchemy.orm import selectinload
    stmt = select(CoursePost).options(
        selectinload(CoursePost.author),
        selectinload(CoursePost.replies).selectinload(PostReply.author)
    ).where(CoursePost.id == post_id)
    
    post = await db.scalar(stmt)
    post_dict = None
    
    if post:
        if not await check_course_access(db, post.course_id, user):
            raise HTTPException(status_code=403, detail="You do not have access to this course")
        post_dict = {
            "id": post.id,
            "course_id": post.course_id,
            "school_id": post.school_id,
            "author_id": post.author_id,
            "title": post.title,
            "content": post.content,
            "type": post.type,
            "is_pinned": post.is_pinned,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "author_name": post.author.name if post.author else None,
            "replies": [{
                "id": r.id,
                "post_id": r.post_id,
                "author_id": r.author_id,
                "parent_reply_id": r.parent_reply_id,
                "content": r.content,
                "created_at": r.created_at,
                "author_name": r.author.name if r.author else None
            } for r in post.replies]
        }
    else:
        # Try redis
        redis = await get_redis()
        raw = await redis.hget("pending_course_posts", str(post_id))
        if not raw:
            raise HTTPException(status_code=404, detail="Post not found")
        post_dict = json.loads(raw)
        if "replies" not in post_dict:
            post_dict["replies"] = []
        if not await check_course_access(db, post_dict["course_id"], user):
            raise HTTPException(status_code=403, detail="You do not have access to this course")

    # Add redis replies
    redis_replies = await get_redis_replies_for_post(post_id)
    if "replies" not in post_dict: post_dict["replies"] = []
    post_dict["replies"].extend(redis_replies)
    
    # Sort replies by created_at ascending
    post_dict["replies"].sort(key=lambda x: str(x["created_at"]))
    
    return post_dict

