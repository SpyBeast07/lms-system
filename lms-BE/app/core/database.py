from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

DATABASE_URL = settings.ASYNC_DATABASE_URL

# Create Async Engine
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False, # Set to True for debugging SQL queries
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()