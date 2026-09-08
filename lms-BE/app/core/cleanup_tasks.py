from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete, select
from datetime import datetime, timezone, timedelta
import logging

from app.core.database import AsyncSessionLocal
from app.features.auth.models import RefreshToken
from app.features.notifications.models import Notification
from app.features.submissions.models import Submission
from app.core.storage import get_minio_client

logger = logging.getLogger(__name__)

async def cleanup_refresh_tokens():
    """Delete refresh tokens where expires_at < now"""
    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now(timezone.utc)
            stmt = delete(RefreshToken).where(RefreshToken.expires_at < now)
            result = await db.execute(stmt)
            await db.commit()
            if result.rowcount > 0:
                logger.info(f"Cleanup job: removed {result.rowcount} expired refresh tokens")
            else:
                logger.info("Cleanup job: removed 0 expired refresh tokens")
        except Exception as e:
            logger.error(f"Error cleaning up refresh tokens: {e}")

async def cleanup_old_notifications():
    """Delete notifications older than 30 days"""
    async with AsyncSessionLocal() as db:
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
            stmt = delete(Notification).where(Notification.created_at < cutoff_date)
            result = await db.execute(stmt)
            await db.commit()
            if result.rowcount > 0:
                logger.info(f"Cleanup job: removed {result.rowcount} old notifications")
            else:
                logger.info("Cleanup job: removed 0 old notifications")
        except Exception as e:
            logger.error(f"Error cleaning up old notifications: {e}")

async def cleanup_orphan_submissions():
    """Delete submission records where file is missing in MinIO"""
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Submission).where(Submission.object_name.isnot(None))
            result = await db.execute(stmt)
            submissions = result.scalars().all()
            
            try:
                minio_client = get_minio_client()
            except Exception:
                logger.error("Cleanup job skipped: Failed to initialize MinIO client")
                return
                
            removed_count = 0
            
            for sub in submissions:
                if sub.object_name and not minio_client.file_exists(sub.object_name):
                    await db.delete(sub)
                    removed_count += 1
                    
            if removed_count > 0:
                await db.commit()
                logger.info(f"Cleanup job: removed {removed_count} orphan submissions")
            else:
                logger.info("Cleanup job: removed 0 orphan submissions")
        except Exception as e:
            logger.error(f"Error cleaning up orphan submissions: {e}")

from app.core.redis_client import get_redis
from app.features.courses.models_discussion import CoursePost, PostReply
import json
from sqlalchemy import text

async def sync_redis_discussions_to_db():
    redis = await get_redis()
    
    # Sync posts
    raw_posts = await redis.hgetall("pending_course_posts")
    if raw_posts:
        async with AsyncSessionLocal() as db:
            try:
                for pid, pdata in raw_posts.items():
                    data = json.loads(pdata)
                    new_post = CoursePost(
                        id=data["id"],
                        course_id=data["course_id"],
                        school_id=data["school_id"],
                        author_id=data["author_id"],
                        title=data["title"],
                        content=data["content"],
                        type=data["type"],
                        is_pinned=data["is_pinned"],
                        # created_at and updated_at can be ignored or parsed from ISO
                    )
                    db.add(new_post)
                await db.commit()
                # Remove from redis after successful commit
                await redis.hdel("pending_course_posts", *raw_posts.keys())
                
                # Update postgres sequence
                await db.execute(text("SELECT setval('course_posts_id_seq', (SELECT MAX(id) FROM course_posts))"))
                await db.commit()
                logger.info(f"Sync job: inserted {len(raw_posts)} posts from Redis to DB")
            except Exception as e:
                logger.error(f"Error syncing pending posts to DB: {e}")

    # Sync replies
    raw_replies = await redis.hgetall("pending_post_replies")
    if raw_replies:
        async with AsyncSessionLocal() as db:
            try:
                for rid, rdata in raw_replies.items():
                    data = json.loads(rdata)
                    new_reply = PostReply(
                        id=data["id"],
                        post_id=data["post_id"],
                        author_id=data["author_id"],
                        parent_reply_id=data.get("parent_reply_id"),
                        content=data["content"]
                    )
                    db.add(new_reply)
                await db.commit()
                await redis.hdel("pending_post_replies", *raw_replies.keys())
                
                await db.execute(text("SELECT setval('post_replies_id_seq', (SELECT MAX(id) FROM post_replies))"))
                await db.commit()
                logger.info(f"Sync job: inserted {len(raw_replies)} replies from Redis to DB")
            except Exception as e:
                logger.error(f"Error syncing pending replies to DB: {e}")

scheduler = AsyncIOScheduler()
scheduler.add_job(cleanup_refresh_tokens, 'interval', hours=12)
scheduler.add_job(cleanup_old_notifications, 'interval', hours=12)
scheduler.add_job(cleanup_orphan_submissions, 'interval', hours=12)
scheduler.add_job(sync_redis_discussions_to_db, 'interval', seconds=30)

def start_scheduler():
    scheduler.start()
    logger.info("Background cleanup scheduler started")
