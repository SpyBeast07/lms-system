from slowapi import Limiter
from slowapi.util import get_remote_address
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

# Upstash uses TLS (rediss://). Pass ssl_cert_reqs=None to allow
# Upstash's self-managed cert without full chain verification.
storage_options = {"ssl_cert_reqs": None} if redis_url.startswith("rediss://") else {}

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url,
    storage_options=storage_options,
)
