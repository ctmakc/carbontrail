"""Green Recipients — who gets climate money"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/recipients", tags=["recipients"])


@router.get("/top")
def top_recipients(limit: int = Query(30)):
    """Largest climate money recipients"""
    return query("""
        SELECT
            entity_name,
            entity_name_norm,
            business_number,
            province,
            grant_count,
            grant_value,
            grant_programs,
            contract_count,
            contract_value,
            sole_source_count,
            total_climate_value,
            dual_recipient
        FROM green_recipients
        WHERE total_climate_value > 0
        ORDER BY total_climate_value DESC
        LIMIT ?
    """, [limit])


@router.get("/dual")
def dual_recipients(limit: int = Query(30)):
    """Recipients getting BOTH grants AND contracts from climate depts"""
    return query("""
        SELECT
            entity_name,
            entity_name_norm,
            province,
            grant_count,
            grant_value,
            grant_programs,
            contract_count,
            contract_value,
            sole_source_count,
            total_climate_value
        FROM green_recipients
        WHERE dual_recipient
        ORDER BY total_climate_value DESC
        LIMIT ?
    """, [limit])


@router.get("/detail/{entity_name_norm}")
def recipient_detail(entity_name_norm: str):
    """Full profile of a climate money recipient"""
    profile = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [entity_name_norm])
    grants = query("""
        SELECT prog_name_en as program, owner_org_title as department,
               agreement_value, agreement_start_date, description_en
        FROM grants WHERE is_climate_relevant AND recipient_name_norm = ?
        ORDER BY agreement_value DESC LIMIT 30
    """, [entity_name_norm])
    contracts = query("""
        SELECT description_en, owner_org_title as department,
               contract_value, contract_date, is_sole_source, number_of_bids
        FROM contracts WHERE is_climate_relevant AND vendor_name_norm = ?
        ORDER BY contract_value DESC LIMIT 30
    """, [entity_name_norm])
    lobby = query("""
        SELECT org_name, lobby_registration_count, loop_signal_score,
               total_climate_value, receives_govt_funding
        FROM lobby_funding_loops WHERE org_name_norm = ?
    """, [entity_name_norm])

    return {
        "profile": profile[0] if profile else None,
        "grants": grants,
        "contracts": contracts,
        "lobbying": lobby[0] if lobby else None,
    }


@router.get("/timeline/{entity_name_norm}")
def recipient_timeline(entity_name_norm: str, limit: int = Query(50)):
    """Chronological timeline of all climate events for an entity"""
    events = []

    # Grants
    grants = query("""
        SELECT 'grant' as event_type, prog_name_en as title,
               owner_org_title as department, agreement_value as value,
               agreement_start_date as event_date, description_en as description
        FROM grants WHERE is_climate_relevant AND recipient_name_norm = ?
        AND agreement_start_date IS NOT NULL
        ORDER BY agreement_start_date DESC LIMIT ?
    """, [entity_name_norm, limit])
    events.extend(grants)

    # Contracts
    contracts = query("""
        SELECT 'contract' as event_type, description_en as title,
               owner_org_title as department, contract_value as value,
               contract_date as event_date,
               CASE WHEN is_sole_source THEN 'Sole-source' ELSE 'Competitive' END as description
        FROM contracts WHERE is_climate_relevant AND vendor_name_norm = ?
        AND contract_date IS NOT NULL
        ORDER BY contract_date DESC LIMIT ?
    """, [entity_name_norm, limit])
    events.extend(contracts)

    # Sort all events by date
    events.sort(key=lambda e: e.get("event_date") or "", reverse=True)
    return events[:limit]


@router.get("/related/{entity_name_norm}")
def related_entities(entity_name_norm: str, limit: int = Query(10)):
    """Find related entities: same departments, shared programs, similar province"""
    profile = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [entity_name_norm])
    if not profile:
        return []

    p = profile[0]
    province = p.get("province")

    # Entities in same province with similar funding pattern
    related = query("""
        SELECT entity_name, entity_name_norm, province,
               grant_value, contract_value, total_climate_value, dual_recipient,
               ABS(total_climate_value - ?) as value_diff
        FROM green_recipients
        WHERE entity_name_norm != ?
            AND province = ?
            AND total_climate_value > 0
        ORDER BY value_diff ASC
        LIMIT ?
    """, [p.get("total_climate_value", 0), entity_name_norm, province, limit])

    return related
