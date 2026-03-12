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

scheduler = AsyncIOScheduler()
scheduler.add_job(cleanup_refresh_tokens, 'interval', hours=12)
scheduler.add_job(cleanup_old_notifications, 'interval', hours=12)
scheduler.add_job(cleanup_orphan_submissions, 'interval', hours=12)

def start_scheduler():
    scheduler.start()
    logger.info("Background cleanup scheduler started")
