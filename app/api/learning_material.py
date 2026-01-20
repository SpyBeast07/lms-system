from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.learning_material import NotesCreate, AssignmentCreate
from app.crud.learning_material import create_notes, create_assignment

router = APIRouter(prefix="/materials", tags=["Learning Material"])


# -------------------- CREATE NOTES --------------------

@router.post("/notes/{teacher_id}")
def create_notes_api(
    teacher_id: int,
    data: NotesCreate,
    db: Session = Depends(get_db),
):
    try:
        material = create_notes(
            db=db,
            teacher_id=teacher_id,
            data=data,
        )
        return {
            "id": material.id,
            "title": material.title,
            "type": "notes",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------- CREATE ASSIGNMENT --------------------

@router.post("/assignments/{teacher_id}")
def create_assignment_api(
    teacher_id: int,
    data: AssignmentCreate,
    db: Session = Depends(get_db),
):
    try:
        material = create_assignment(
            db=db,
            teacher_id=teacher_id,
            data=data,
        )
        return {
            "id": material.id,
            "title": material.title,
            "type": "assignment",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))