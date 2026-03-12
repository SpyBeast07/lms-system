from passlib.context import CryptContext
import asyncio

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

async def hash_password(password: str) -> str:
    return await asyncio.to_thread(pwd_context.hash, password)

async def verify_password(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(pwd_context.verify, plain, hashed)