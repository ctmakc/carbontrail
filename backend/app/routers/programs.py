"""Climate program deep-dive endpoints"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/programs", tags=["programs"])


@router.get("/list")
def list_programs(limit: int = Query(50)):
    """List all climate programs"""
    return query("""
        SELECT
            prog_name_en as program,
            owner_org_title as department,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count,
            COUNT(DISTINCT recipient_province) as province_count,
            MIN(grant_year) as first_year,
            MAX(grant_year) as last_year,
            AVG(agreement_value) as avg_grant_value
        FROM grants
        WHERE is_climate_relevant AND agreement_value > 0 AND prog_name_en IS NOT NULL AND TRIM(prog_name_en) != ''
        GROUP BY prog_name_en, owner_org_title
        ORDER BY total_value DESC
        LIMIT ?
    """, [limit])


@router.get("/detail/{program_name}")
def program_detail(program_name: str):
    """Detailed view of a single program"""
    program_name_decoded = program_name

    overview = query("""
        SELECT
            prog_name_en as program,
            owner_org_title as department,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count,
            COUNT(DISTINCT recipient_province) as province_count,
            MIN(grant_year) as first_year,
            MAX(grant_year) as last_year,
            AVG(agreement_value) as avg_grant_value
        FROM grants
        WHERE is_climate_relevant AND prog_name_en = ?
        GROUP BY prog_name_en, owner_org_title
    """, [program_name_decoded])

    top_recipients = query("""
        SELECT
            recipient_legal_name as name,
            recipient_name_norm as name_norm,
            recipient_province as province,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value
        FROM grants
        WHERE is_climate_relevant AND prog_name_en = ? AND agreement_value > 0
        GROUP BY recipient_legal_name, recipient_name_norm, recipient_province
        ORDER BY total_value DESC
        LIMIT 20
    """, [program_name_decoded])

    by_province = query("""
        SELECT
            recipient_province as province,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count
        FROM grants
        WHERE is_climate_relevant AND prog_name_en = ?
            AND recipient_province IS NOT NULL AND recipient_province != ''
        GROUP BY recipient_province
        ORDER BY total_value DESC
    """, [program_name_decoded])

    by_year = query("""
        SELECT
            grant_year as year,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count
        FROM grants
        WHERE is_climate_relevant AND prog_name_en = ? AND grant_year IS NOT NULL
        GROUP BY grant_year
        ORDER BY grant_year
    """, [program_name_decoded])

    return {
        "overview": overview[0] if overview else None,
        "top_recipients": top_recipients,
        "by_province": by_province,
        "by_year": by_year,
    }
