"""Climate Funding Gap Analyzer — where money ISN'T going"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/gaps", tags=["gaps"])


@router.get("/provincial")
def provincial_gaps():
    """Climate funding per province — shows who gets what"""
    return query("""
        SELECT
            province,
            SUM(grant_count) as total_grants,
            SUM(total_value) as total_value,
            SUM(recipient_count) as recipient_count,
            COUNT(DISTINCT program) as program_count
        FROM provincial_climate_gaps
        GROUP BY province
        ORDER BY total_value DESC
    """)


@router.get("/provincial-per-capita")
def provincial_per_capita():
    """Funding per province normalized (for gap analysis)"""
    # Canadian province populations (approximate 2025)
    return query("""
        WITH prov_totals AS (
            SELECT
                province,
                SUM(total_value) as total_value,
                SUM(grant_count) as grant_count
            FROM provincial_climate_gaps
            GROUP BY province
        )
        SELECT
            province,
            total_value,
            grant_count,
            -- We'll let the frontend handle per-capita since we don't have population in DB
            total_value / NULLIF(grant_count, 0) as avg_grant_value
        FROM prov_totals
        ORDER BY total_value DESC
    """)


@router.get("/program-coverage")
def program_coverage(limit: int = Query(20)):
    """Which climate programs cover which provinces — spot the gaps"""
    return query("""
        SELECT
            program,
            department,
            COUNT(DISTINCT province) as provinces_reached,
            SUM(total_value) as total_value,
            SUM(grant_count) as total_grants,
            LIST(DISTINCT province ORDER BY province) as provinces
        FROM provincial_climate_gaps
        WHERE program IS NOT NULL AND program != ''
        GROUP BY program, department
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])


@router.get("/year-over-year")
def year_over_year():
    """Climate spending growth year over year"""
    return query("""
        SELECT
            year,
            SUM(total_value) as total_value,
            SUM(record_count) as record_count,
            SUM(recipient_count) as recipient_count
        FROM climate_spending_timeline
        WHERE year >= 2010 AND year <= 2025
        GROUP BY year
        ORDER BY year
    """)
