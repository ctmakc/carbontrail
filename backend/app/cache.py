"""Simple in-memory LRU cache for expensive queries"""
from functools import lru_cache
from .db import query as raw_query
import time
import hashlib
import json

# Cache expensive queries for 5 minutes
_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 300  # 5 minutes


def cached_query(sql: str, params=None, ttl: int = CACHE_TTL):
    """Execute query with caching"""
    key = hashlib.md5((sql + json.dumps(params or [], default=str)).encode()).hexdigest()
    now = time.time()

    if key in _cache:
        cached_time, cached_result = _cache[key]
        if now - cached_time < ttl:
            return cached_result

    result = raw_query(sql, params)
    _cache[key] = (now, result)

    # Evict old entries if cache is too large
    if len(_cache) > 200:
        oldest = sorted(_cache.items(), key=lambda x: x[1][0])[:50]
        for k, _ in oldest:
            _cache.pop(k, None)

    return result


def clear_cache():
    """Clear entire cache"""
    _cache.clear()
