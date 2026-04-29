"""Search across all climate entities"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/")
def search_entities(q: str = Query(..., min_length=2), limit: int = Query(20)):
    """Full-text search across green recipients, lobby loops, greenwash signals"""
    term = f"%{q.upper()}%"
    results = query("""
        SELECT
            entity_name as name,
            entity_name_norm as name_norm,
            'recipient' as source,
            total_climate_value as value,
            province,
            dual_recipient,
            grant_count,
            contract_count
        FROM green_recipients
        WHERE entity_name_norm LIKE ?
        ORDER BY total_climate_value DESC
        LIMIT ?
    """, [term, limit])
    return results
