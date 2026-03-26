from __future__ import annotations

import json
import time
from typing import Any

# In-memory cache (simple TTL cache)
# In production, use Redis via settings.redis_url
_cache: dict[str, tuple[float, Any]] = {}

DEFAULT_TTL = 86400  # 24 hours


def cache_get(key: str) -> Any | None:
    """Get a value from cache. Returns None if expired or missing."""
    if key not in _cache:
        return None
    expires_at, value = _cache[key]
    if time.time() > expires_at:
        del _cache[key]
        return None
    return value


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Set a value in cache with TTL in seconds."""
    _cache[key] = (time.time() + ttl, value)


def cache_key(*parts: str) -> str:
    """Build a cache key from parts."""
    return ":".join(parts)


def cached(prefix: str, ttl: int = DEFAULT_TTL):
    """Decorator for async functions with caching."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Build key from prefix + args
            key_parts = [prefix] + [str(a) for a in args[1:]]  # Skip self
            key = cache_key(*key_parts)

            cached_value = cache_get(key)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)
            cache_set(key, result, ttl)
            return result
        return wrapper
    return decorator
