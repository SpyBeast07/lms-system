from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.features.courses.schemas_materials import (
    NotesCreate,
    AssignmentCreate,
    LearningMaterialUpdate,
)
from app.features.courses import service_materials as material_crud
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/materials", tags=["Learning Material"])

from app.core.school_guard import validate_school_subscription
from app.features.users.models import User

@router.get("/course/{course_id}")
async def get_course_materials_api(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "student", "admin", "principal")),
    school_info = Depends(validate_school_subscription)
):
    student_id = current_user.id if current_user.role == "student" else None
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    materials = await material_crud.get_course_materials(db, course_id, school_id=school_id, student_id=student_id)
    return materials


@router.get("/teacher/{teacher_id}/course/{course_id}")
async def get_teacher_course_materials_api(
    teacher_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "principal")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    return await material_crud.get_teacher_course_materials(db, teacher_id, course_id, school_id=school_id)


@router.post("/notes/{teacher_id}")
async def create_notes_api(
    teacher_id: int,
    data: NotesCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
    school_info = Depends(validate_school_subscription)
):
    material = await material_crud.create_notes(db, teacher_id, data, school_id=current_user.school_id)
    return {
        "id": material.id,
        "title": material.title,
        "type": "notes",
    }


@router.post("/assignments/{teacher_id}")
async def create_assignment_api(
    teacher_id: int,
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
    school_info = Depends(validate_school_subscription)
):
    material = await material_crud.create_assignment(db, teacher_id, data, school_id=current_user.school_id)
    return {
        "id": material.id,
        "title": material.title,
        "type": "assignment",
    }


@router.put("/{material_id}")
async def update_material_api(
    material_id: int,
    data: LearningMaterialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    material = await material_crud.get_material(db, material_id, school_id=school_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    return await material_crud.update_material(db, material, data)


@router.delete("/{material_id}")
async def delete_material_api(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    material = await material_crud.get_material(db, material_id, school_id=school_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    await material_crud.soft_delete_material(db, material)
    return {"status": "deleted"}


@router.post("/{material_id}/restore")
async def restore_material_api(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
    school_info = Depends(validate_school_subscription)
):
    school_id = current_user.school_id if current_user.role != "super_admin" else None
    material = await material_crud.get_material_any(db, material_id, school_id=school_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    await material_crud.restore_material(db, material)
    return {"status": "restored"}