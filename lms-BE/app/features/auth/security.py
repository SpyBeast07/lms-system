from app.features.auth.hashing import hash_password, verify_password

# semantic aliases (IMPORTANT)
async def hash_token(token: str) -> str:
    return await hash_password(token)

async def verify_token(token: str, token_hash: str) -> bool:
    return await verify_password(token, token_hash)