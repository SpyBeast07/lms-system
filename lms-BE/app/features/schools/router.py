from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.features.schools import service, schemas

router = APIRouter(prefix="/schools", tags=["Schools"])

def check_super_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can access school management")
    return current_user

@router.post("/", response_model=schemas.SchoolRead)
async def create_school(
    school_in: schemas.SchoolCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_super_admin)
):
    school = await service.create_school(db, school_in)
    return school

@router.get("/public", response_model=schemas.SchoolPagination)
async def list_schools_public(
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=1000), 
    db: AsyncSession = Depends(get_db)
):
    result = await service.list_schools(db, page, size)
    return result

@router.get("/", response_model=schemas.SchoolPagination)
async def list_schools(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_super_admin)
):
    result = await service.list_schools(db, page, size)
    return result

@router.get("/{school_id}", response_model=schemas.SchoolRead)
async def get_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_super_admin)
):
    school = await service.get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.patch("/{school_id}", response_model=schemas.SchoolRead)
async def update_school(
    school_id: int,
    school_in: schemas.SchoolUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_super_admin)
):
    school = await service.update_school(db, school_id, school_in)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

from app.features.users.schemas import UserRead

@router.post("/{school_id}/assign-principal", response_model=UserRead)
async def assign_principal(
    school_id: int,
    payload: schemas.AssignPrincipal,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_super_admin)
):
    user = await service.assign_principal(db, school_id, payload.user_id)
    return user
