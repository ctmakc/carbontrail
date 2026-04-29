"""Charities — cross-reference with climate grants"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/charities", tags=["charities"])


@router.get("/climate-funded")
def climate_funded_charities(limit: int = Query(20, ge=1, le=100)):
    """Charities that receive climate grants (matched by BN)"""
    return query("""
        SELECT
            charity_name, bn, charity_category, charity_city, charity_province,
            COUNT(*) as grant_count,
            SUM(grant_value) as total_grant_value,
            COUNT(DISTINCT grant_program) as programs,
            COUNT(DISTINCT grant_department) as departments,
            MIN(grant_year) as first_year,
            MAX(grant_year) as last_year
        FROM charity_grant_links
        GROUP BY charity_name, bn, charity_category, charity_city, charity_province
        ORDER BY total_grant_value DESC
        LIMIT ?
    """, [limit])


@router.get("/detail/{bn}")
def charity_detail(bn: str):
    """Full detail for a specific charity — profile + grants + directors"""
    profile = query("SELECT * FROM charities WHERE bn = ?", [bn])
    if not profile:
        return {"error": "Charity not found"}

    grants = query("""
        SELECT grant_ref, grant_program, grant_value, grant_department, grant_year, grant_description
        FROM charity_grant_links WHERE bn = ?
        ORDER BY grant_value DESC
    """, [bn])

    directors = query("""
        SELECT first_name, last_name, director_name_norm, position
        FROM charity_directors WHERE bn = ?
        ORDER BY last_name, first_name
    """, [bn])

    programs = query("""
        SELECT program_type, description
        FROM charity_programs WHERE bn = ?
    """, [bn])

    return {
        "profile": profile[0],
        "climate_grants": grants,
        "directors": directors,
        "programs": programs,
        "total_climate_funding": sum(g["grant_value"] for g in grants if g["grant_value"]),
    }


@router.get("/directors-in-lobbying")
def directors_overlap(limit: int = Query(20)):
    """Charity directors who also appear in lobbying data (name match)"""
    return query("""
        SELECT DISTINCT
            cd.director_name_norm as person,
            cd.first_name, cd.last_name,
            c.legal_name as charity_name, cd.bn,
            li.REG_ID_ENR as lobby_reg_id,
            lr.EN_CLIENT_ORG_CORP_NM_AN as lobby_client_org
        FROM charity_directors cd
        JOIN charities c ON cd.bn = c.bn
        JOIN lobbyist_inhouse li ON
            UPPER(TRIM(li.LAST_NAME_NOM_FAMILLE)) = UPPER(TRIM(cd.last_name))
            AND UPPER(TRIM(li.FIRST_NAME_PRENOM)) = UPPER(TRIM(cd.first_name))
        JOIN lobbyist_registrations lr ON li.REG_ID_ENR = lr.REG_ID_ENR
        LIMIT ?
    """, [limit])


@router.get("/stats")
def charity_stats():
    """Stats about charity-climate funding relationships"""
    r = query("""
        SELECT
            COUNT(DISTINCT bn) as charities_with_climate_funding,
            COUNT(*) as total_grants,
            SUM(grant_value) as total_value,
            COUNT(DISTINCT grant_program) as programs,
            COUNT(DISTINCT grant_department) as departments
        FROM charity_grant_links
    """)
    total_charities = query("SELECT COUNT(*) as c FROM charities")[0]["c"]
    total_directors = query("SELECT COUNT(*) as c FROM charity_directors")[0]["c"]
    result = r[0] if r else {}
    result["total_charities_in_db"] = total_charities
    result["total_directors_in_db"] = total_directors
    return result
