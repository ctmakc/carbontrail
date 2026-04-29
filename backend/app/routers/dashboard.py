"""Dashboard — overview stats and top signals"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats():
    r = query("""
        SELECT
            (SELECT count(*) FROM contracts WHERE is_climate_relevant) as climate_contracts,
            (SELECT COALESCE(SUM(contract_value),0) FROM contracts WHERE is_climate_relevant) as climate_contract_value,
            (SELECT count(*) FROM grants WHERE is_climate_relevant) as climate_grants,
            (SELECT COALESCE(SUM(agreement_value),0) FROM grants WHERE is_climate_relevant) as climate_grant_value,
            (SELECT count(*) FROM climate_lobby_registrations) as climate_lobby_registrations,
            (SELECT count(*) FROM lobby_funding_loops WHERE loop_signal_score > 0) as lobby_funding_loops,
            (SELECT count(*) FROM green_recipients WHERE dual_recipient) as dual_recipients,
            (SELECT count(*) FROM greenwash_signals WHERE signal_type != 'standard') as greenwash_signals,
            (SELECT count(DISTINCT entity_name_norm) FROM green_recipients) as unique_recipients,
            (SELECT count(DISTINCT recipient_province) FROM grants WHERE is_climate_relevant AND recipient_province IS NOT NULL AND recipient_province != '') as provinces_covered
    """)
    return r[0] if r else {}


@router.get("/spending-timeline")
def spending_timeline():
    """Climate spending by year — contracts + grants"""
    return query("""
        SELECT
            year,
            SUM(CASE WHEN flow_type='contract' THEN total_value ELSE 0 END) as contract_value,
            SUM(CASE WHEN flow_type='grant' THEN total_value ELSE 0 END) as grant_value,
            SUM(total_value) as total_value,
            SUM(record_count) as record_count
        FROM climate_spending_timeline
        WHERE year >= 2010 AND year <= 2025
        GROUP BY year
        ORDER BY year
    """)


@router.get("/top-departments")
def top_departments(limit: int = Query(10)):
    """Departments spending the most on climate"""
    return query("""
        SELECT
            department,
            flow_type,
            SUM(total_value) as total_value,
            SUM(record_count) as record_count,
            SUM(recipient_count) as recipient_count
        FROM climate_spending_timeline
        GROUP BY department, flow_type
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])


@router.get("/top-signals")
def top_signals(limit: int = Query(15)):
    """Top review signals from lobby-funding loops"""
    return query("""
        SELECT
            org_name,
            lobby_registration_count,
            COALESCE(grant_value, 0) as grant_value,
            COALESCE(contract_value, 0) as contract_value,
            COALESCE(total_climate_value, 0) as total_climate_value,
            COALESCE(sole_source_count, 0) as sole_source_count,
            loop_signal_score,
            receives_govt_funding
        FROM lobby_funding_loops
        WHERE loop_signal_score > 0
        ORDER BY loop_signal_score DESC
        LIMIT ?
    """, [limit])
