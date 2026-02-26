import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_schema():
    tables = ['users', 'course', 'learning_material', 'submissions', 'activity_logs', 'notifications', 'signup_requests']
    async with engine.connect() as conn:
        for table in tables:
            stmt = text(f"SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = '{table}' AND column_name = 'school_id'")
            result = await conn.execute(stmt)
            row = result.fetchone()
            if row:
                print(f"{table}.school_id exists (is_nullable={row[1]})")
            else:
                print(f"{table}.school_id does not exist")

if __name__ == "__main__":
    asyncio.run(check_schema())
