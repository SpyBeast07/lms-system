from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.response import error_response
import logging

logger = logging.getLogger(__name__)

async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Protect auth responses from standardization as per requirement
    path = request.url.path
    if path.startswith("/auth/login") or path.startswith("/auth/refresh") or path.startswith("/api/v1/files/upload"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )

    logger.error(f"HTTP Exception on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(message=str(exc.detail))
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    path = request.url.path
    if path.startswith("/auth/login") or path.startswith("/auth/refresh") or path.startswith("/api/v1/files/upload"):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )

    logger.error(f"Validation Error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content=error_response(message="Validation Error", details=exc.errors())
    )
