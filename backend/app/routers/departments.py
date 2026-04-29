"""Department-level analysis"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("/list")
def list_departments():
    """All climate-relevant departments with spending totals"""
    return query("""
        WITH contract_dept AS (
            SELECT owner_org_title as dept,
                   COUNT(*) as contract_count,
                   SUM(contract_value) as contract_value
            FROM contracts WHERE is_climate_relevant AND contract_value > 0
            GROUP BY owner_org_title
        ),
        grant_dept AS (
            SELECT owner_org_title as dept,
                   COUNT(*) as grant_count,
                   SUM(agreement_value) as grant_value,
                   COUNT(DISTINCT recipient_name_norm) as grant_recipients
            FROM grants WHERE is_climate_relevant AND agreement_value > 0
            GROUP BY owner_org_title
        )
        SELECT
            COALESCE(c.dept, g.dept) as department,
            COALESCE(c.contract_count, 0) as contract_count,
            COALESCE(c.contract_value, 0) as contract_value,
            COALESCE(g.grant_count, 0) as grant_count,
            COALESCE(g.grant_value, 0) as grant_value,
            COALESCE(g.grant_recipients, 0) as grant_recipients,
            COALESCE(c.contract_value, 0) + COALESCE(g.grant_value, 0) as total_value
        FROM contract_dept c
        FULL OUTER JOIN grant_dept g ON c.dept = g.dept
        WHERE COALESCE(c.dept, g.dept) IS NOT NULL
        ORDER BY total_value DESC
    """)


@router.get("/detail/{dept_name}")
def department_detail(dept_name: str):
    """Full department climate spending profile"""
    # Overview
    overview = query("""
        SELECT
            ? as department,
            (SELECT COUNT(*) FROM contracts WHERE is_climate_relevant AND owner_org_title = ?) as contract_count,
            (SELECT COALESCE(SUM(contract_value),0) FROM contracts WHERE is_climate_relevant AND owner_org_title = ?) as contract_value,
            (SELECT COUNT(*) FROM grants WHERE is_climate_relevant AND owner_org_title = ?) as grant_count,
            (SELECT COALESCE(SUM(agreement_value),0) FROM grants WHERE is_climate_relevant AND owner_org_title = ?) as grant_value,
            (SELECT COUNT(DISTINCT recipient_name_norm) FROM grants WHERE is_climate_relevant AND owner_org_title = ?) as unique_recipients,
            (SELECT COUNT(DISTINCT prog_name_en) FROM grants WHERE is_climate_relevant AND owner_org_title = ?) as program_count
    """, [dept_name, dept_name, dept_name, dept_name, dept_name, dept_name, dept_name])

    # Top vendors
    top_vendors = query("""
        SELECT vendor_name as name, vendor_name_norm as name_norm,
               COUNT(*) as count, SUM(contract_value) as value,
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source
        FROM contracts WHERE is_climate_relevant AND owner_org_title = ? AND contract_value > 0
        GROUP BY vendor_name, vendor_name_norm
        ORDER BY value DESC LIMIT 15
    """, [dept_name])

    # Top grant recipients
    top_recipients = query("""
        SELECT recipient_legal_name as name, recipient_name_norm as name_norm,
               recipient_province as province,
               COUNT(*) as count, SUM(agreement_value) as value
        FROM grants WHERE is_climate_relevant AND owner_org_title = ? AND agreement_value > 0
        GROUP BY recipient_legal_name, recipient_name_norm, recipient_province
        ORDER BY value DESC LIMIT 15
    """, [dept_name])

    # Programs
    programs = query("""
        SELECT prog_name_en as program, COUNT(*) as count, SUM(agreement_value) as value,
               COUNT(DISTINCT recipient_name_norm) as recipients
        FROM grants WHERE is_climate_relevant AND owner_org_title = ? AND prog_name_en IS NOT NULL
        GROUP BY prog_name_en ORDER BY value DESC LIMIT 20
    """, [dept_name])

    # Yearly spending
    by_year = query("""
        SELECT year, SUM(contract_val) as contract_value, SUM(grant_val) as grant_value,
               SUM(contract_val) + SUM(grant_val) as total
        FROM (
            SELECT contract_year as year, SUM(contract_value) as contract_val, 0 as grant_val
            FROM contracts WHERE is_climate_relevant AND owner_org_title = ?
            GROUP BY contract_year
            UNION ALL
            SELECT grant_year as year, 0 as contract_val, SUM(agreement_value) as grant_val
            FROM grants WHERE is_climate_relevant AND owner_org_title = ?
            GROUP BY grant_year
        ) sub
        WHERE year IS NOT NULL AND year >= 2010
        GROUP BY year ORDER BY year
    """, [dept_name, dept_name])

    # Who lobbies this department
    lobbyists = query("""
        SELECT
            lr."EN_CLIENT_ORG_CORP_NM_AN" as org_name,
            UPPER(TRIM(COALESCE(lr."EN_CLIENT_ORG_CORP_NM_AN",''))) as org_name_norm,
            COUNT(DISTINCT lr."REG_ID_ENR") as registration_count
        FROM lobbyist_registrations lr
        JOIN lobbyist_govt_inst gi ON lr."REG_ID_ENR" = gi."REG_ID_ENR"
        WHERE gi."INSTITUTION" LIKE '%' || ? || '%'
            AND lr."EN_CLIENT_ORG_CORP_NM_AN" IS NOT NULL
            AND TRIM(lr."EN_CLIENT_ORG_CORP_NM_AN") != ''
            AND TRIM(lr."EN_CLIENT_ORG_CORP_NM_AN") != 'null'
        GROUP BY lr."EN_CLIENT_ORG_CORP_NM_AN", org_name_norm
        ORDER BY registration_count DESC
        LIMIT 20
    """, [dept_name.split("|")[0].strip().split("(")[0].strip()])

    return {
        "overview": overview[0] if overview else None,
        "top_vendors": top_vendors,
        "top_recipients": top_recipients,
        "programs": programs,
        "by_year": by_year,
        "lobbyists": lobbyists,
    }
