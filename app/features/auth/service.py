from sqlalchemy.orm import Session
from datetime import datetime, timedelta, UTC

from app.features.auth.models import RefreshToken
from app.features.users.models import User
from app.features.auth.security import hash_token, verify_token

REFRESH_TOKEN_DAYS = 2

def create_refresh_token(db: Session, user: User, raw_token: str):
    token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

def get_valid_refresh_token(db: Session, raw_token: str):
    tokens = db.query(RefreshToken).filter(
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(UTC),
    ).all()

    for token in tokens:
        if verify_token(raw_token, token.token_hash):
            return token

    return None

def revoke_token(db: Session, token: RefreshToken):
    token.revoked = True
    db.commit()

def rotate_refresh_token(
    db: Session,
    old_token: RefreshToken,
    new_raw_token: str,
):
    old_token.revoked = True

    new_token = RefreshToken(
        user_id=old_token.user_id,
        token_hash=hash_token(new_raw_token),
        expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
        replaced_by=old_token.id,
    )

    db.add(new_token)
    db.commit()
    return new_token

def revoke_all_user_tokens(db: Session, user_id: int):
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False,
    ).update({"revoked": True})

    db.commit()

def find_refresh_token(db: Session, raw_token: str):
    """
    Returns:
    - (token, reused: bool)
    """
    tokens = db.query(RefreshToken).all()

    for token in tokens:
        if verify_token(raw_token, token.token_hash):
            if token.revoked:
                # 🚨 token reused
                return token, True
            return token, False

    return None, False