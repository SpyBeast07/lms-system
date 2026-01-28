from app.features.auth.hashing import hash_password, verify_password

# semantic aliases (IMPORTANT)
def hash_token(token: str) -> str:
    return hash_password(token)

def verify_token(token: str, token_hash: str) -> bool:
    return verify_password(token, token_hash)