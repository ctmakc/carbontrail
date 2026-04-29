"""Green Money Flow — where climate dollars go"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/flow", tags=["money-flow"])


@router.get("/by-program")
def by_program(limit: int = Query(20)):
    """Top climate programs by total funding"""
    return query("""
        SELECT
            prog_name_en as program,
            owner_org_title as department,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count,
            MIN(grant_year) as first_year,
            MAX(grant_year) as last_year
        FROM grants
        WHERE is_climate_relevant AND agreement_value > 0 AND prog_name_en IS NOT NULL
        GROUP BY prog_name_en, owner_org_title
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])


@router.get("/by-province")
def by_province():
    """Climate funding by province"""
    return query("""
        SELECT
            recipient_province as province,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count,
            COUNT(DISTINCT prog_name_en) as program_count
        FROM grants
        WHERE is_climate_relevant
            AND agreement_value > 0
            AND recipient_province IS NOT NULL
            AND recipient_province != ''
        GROUP BY recipient_province
        ORDER BY total_value DESC
    """)


@router.get("/sankey")
def sankey_data(limit: int = Query(15)):
    """Data for Sankey diagram: department → program → top recipients"""
    departments = query("""
        SELECT
            owner_org_title as source,
            prog_name_en as target,
            SUM(agreement_value) as value
        FROM grants
        WHERE is_climate_relevant AND agreement_value > 0
            AND prog_name_en IS NOT NULL AND owner_org_title IS NOT NULL
        GROUP BY owner_org_title, prog_name_en
        ORDER BY value DESC
        LIMIT ?
    """, [limit * 2])

    programs_to_recipients = query("""
        SELECT
            prog_name_en as source,
            recipient_legal_name as target,
            SUM(agreement_value) as value
        FROM grants
        WHERE is_climate_relevant AND agreement_value > 0
            AND prog_name_en IS NOT NULL
        GROUP BY prog_name_en, recipient_legal_name
        ORDER BY value DESC
        LIMIT ?
    """, [limit * 3])

    return {"dept_to_program": departments, "program_to_recipient": programs_to_recipients}


@router.get("/yearly-breakdown")
def yearly_breakdown():
    """Climate spending breakdown by department and year"""
    return query("""
        SELECT
            year,
            department,
            SUM(total_value) as total_value,
            SUM(record_count) as records
        FROM climate_spending_timeline
        WHERE year >= 2015 AND year <= 2025
        GROUP BY year, department
        ORDER BY year, total_value DESC
    """)
