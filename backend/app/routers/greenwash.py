"""Greenwash Signal Radar"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/greenwash", tags=["greenwash"])


@router.get("/signals")
def signals(limit: int = Query(30)):
    """Organizations with potential greenwash signals"""
    return query("""
        SELECT
            org_name,
            org_name_norm,
            registration_count,
            any_environment,
            any_energy,
            any_natural_resources,
            any_taxation_trade,
            max_subject_breadth,
            signal_type
        FROM greenwash_signals
        WHERE signal_type != 'standard'
        ORDER BY registration_count DESC
        LIMIT ?
    """, [limit])


@router.get("/energy-tax-nexus")
def energy_tax_nexus(limit: int = Query(20)):
    """Orgs lobbying on both energy AND taxation — potential regulatory capture signals"""
    return query("""
        SELECT
            gs.org_name,
            gs.registration_count,
            gs.any_environment,
            gs.any_energy,
            gs.any_taxation_trade,
            gs.max_subject_breadth,
            COALESCE(lf.total_climate_value, 0) as climate_funding_received,
            COALESCE(lf.lobby_registration_count, 0) as climate_lobby_count,
            lf.loop_signal_score
        FROM greenwash_signals gs
        LEFT JOIN lobby_funding_loops lf ON gs.org_name_norm = lf.org_name_norm
        WHERE gs.signal_type = 'energy_tax_nexus'
        ORDER BY gs.registration_count DESC
        LIMIT ?
    """, [limit])


@router.get("/broad-spectrum")
def broad_spectrum(limit: int = Query(20)):
    """Orgs lobbying across 8+ subject areas — influence-maximizing pattern"""
    return query("""
        SELECT
            gs.org_name,
            gs.registration_count,
            gs.max_subject_breadth,
            gs.any_environment,
            gs.any_energy,
            gs.any_natural_resources,
            COALESCE(lf.total_climate_value, 0) as climate_funding_received,
            lf.loop_signal_score
        FROM greenwash_signals gs
        LEFT JOIN lobby_funding_loops lf ON gs.org_name_norm = lf.org_name_norm
        WHERE gs.signal_type = 'broad_spectrum_lobby'
        ORDER BY gs.max_subject_breadth DESC, gs.registration_count DESC
        LIMIT ?
    """, [limit])
