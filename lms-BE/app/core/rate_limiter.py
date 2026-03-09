from slowapi import Limiter
from slowapi.util import get_remote_address
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url
)
