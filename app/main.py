from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine

app = FastAPI(title="LMS Backend") # Object of fastAPI class

from app.api import users, courses, teacher_course, student_course, learning_material
from app.auth.router import router as auth_router

app.include_router(users.router)
app.include_router(courses.router)
app.include_router(teacher_course.router)
app.include_router(student_course.router)
app.include_router(learning_material.router)
app.include_router(auth_router)

@app.get("/hello_world") # decorator - A function that wraps another function and adds behavior to it.
def hello_world():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
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