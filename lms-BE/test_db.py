import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.features.users.models import User
from app.features.courses.models import Course
from app.features.enrollments.models_teacher import TeacherCourse

async def main():
    async with AsyncSessionLocal() as db:
        # Get all users
        users = await db.execute(select(User))
        for u in users.scalars().all():
            print(f"User: {u.id}, {u.role}")
        
        # Get all courses
        courses = await db.execute(select(Course))
        for c in courses.scalars().all():
            print(f"Course: {c.id}, {c.name}, is_deleted={c.is_deleted}")

        # Get all teacher courses
        tcs = await db.execute(select(TeacherCourse))
        all_tcs = tcs.scalars().all()
        for tc in all_tcs:
            print(f"TeacherCourse: teacher={tc.teacher_id}, course={tc.course_id}")
            
        # Get filtered teacher courses
        if all_tcs:
            t = all_tcs[0].teacher_id
            print(f"Testing for teacher {t}")
            result = await db.execute(
                select(Course)
                .join(TeacherCourse, TeacherCourse.course_id == Course.id)
                .filter(
                    TeacherCourse.teacher_id == t,
                    Course.is_deleted == False,
                )
            )
            for r in result.scalars().all():
                print(f"Teacher {t} sees course {r.id}: {r.name}, is_deleted={r.is_deleted}")

if __name__ == "__main__":
    asyncio.run(main())
