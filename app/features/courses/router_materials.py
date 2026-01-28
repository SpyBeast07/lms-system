from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.courses.schemas_materials import (
    NotesCreate,
    AssignmentCreate,
    LearningMaterialUpdate,
)
from app.features.courses import service_materials as material_crud
from app.features.auth.dependencies import require_role

router = APIRouter(prefix="/materials", tags=["Learning Material"])


@router.post("/notes/{teacher_id}")
def create_notes_api(
    teacher_id: int,
    data: NotesCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    material = material_crud.create_notes(db, teacher_id, data)
    return {
        "id": material.id,
        "title": material.title,
        "type": "notes",
    }


@router.post("/assignments/{teacher_id}")
def create_assignment_api(
    teacher_id: int,
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    material = material_crud.create_assignment(db, teacher_id, data)
    return {
        "id": material.id,
        "title": material.title,
        "type": "assignment",
    }


@router.put("/{material_id}")
def update_material_api(
    material_id: int,
    data: LearningMaterialUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    material = material_crud.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    return material_crud.update_material(db, material, data)


@router.delete("/{material_id}")
def delete_material_api(
    material_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    material = material_crud.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    material_crud.soft_delete_material(db, material)
    return {"status": "deleted"}


@router.post("/{material_id}/restore")
def restore_material_api(
    material_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("teacher")),
):
    material = material_crud.get_material_any(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    material_crud.restore_material(db, material)
    return {"status": "restored"}