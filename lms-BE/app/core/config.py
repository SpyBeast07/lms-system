
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    DATABASE_URL_ASYNC: Optional[str] = None
    
    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        url = self.DATABASE_URL_ASYNC or self.DATABASE_URL
        if url and url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://")
        if url and url.startswith("postgresql+psycopg2://"):
            return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
        return url

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "lms-files"
    MINIO_SECURE: bool = False
    MINIO_URL_EXPIRY: int = 3600

    # Auth
    SECRET_KEY: str = "CHANGE_ME_SECRET"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://192.168.29.84:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()
