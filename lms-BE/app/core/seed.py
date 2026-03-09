from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.features.users.models import User
from app.features.auth.hashing import hash_password
from app.core.database import AsyncSessionLocal

import logging

logger = logging.getLogger(__name__)

async def seed_super_admin():
    async with AsyncSessionLocal() as session:
        try:
            # Check if admin already exists
            result = await session.execute(select(User).filter(User.email == "admin@example.com"))
            existing_admin = result.scalars().first()
            
            if existing_admin:
                logger.info("Default super_admin already exists. Skipping creation.")
                return

            logger.info("Creating default super_admin...")
            password_hash = await hash_password("admin123")
            
            new_admin = User(
                name="Bade Sahab",
                email="admin@example.com",
                password_hash=password_hash,
                role="super_admin",
                school_id=None # Super admin doesn't belong to any specific school
            )
            
            session.add(new_admin)
            await session.commit()
            logger.info("Default super_admin created successfully.")
            
        except Exception as e:
            logger.error(f"Error during super_admin seeding: {e}")
            await session.rollback()
