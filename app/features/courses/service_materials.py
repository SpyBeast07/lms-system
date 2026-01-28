from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.features.courses.models_materials import LearningMaterial
from app.features.courses.models_notes import Notes
from app.features.courses.models_assignment import Assignment
from app.features.courses.schemas_materials import (
    NotesCreate,
    AssignmentCreate,
    LearningMaterialUpdate,
)


# -------------------- CREATE --------------------

def create_notes(db: Session, teacher_id: int, data: NotesCreate) -> LearningMaterial:
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="notes",
    )
    db.add(material)
    db.flush()  # get material.id

    notes = Notes(
        material_id=material.id,
        content_url=data.content_url,
    )
    db.add(notes)

    db.commit()
    db.refresh(material)
    return material


def create_assignment(
    db: Session, teacher_id: int, data: AssignmentCreate
) -> LearningMaterial:
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="assignment",
    )
    db.add(material)
    db.flush()

    assignment = Assignment(
        material_id=material.id,
        assignment_type=data.assignment_type,
        total_marks=data.total_marks,
        due_date=data.due_date,
        max_attempts=data.max_attempts,
    )
    db.add(assignment)

    db.commit()
    db.refresh(material)
    return material


# -------------------- READ --------------------

def get_material(db: Session, material_id: int):
    return (
        db.query(LearningMaterial)
        .filter(
            LearningMaterial.id == material_id,
            LearningMaterial.is_deleted == False,
        )
        .first()
    )


def get_material_any(db: Session, material_id: int):
    return (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == material_id)
        .first()
    )


# -------------------- UPDATE --------------------

def update_material(
    db: Session,
    material: LearningMaterial,
    data: LearningMaterialUpdate,
):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(material, field, value)

    material.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(material)
    return material


# -------------------- DELETE / RESTORE --------------------

def soft_delete_material(db: Session, material: LearningMaterial):
    material.is_deleted = True
    material.updated_at = datetime.now(UTC)
    db.commit()


def restore_material(db: Session, material: LearningMaterial):
    material.is_deleted = False
    material.updated_at = datetime.now(UTC)
    db.commit()


def hard_delete_material(db: Session, material: LearningMaterial):
    db.delete(material)
    db.commit()