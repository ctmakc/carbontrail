"""Revolving Door — former public servants awarded climate contracts"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/revolving-door", tags=["revolving-door"])


@router.get("/contracts")
def fps_contracts(limit: int = Query(20, ge=1, le=100)):
    """Climate contracts involving former public servants"""
    return query("""
        SELECT vendor_name, vendor_name_norm, owner_org_title as department,
               contract_value, contract_year as year, is_sole_source,
               solicitation_procedure, description_en
        FROM former_ps_contracts
        ORDER BY contract_value DESC
        LIMIT ?
    """, [limit])


@router.get("/stats")
def fps_stats():
    """Summary stats for former public servant contracts"""
    r = query("""
        SELECT
            COUNT(*) as total_contracts,
            SUM(contract_value) as total_value,
            AVG(contract_value) as avg_value,
            COUNT(DISTINCT vendor_name_norm) as unique_vendors,
            COUNT(DISTINCT owner_org_title) as departments,
            SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
            SUM(CASE WHEN is_sole_source THEN contract_value ELSE 0 END) as sole_source_value,
            MIN(contract_year) as first_year,
            MAX(contract_year) as last_year
        FROM former_ps_contracts
    """)
    return r[0] if r else {}


@router.get("/by-vendor")
def fps_by_vendor(limit: int = Query(15, ge=1, le=100)):
    """Group former public servant contracts by vendor"""
    return query("""
        SELECT vendor_name, vendor_name_norm,
               COUNT(*) as contract_count,
               SUM(contract_value) as total_value,
               COUNT(DISTINCT owner_org_title) as departments,
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
               MIN(contract_year) as first_year,
               MAX(contract_year) as last_year
        FROM former_ps_contracts
        GROUP BY vendor_name, vendor_name_norm
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])


@router.get("/by-department")
def fps_by_department(limit: int = Query(15, ge=1, le=100)):
    """Group former public servant contracts by department"""
    return query("""
        SELECT owner_org_title as department,
               COUNT(*) as contract_count,
               SUM(contract_value) as total_value,
               COUNT(DISTINCT vendor_name_norm) as unique_vendors,
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
               MIN(contract_year) as first_year,
               MAX(contract_year) as last_year
        FROM former_ps_contracts
        GROUP BY owner_org_title
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])
