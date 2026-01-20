from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.course import CourseCreate, CourseRead
from app.crud.course import create_course, get_courses

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/", response_model=CourseRead)
def create_course_api(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
):
    return create_course(db, course_in)


@router.get("/", response_model=list[CourseRead])
def list_courses_api(
    db: Session = Depends(get_db),
):
    return get_courses(db)