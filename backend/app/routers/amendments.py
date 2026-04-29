"""Amendment Creep — contracts that grew significantly through amendments"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/amendments", tags=["amendments"])


@router.get("/top")
def top_amendment_creep(limit: int = Query(20, ge=1, le=100)):
    """Contracts with the largest absolute growth via amendments"""
    return query("""
        SELECT vendor_name, vendor_name_norm, owner_org_title as department,
               original_value, contract_value as final_value, absolute_growth,
               growth_pct, contract_year as year, is_sole_source,
               description_en
        FROM amendment_creep
        ORDER BY absolute_growth DESC
        LIMIT ?
    """, [limit])


@router.get("/stats")
def amendment_stats():
    """Summary of amendment creep patterns"""
    r = query("""
        SELECT
            COUNT(*) as total_amended_contracts,
            SUM(absolute_growth) as total_growth,
            AVG(growth_pct) as avg_growth_pct,
            MAX(growth_pct) as max_growth_pct,
            SUM(contract_value) as total_final_value,
            SUM(original_value) as total_original_value,
            COUNT(DISTINCT vendor_name_norm) as unique_vendors,
            COUNT(DISTINCT owner_org_title) as departments,
            SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
            SUM(CASE WHEN growth_pct > 500 THEN 1 ELSE 0 END) as grew_5x,
            SUM(CASE WHEN growth_pct > 1000 THEN 1 ELSE 0 END) as grew_10x
        FROM amendment_creep
    """)
    return r[0] if r else {}


@router.get("/by-vendor")
def amendment_by_vendor(limit: int = Query(15, ge=1, le=100)):
    """Vendors with most amendment growth across contracts"""
    return query("""
        SELECT vendor_name, vendor_name_norm,
               COUNT(*) as amended_contracts,
               SUM(absolute_growth) as total_growth,
               SUM(contract_value) as total_final_value,
               AVG(growth_pct) as avg_growth_pct,
               MAX(growth_pct) as max_growth_pct,
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count
        FROM amendment_creep
        GROUP BY vendor_name, vendor_name_norm
        ORDER BY total_growth DESC
        LIMIT ?
    """, [limit])


@router.get("/by-department")
def amendment_by_department(limit: int = Query(15, ge=1, le=100)):
    """Departments with highest amendment creep"""
    return query("""
        SELECT owner_org_title as department,
               COUNT(*) as amended_contracts,
               SUM(absolute_growth) as total_growth,
               SUM(contract_value) as total_final_value,
               AVG(growth_pct) as avg_growth_pct,
               COUNT(DISTINCT vendor_name_norm) as unique_vendors
        FROM amendment_creep
        GROUP BY owner_org_title
        ORDER BY total_growth DESC
        LIMIT ?
    """, [limit])


@router.get("/extreme")
def extreme_amendments(min_growth_pct: float = Query(500), limit: int = Query(20)):
    """Contracts that grew more than X% — extreme outliers"""
    return query("""
        SELECT vendor_name, vendor_name_norm, owner_org_title as department,
               original_value, contract_value as final_value, absolute_growth,
               growth_pct, contract_year as year, is_sole_source,
               description_en
        FROM amendment_creep
        WHERE growth_pct >= ?
        ORDER BY absolute_growth DESC
        LIMIT ?
    """, [min_growth_pct, limit])
