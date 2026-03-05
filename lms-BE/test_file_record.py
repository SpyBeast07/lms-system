import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.features.files.models import FileRecord

async def test():
    async with AsyncSessionLocal() as db:
        res = await db.scalars(select(FileRecord).limit(10))
        for r in res:
            print(f"FileRecord ID: {r.id}, OBJECT_NAME: {r.object_name}")

if __name__ == "__main__":
    asyncio.run(test())
