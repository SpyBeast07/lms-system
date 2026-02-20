from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.courses.schemas import CourseCreate, CourseRead, CourseUpdate
from app.features.courses import service as course_crud
from app.features.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])


# CREATE → admin / principal
@router.post("/", response_model=CourseRead)
async def create_course_api(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    return await course_crud.create_course(db, course_in)


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
    current_user=Depends(get_current_user),
):
    course = await course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# UPDATE → admin / principal
@router.put("/{course_id}", response_model=CourseRead)
async def update_course_api(
    course_id: int,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = await course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return await course_crud.update_course(db, course, data)


# DELETE → admin / principal
@router.delete("/{course_id}")
async def delete_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = await course_crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await course_crud.soft_delete_course(db, course)
    return {"status": "deleted"}


# RESTORE → admin / principal
@router.post("/{course_id}/restore")
async def restore_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("super_admin", "principal")),
):
    course = await course_crud.get_course_any(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await course_crud.restore_course(db, course)
    return {"status": "restored"}