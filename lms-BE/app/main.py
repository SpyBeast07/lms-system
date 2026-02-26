from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine
from app.core.config import settings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from app.core.rate_limiter import limiter
from app.core.cleanup_tasks import start_scheduler
from app.core.exceptions import custom_http_exception_handler, validation_exception_handler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic (if any)
    start_scheduler()
    yield
    # Shutdown logic
    await engine.dispose()

app = FastAPI(title="LMS Backend", lifespan=lifespan) # Object of fastAPI class

# SlowAPI registration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global custom REST serialization wrappers 
app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from app.features.users.router import router as users_router
from app.features.courses.router import router as courses_router
from app.features.enrollments.router_teacher import router as teacher_course_router
from app.features.enrollments.router_student import router as student_course_router
from app.features.courses.router_materials import router as learning_material_router
from app.features.auth.router import router as auth_router
from app.features.files import router as files_router
from app.features.submissions.router import router as submissions_router
from app.features.notifications.router import router as notifications_router
from app.features.activity_logs.router import router as activity_logs_router
from app.features.ai.router import router as ai_router
from app.features.stats.router import router as stats_router
from app.features.signup_requests.router import router as signup_requests_router
from app.features.schools.router import router as schools_router

app.include_router(users_router)
app.include_router(courses_router)
app.include_router(teacher_course_router)
app.include_router(student_course_router)
app.include_router(learning_material_router)
app.include_router(auth_router)
app.include_router(files_router, prefix="/api/v1")
app.include_router(submissions_router)
app.include_router(notifications_router)
app.include_router(activity_logs_router)
app.include_router(ai_router)
app.include_router(stats_router)
app.include_router(signup_requests_router)
app.include_router(schools_router)


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