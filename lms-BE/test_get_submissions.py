import asyncio
from app.core.database import AsyncSessionLocal
from app.features.submissions.service import get_student_submissions

async def test():
    async with AsyncSessionLocal() as db:
        res = await get_student_submissions(db, student_id=5, school_id=1, limit=5)
        for r in res["results"]:
            if r.get("submission_type") == "FILE_UPLOAD":
                url = r.get("file_url", "")
                print(f"ID {r['id']} URL IS PRESIGNED: {'X-Amz-Signature' in url}")
                
        res2 = await get_student_submissions(db, student_id=12, school_id=1, limit=5)
        for r in res2["results"]:
            if r.get("submission_type") == "FILE_UPLOAD":
                url = r.get("file_url", "")
                print(f"ID {r['id']} URL IS PRESIGNED: {'X-Amz-Signature' in url}")

if __name__ == "__main__":
    asyncio.run(test())
