from datetime import datetime, UTC
from sqlalchemy.orm import Session

def get_active(query):
    return query.filter_by(is_deleted=False)

def soft_delete(obj):
    obj.is_deleted = True
    obj.updated_at = datetime.now(UTC)

def restore(obj):
    obj.is_deleted = False
    obj.updated_at = datetime.now(UTC)

def touch(obj):
    obj.updated_at = datetime.now(UTC)