import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.features.courses.models_assignment import Assignment
from app.features.courses.models_student_assignment import StudentAssignment
from app.features.submissions.models import Submission

async def test():
    async with AsyncSessionLocal() as db:
        try:
            print("Fetching file submissions...")
             # 1. Fetch File Submissions
            sub_stmt = select(Submission).options(
                selectinload(Submission.student),
                selectinload(Submission.assignment).selectinload(Assignment.material)
            ).order_by(Submission.submitted_at.desc())
            
            file_submissions = (await db.scalars(sub_stmt)).all()
            for sub in file_submissions:
                print(f"File Submission Total Marks: {sub.assignment.total_marks if sub.assignment else None}")

            print("Fetching assessment attempts...")
            # 2. Fetch Assessment Attempts
            adv_stmt = select(StudentAssignment).options(
                selectinload(StudentAssignment.student),
                selectinload(StudentAssignment.assignment).selectinload(Assignment.material)
            ).order_by(StudentAssignment.submitted_at.desc())
            
            assessment_attempts = (await db.scalars(adv_stmt)).all()
            for att in assessment_attempts:
                print(f"Assessment Total Marks: {att.assignment.total_marks if att.assignment else None}")
            
            print("SUCCESS! No MissingGreenlet exception.")
            
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
