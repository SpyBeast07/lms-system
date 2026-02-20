from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
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

async def create_notes(db: AsyncSession, teacher_id: int, data: NotesCreate) -> LearningMaterial:
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="notes",
    )
    db.add(material)
    await db.flush()  # get material.id

    notes = Notes(
        material_id=material.id,
        content_url=data.content_url,
    )
    db.add(notes)

    await db.commit()
    await db.refresh(material)
    return material


async def create_assignment(
    db: AsyncSession, teacher_id: int, data: AssignmentCreate
) -> LearningMaterial:
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="assignment",
    )
    db.add(material)
    await db.flush()

    assignment = Assignment(
        material_id=material.id,
        assignment_type=data.assignment_type,
        total_marks=data.total_marks,
        due_date=data.due_date,
        max_attempts=data.max_attempts,
    )
    db.add(assignment)

    await db.commit()
    await db.refresh(material)
    return material


# -------------------- READ --------------------

async def get_course_materials(db: AsyncSession, course_id: int):
    result = await db.execute(
        select(LearningMaterial)
        .options(selectinload(LearningMaterial.notes), selectinload(LearningMaterial.assignment))
        .filter(
            LearningMaterial.course_id == course_id,
            LearningMaterial.is_deleted == False
        )
        .order_by(LearningMaterial.created_at.desc())
    )
    materials = result.scalars().all()
    
    response = []
    for m in materials:
        item = {
            "id": m.id,
            "title": m.title,
            "type": m.type,
            "course_id": m.course_id,
            "created_by_teacher_id": m.created_by_teacher_id,
            "created_at": m.created_at,
            "is_deleted": m.is_deleted
        }
        if m.type == "notes" and m.notes:
            item["file_url"] = m.notes.content_url
        elif m.type == "assignment" and m.assignment:
            item["total_marks"] = m.assignment.total_marks
            item["due_date"] = m.assignment.due_date
            item["max_attempts"] = m.assignment.max_attempts
            item["assignment_type"] = m.assignment.assignment_type
            
        response.append(item)
        
    return response

async def get_material(db: AsyncSession, material_id: int):
    result = await db.execute(
        select(LearningMaterial).filter(
            LearningMaterial.id == material_id,
            LearningMaterial.is_deleted == False,
        )
    )
    return result.scalars().first()


async def get_material_any(db: AsyncSession, material_id: int):
    result = await db.execute(
        select(LearningMaterial).filter(LearningMaterial.id == material_id)
    )
    return result.scalars().first()


# -------------------- UPDATE --------------------

async def update_material(
    db: AsyncSession,
    material: LearningMaterial,
    data: LearningMaterialUpdate,
):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(material, field, value)

    material.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(material)
    return material


# -------------------- DELETE / RESTORE --------------------

async def soft_delete_material(db: AsyncSession, material: LearningMaterial):
    material.is_deleted = True
    material.updated_at = datetime.now(UTC)
    await db.commit()


async def restore_material(db: AsyncSession, material: LearningMaterial):
    material.is_deleted = False
    material.updated_at = datetime.now(UTC)
    await db.commit()


async def hard_delete_material(db: AsyncSession, material: LearningMaterial):
    await db.delete(material)
    await db.commit()