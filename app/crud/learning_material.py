from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.db.models.learning_material import LearningMaterial
from app.db.models.notes import Notes
from app.db.models.assignment import Assignment
from app.schemas.learning_material import NotesCreate, AssignmentCreate


# -------------------- CREATE NOTES --------------------

def create_notes(
    db: Session,
    teacher_id: int,
    data: NotesCreate,
):
    # create learning material
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="notes",
        created_at=datetime.now(UTC),
    )

    db.add(material)
    db.flush()  # get material.id without commit

    # create notes entry
    notes = Notes(
        material_id=material.id,
        content_url=data.content_url,
    )

    db.add(notes)
    db.commit()
    db.refresh(material)

    return material


# -------------------- CREATE ASSIGNMENT --------------------

def create_assignment(
    db: Session,
    teacher_id: int,
    data: AssignmentCreate,
):
    material = LearningMaterial(
        course_id=data.course_id,
        created_by_teacher_id=teacher_id,
        title=data.title,
        type="assignment",
        created_at=datetime.now(UTC),
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