from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.core.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic (if any)
    yield
    # Shutdown logic
    await engine.dispose()

app = FastAPI(title="LMS Backend", lifespan=lifespan) # Object of fastAPI class

from app.features.users.router import router as users_router
from app.features.courses.router import router as courses_router
from app.features.enrollments.router_teacher import router as teacher_course_router
from app.features.enrollments.router_student import router as student_course_router
from app.features.courses.router_materials import router as learning_material_router
from app.features.auth.router import router as auth_router
from app.features.files import router as files_router

app.include_router(users_router)
app.include_router(courses_router)
app.include_router(teacher_course_router)
app.include_router(student_course_router)
app.include_router(learning_material_router)
app.include_router(auth_router)
app.include_router(files_router, prefix="/api/v1")

@app.get("/hello_world") # decorator - A function that wraps another function and adds behavior to it.
def hello_world():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "not connected",
            "detail": str(e)
        }

# uv run uvicorn app.main:app --reload