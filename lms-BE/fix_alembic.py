import asyncio
from sqlalchemy import text
from app.core.database import engine

async def reset_alembic():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("UPDATE alembic_version SET version_num = '579436368d5b'"))
        print("Alembic version updated to 579436368d5b")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(reset_alembic())
