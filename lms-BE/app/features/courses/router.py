from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.courses.schemas import CourseCreate, CourseRead, CourseUpdate
from app.features.courses import service as course_crud
from app.features.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])


from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

# CREATE → principal
@router.post("/", response_model=CourseRead)
async def create_course_api(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("principal")),
    school_info = Depends(validate_school_subscription)
):
    return await course_crud.create_course(db, course_in, current_user.school_id)


from app.core.pagination import PaginatedResponse

# LIST → any logged-in user
@router.get("/", response_model=PaginatedResponse[CourseRead])
async def list_courses_api(
    page: int = 1,
    limit: int = 10,
    deleted: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await course_crud.get_courses_for_user(db, current_user, page, limit, is_deleted=deleted)


# GET → any logged-in user
@router.get("/{course_id}", response_model=CourseRead)
async def get_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    school_info = Depends(validate_school_subscription)
):
    # Pass school_id filter unless super_admin
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    course = await course_crud.get_course(db, course_id, school_id=school_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# UPDATE → principal
@router.put("/{course_id}", response_model=CourseRead)
async def update_course_api(
    course_id: int,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("principal")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id
    course = await course_crud.get_course(db, course_id, school_id=school_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return await course_crud.update_course(db, course, data)


# DELETE → principal
@router.delete("/{course_id}")
async def delete_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("principal")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id
    course = await course_crud.get_course(db, course_id, school_id=school_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await course_crud.soft_delete_course(db, course)
    return {"status": "deleted"}


# RESTORE → principal
@router.post("/{course_id}/restore")
async def restore_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("principal")),
):
    course = await course_crud.get_course_any(db, course_id, school_id=current_user.school_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await course_crud.restore_course(db, course)
    return {"status": "restored"}


# ---------- HARD DELETE ----------
@router.delete("/{course_id}/permanent")
async def hard_delete_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("principal")),
):
    course = await course_crud.get_course_any(db, course_id, school_id=current_user.school_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await course_crud.hard_delete_course(db, course)
    return {"status": "permanently_deleted"}