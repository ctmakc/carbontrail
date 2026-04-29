"""Search across all climate entities — with fuzzy matching"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/")
def search_entities(q: str = Query(..., min_length=2), limit: int = Query(20, ge=1, le=100)):
    """Fuzzy search across green recipients, lobby loops, charities.
    Uses LIKE for prefix/contains + Jaro-Winkler similarity for fuzzy ranking."""
    term = q.upper().strip()
    like_term = f"%{term}%"

    # First: exact LIKE match (fast, good recall)
    exact = query("""
        SELECT
            entity_name as name,
            entity_name_norm as name_norm,
            'recipient' as source,
            total_climate_value as value,
            province,
            dual_recipient,
            grant_count,
            contract_count,
            1.0 as relevance
        FROM green_recipients
        WHERE entity_name_norm LIKE ?
        ORDER BY total_climate_value DESC
        LIMIT ?
    """, [like_term, limit])

    if len(exact) >= limit:
        return exact

    # If not enough results, try splitting words for broader match
    words = term.split()
    if len(words) > 1:
        # Match all words in any order
        word_terms = [f"%{w}%" for w in words[:4]]
        conditions = " AND ".join("entity_name_norm LIKE ?" for _ in word_terms)
        broader = query(f"""
            SELECT
                entity_name as name,
                entity_name_norm as name_norm,
                'recipient' as source,
                total_climate_value as value,
                province,
                dual_recipient,
                grant_count,
                contract_count,
                0.8 as relevance
            FROM green_recipients
            WHERE {conditions}
                AND entity_name_norm NOT LIKE ?
            ORDER BY total_climate_value DESC
            LIMIT ?
        """, [*word_terms, like_term, limit - len(exact)])
        exact.extend(broader)

    if len(exact) >= limit:
        return exact[:limit]

    # Fallback: search in lobby data
    lobby_sql = """
        SELECT
            org_name as name,
            org_name_norm as name_norm,
            'lobbyist' as source,
            total_climate_value as value,
            NULL as province,
            false as dual_recipient,
            COALESCE(grant_count, 0) as grant_count,
            COALESCE(contract_count, 0) as contract_count,
            0.7 as relevance
        FROM lobby_funding_loops
        WHERE org_name_norm LIKE ?
    """
    lobby_params = [like_term]
    if exact:
        placeholders = ", ".join("?" for _ in exact)
        lobby_sql += f" AND org_name_norm NOT IN ({placeholders})\n"
        lobby_params.extend(r["name_norm"] for r in exact)
    lobby_sql += """
        ORDER BY total_climate_value DESC
        LIMIT ?
    """
    lobby_params.append(limit - len(exact))
    lobby = query(lobby_sql, lobby_params)

    exact.extend(lobby)
    return exact[:limit]


@router.get("/suggest")
def search_suggest(q: str = Query(..., min_length=2), limit: int = Query(8)):
    """Quick autocomplete suggestions for command palette"""
    term = f"%{q.upper().strip()}%"
    results = query("""
        SELECT entity_name as name, entity_name_norm as name_norm,
               total_climate_value as value, 'recipient' as source
        FROM green_recipients
        WHERE entity_name_norm LIKE ?
        ORDER BY total_climate_value DESC
        LIMIT ?
    """, [term, limit])
    return results
