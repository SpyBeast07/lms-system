from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.crud import course as course_crud
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])


# CREATE → admin / principal
@router.post("/", response_model=CourseRead)
def create_course_api(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    return course_crud.create_course(db, course_in)


# LIST → any logged-in user
@router.get("/", response_model=list[CourseRead])
def list_courses_api(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return course_crud.get_courses(db)


# GET → any logged-in user
@router.get("/{course_id}", response_model=CourseRead)
def get_course_api(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# UPDATE → admin / principal
@router.put("/{course_id}", response_model=CourseRead)
def update_course_api(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course_crud.update_course(db, course, data)


# DELETE → admin / principal
@router.delete("/{course_id}")
def delete_course_api(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_crud.soft_delete_course(db, course)
    return {"status": "deleted"}


# RESTORE → admin / principal
@router.post("/{course_id}/restore")
def restore_course_api(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = course_crud.get_course_any(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_crud.restore_course(db, course)
    return {"status": "restored"}