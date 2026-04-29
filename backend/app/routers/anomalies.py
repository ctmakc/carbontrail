"""Automated anomaly detection for climate spending"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("/spending-spikes")
def spending_spikes(limit: int = Query(15)):
    """Detect year-over-year spending spikes for climate vendors"""
    return query("""
        WITH yearly AS (
            SELECT
                vendor_name_norm,
                vendor_name,
                owner_org_title,
                contract_year,
                SUM(contract_value) as year_value,
                COUNT(*) as year_contracts
            FROM contracts
            WHERE is_climate_relevant AND contract_value > 0 AND contract_year IS NOT NULL
            GROUP BY vendor_name_norm, vendor_name, owner_org_title, contract_year
        ),
        with_prev AS (
            SELECT
                *,
                LAG(year_value) OVER (PARTITION BY vendor_name_norm, owner_org_title ORDER BY contract_year) as prev_year_value,
                LAG(contract_year) OVER (PARTITION BY vendor_name_norm, owner_org_title ORDER BY contract_year) as prev_year
            FROM yearly
        )
        SELECT
            vendor_name,
            owner_org_title as department,
            contract_year as year,
            year_value,
            prev_year_value,
            prev_year as prev_year,
            year_value / NULLIF(prev_year_value, 0) as spike_ratio,
            year_value - COALESCE(prev_year_value, 0) as absolute_increase,
            'spending_spike' as anomaly_type
        FROM with_prev
        WHERE prev_year_value IS NOT NULL
            AND prev_year_value > 0
            AND year_value / prev_year_value > 5
            AND year_value > 1000000
            AND contract_year = prev_year + 1
        ORDER BY spike_ratio DESC
        LIMIT ?
    """, [limit])


@router.get("/sole-source-concentration")
def sole_source_concentration(limit: int = Query(15)):
    """Vendors with high sole-source rates in climate spending"""
    return query("""
        SELECT
            vendor_name as entity,
            vendor_name_norm as entity_norm,
            owner_org_title as department,
            COUNT(*) as total_contracts,
            SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
            SUM(contract_value) as total_value,
            SUM(CASE WHEN is_sole_source THEN contract_value ELSE 0 END) as sole_source_value,
            ROUND(SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) * 100, 1) as sole_source_pct,
            'sole_source_concentration' as anomaly_type
        FROM contracts
        WHERE is_climate_relevant AND contract_value > 0
        GROUP BY vendor_name, vendor_name_norm, owner_org_title
        HAVING COUNT(*) >= 5
            AND SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) > 0.7
            AND SUM(contract_value) > 500000
        ORDER BY sole_source_value DESC
        LIMIT ?
    """, [limit])


@router.get("/new-vendor-big-contract")
def new_vendor_big_contract(limit: int = Query(15)):
    """Vendors that appeared recently and immediately got large climate contracts"""
    return query("""
        WITH vendor_first AS (
            SELECT
                vendor_name_norm,
                MIN(contract_year) as first_year,
                MAX(contract_year) as last_year
            FROM contracts
            WHERE is_climate_relevant
            GROUP BY vendor_name_norm
        ),
        big_early AS (
            SELECT
                c.vendor_name,
                c.vendor_name_norm,
                c.owner_org_title as department,
                c.contract_value,
                c.contract_year,
                c.is_sole_source,
                vf.first_year,
                c.contract_year - vf.first_year as years_since_first
            FROM contracts c
            JOIN vendor_first vf ON c.vendor_name_norm = vf.vendor_name_norm
            WHERE c.is_climate_relevant
                AND c.contract_value > 1000000
                AND c.contract_year - vf.first_year <= 1
                AND vf.first_year >= 2018
        )
        SELECT
            vendor_name as entity,
            vendor_name_norm as entity_norm,
            department,
            contract_value,
            contract_year as year,
            first_year,
            is_sole_source,
            years_since_first,
            'new_vendor_big_contract' as anomaly_type
        FROM big_early
        ORDER BY contract_value DESC
        LIMIT ?
    """, [limit])


@router.get("/summary")
def anomaly_summary():
    """Quick summary of all anomaly types"""
    spikes = query("SELECT count(*) as c FROM (SELECT vendor_name_norm FROM contracts WHERE is_climate_relevant AND contract_value > 1000000 GROUP BY vendor_name_norm, owner_org_title, contract_year HAVING count(*) > 1)")
    sole = query("""
        SELECT count(*) as c FROM (
            SELECT vendor_name_norm FROM contracts WHERE is_climate_relevant AND contract_value > 0
            GROUP BY vendor_name_norm, owner_org_title
            HAVING COUNT(*) >= 5 AND SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) > 0.7
        )
    """)
    loops = query("SELECT count(*) as c FROM lobby_funding_loops WHERE loop_signal_score >= 50")
    greenwash = query("SELECT count(*) as c FROM greenwash_signals WHERE signal_type != 'standard'")

    return {
        "spending_spikes": spikes[0]["c"],
        "sole_source_concentration": sole[0]["c"],
        "high_signal_loops": loops[0]["c"],
        "greenwash_signals": greenwash[0]["c"],
    }
