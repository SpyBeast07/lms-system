import asyncio
import os
import sys

# Add lms-BE to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, AsyncSessionLocal
from app.features.users.models import User
from app.features.auth.hashing import hash_password
from sqlalchemy.future import select

async def create_super_admin():
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(select(User).filter(User.email == "admin@example.com"))
        existing_user = result.scalars().first()
        
        if existing_user:
            print("User admin@example.com already exists. Updating password...")
            existing_user.password_hash = await hash_password("admin123")
            existing_user.name = "Bade Sahab"
            existing_user.role = "super_admin"
            existing_user.school_id = 0
            await session.commit()
            print("User updated successfully.")
            return

        password_hash = await hash_password("admin123")
        
        new_admin = User(
            name="Bade Sahab",
            email="admin@example.com",
            password_hash=password_hash,
            role="super_admin",
            school_id=0
        )
        
        session.add(new_admin)
        await session.commit()
        print("Super admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(create_super_admin())
