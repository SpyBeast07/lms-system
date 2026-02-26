import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_data():
    async with engine.connect() as conn:
        # Check schools
        res = await conn.execute(text("SELECT count(*) FROM schools"))
        school_count = res.scalar()
        print(f"Total schools: {school_count}")
        
        if school_count > 0:
            res = await conn.execute(text("SELECT id, name FROM schools LIMIT 5"))
            for row in res:
                print(f"School: id={row[0]}, name={row[1]}")
        
        # Check other tables for orphaned records
        tables = ['users', 'course', 'learning_material', 'submissions']
        for table in tables:
            res = await conn.execute(text(f"SELECT count(*) FROM {table} WHERE school_id IS NULL"))
            orphan_count = res.scalar()
            print(f"Table {table}: {orphan_count} records with NULL school_id")

if __name__ == "__main__":
    asyncio.run(check_data())
