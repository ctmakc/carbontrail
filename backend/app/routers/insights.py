"""Auto-generated insights from the data — key findings for the dashboard"""
from fastapi import APIRouter
from ..db import query

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/key-findings")
def key_findings():
    """Auto-generate top insights from the dataset"""
    findings = []

    # 1. Biggest single grant
    r = query("""
        SELECT recipient_legal_name as entity, prog_name_en as program,
               agreement_value as value, owner_org_title as dept, grant_year as year
        FROM grants WHERE is_climate_relevant AND agreement_value IS NOT NULL
        ORDER BY agreement_value DESC LIMIT 1
    """)
    if r:
        findings.append({
            "type": "record", "icon": "💰",
            "title": f"Largest single climate grant: {r[0]['value']:,.0f}",
            "detail": f"{r[0]['entity']} received ${r[0]['value']:,.0f} from {r[0]['program']} ({r[0]['year']})",
            "entity_norm": r[0]["entity"].upper() if r[0]["entity"] else None,
        })

    # 2. Most lobbying registrations
    r = query("""
        SELECT org_name, lobby_registration_count, total_climate_value
        FROM lobby_funding_loops
        WHERE total_climate_value > 0
        ORDER BY lobby_registration_count DESC LIMIT 1
    """)
    if r:
        findings.append({
            "type": "lobby", "icon": "🏛️",
            "title": f"Most active climate lobbyist: {r[0]['lobby_registration_count']} registrations",
            "detail": f"{r[0]['org_name']} — {r[0]['lobby_registration_count']} lobby registrations + ${r[0]['total_climate_value']:,.0f} in climate funding",
            "entity_norm": r[0]["org_name"].upper() if r[0]["org_name"] else None,
        })

    # 3. Highest sole-source rate
    r = query("""
        SELECT vendor_name as entity, vendor_name_norm as entity_norm,
               COUNT(*) as total, 
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as ss,
               SUM(contract_value) as value
        FROM contracts WHERE is_climate_relevant AND contract_value > 0
        GROUP BY vendor_name, vendor_name_norm
        HAVING COUNT(*) >= 10 AND SUM(contract_value) > 10000000
        ORDER BY SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) DESC
        LIMIT 1
    """)
    if r:
        pct = (r[0]["ss"] / r[0]["total"] * 100) if r[0]["total"] > 0 else 0
        findings.append({
            "type": "sole_source", "icon": "⚠️",
            "title": f"Highest sole-source rate: {pct:.0f}% ({r[0]['ss']}/{r[0]['total']} contracts)",
            "detail": f"{r[0]['entity']} — ${r[0]['value']:,.0f} total, {pct:.0f}% non-competitive",
            "entity_norm": r[0]["entity_norm"],
        })

    # 4. Province with lowest per-grant funding
    r = query("""
        SELECT recipient_province as province, COUNT(*) as grants,
               SUM(agreement_value) as total, AVG(agreement_value) as avg_val
        FROM grants WHERE is_climate_relevant AND agreement_value > 0
            AND recipient_province IS NOT NULL AND recipient_province != ''
        GROUP BY recipient_province
        HAVING COUNT(*) >= 10
        ORDER BY AVG(agreement_value) ASC LIMIT 1
    """)
    if r:
        findings.append({
            "type": "gap", "icon": "📍",
            "title": f"Smallest avg climate grant: {r[0]['province']}",
            "detail": f"{r[0]['province']} averages ${r[0]['avg_val']:,.0f} per grant ({r[0]['grants']} grants, ${r[0]['total']:,.0f} total)",
        })

    # 5. Year with biggest spending increase
    r = query("""
        WITH yearly AS (
            SELECT year, SUM(total_value) as total
            FROM climate_spending_timeline
            WHERE year >= 2015 AND year <= 2025
            GROUP BY year
        )
        SELECT y2.year, y2.total, y1.total as prev,
               y2.total - y1.total as increase,
               (y2.total - y1.total) / NULLIF(y1.total, 0) * 100 as pct_increase
        FROM yearly y1 JOIN yearly y2 ON y2.year = y1.year + 1
        WHERE y1.total > 0
        ORDER BY increase DESC LIMIT 1
    """)
    if r:
        findings.append({
            "type": "trend", "icon": "📈",
            "title": f"Biggest spending jump: {r[0]['year']} (+{r[0]['pct_increase']:.0f}%)",
            "detail": f"Climate spending jumped ${r[0]['increase']:,.0f} from {r[0]['year']-1} to {r[0]['year']} ({r[0]['pct_increase']:.0f}% increase)",
        })

    # 6. Most dual-funded organizations
    r = query("""
        SELECT entity_name, grant_value, contract_value, total_climate_value,
               grant_programs, sole_source_count
        FROM green_recipients WHERE dual_recipient
        ORDER BY total_climate_value DESC LIMIT 1
    """)
    if r:
        findings.append({
            "type": "dual", "icon": "🔄",
            "title": f"Top dual recipient: ${r[0]['total_climate_value']:,.0f}",
            "detail": f"{r[0]['entity_name']} gets both grants (${r[0]['grant_value']:,.0f}) and contracts (${r[0]['contract_value']:,.0f}) from climate depts",
            "entity_norm": r[0]["entity_name"].upper() if r[0]["entity_name"] else None,
        })

    # 7. Greenwash signal count
    r = query("SELECT signal_type, COUNT(*) as c FROM greenwash_signals WHERE signal_type != 'standard' GROUP BY signal_type")
    if r:
        total = sum(x["c"] for x in r)
        types = ", ".join(f'{x["signal_type"]}: {x["c"]}' for x in r)
        findings.append({
            "type": "greenwash", "icon": "🔍",
            "title": f"{total} greenwash signals detected",
            "detail": f"Anomalous lobbying patterns: {types}",
        })

    return findings
