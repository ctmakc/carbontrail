"""Lobby-to-Funding Loop Detection"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/loops", tags=["lobby-loops"])


@router.get("/top")
def top_loops(limit: int = Query(30)):
    """Organizations that lobby climate depts AND receive their money"""
    return query("""
        SELECT
            org_name,
            org_name_norm,
            lobby_registration_count,
            first_lobby_date,
            last_lobby_date,
            receives_govt_funding,
            COALESCE(grant_count, 0) as grant_count,
            COALESCE(grant_value, 0) as grant_value,
            COALESCE(grant_programs, 0) as grant_programs,
            COALESCE(contract_count, 0) as contract_count,
            COALESCE(contract_value, 0) as contract_value,
            COALESCE(sole_source_count, 0) as sole_source_count,
            COALESCE(total_climate_value, 0) as total_climate_value,
            loop_signal_score
        FROM lobby_funding_loops
        WHERE loop_signal_score > 0
        ORDER BY loop_signal_score DESC
        LIMIT ?
    """, [limit])


@router.get("/detail/{org_name_norm}")
def loop_detail(org_name_norm: str):
    """Detailed breakdown for a specific org's lobby-funding loop"""
    org = query("""
        SELECT * FROM lobby_funding_loops
        WHERE org_name_norm = ?
    """, [org_name_norm])

    # Their lobbying history
    lobbying = query("""
        SELECT
            lr."REG_ID_ENR" as reg_id,
            lr."EFFECTIVE_DATE_VIGUEUR" as start_date,
            lr."END_DATE_FIN" as end_date,
            lr."RGSTRNT_LAST_NM_DCLRNT" as registrant_last,
            lr."RGSTRNT_1ST_NM_PRENOM_DCLRNT" as registrant_first
        FROM climate_lobby_registrations lr
        WHERE UPPER(TRIM(COALESCE(lr."EN_CLIENT_ORG_CORP_NM_AN",''))) = ?
        ORDER BY lr."EFFECTIVE_DATE_VIGUEUR" DESC
        LIMIT 20
    """, [org_name_norm])

    # Their climate grants
    grants = query("""
        SELECT
            prog_name_en as program,
            owner_org_title as department,
            agreement_value,
            agreement_start_date,
            agreement_end_date,
            description_en
        FROM grants
        WHERE is_climate_relevant AND recipient_name_norm = ?
        ORDER BY agreement_value DESC
        LIMIT 20
    """, [org_name_norm])

    # Their climate contracts
    contracts = query("""
        SELECT
            description_en,
            owner_org_title as department,
            contract_value,
            contract_date,
            is_sole_source,
            number_of_bids
        FROM contracts
        WHERE is_climate_relevant AND vendor_name_norm = ?
        ORDER BY contract_value DESC
        LIMIT 20
    """, [org_name_norm])

    return {
        "organization": org[0] if org else None,
        "lobbying_history": lobbying,
        "climate_grants": grants,
        "climate_contracts": contracts,
    }


@router.get("/stats")
def loop_stats():
    """Summary stats for lobby-funding loops"""
    return query("""
        SELECT
            COUNT(*) as total_orgs_with_loops,
            SUM(CASE WHEN loop_signal_score >= 50 THEN 1 ELSE 0 END) as high_signal,
            SUM(CASE WHEN loop_signal_score >= 30 AND loop_signal_score < 50 THEN 1 ELSE 0 END) as medium_signal,
            SUM(CASE WHEN loop_signal_score > 0 AND loop_signal_score < 30 THEN 1 ELSE 0 END) as low_signal,
            SUM(COALESCE(total_climate_value, 0)) as total_value_in_loops,
            AVG(lobby_registration_count) as avg_lobby_registrations
        FROM lobby_funding_loops
        WHERE loop_signal_score > 0
    """)[0]
