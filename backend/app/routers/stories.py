"""Stories — pre-built investigative narratives from real data"""
from fastapi import APIRouter
from ..cache import cached_query as query  # cached

router = APIRouter(prefix="/api/stories", tags=["stories"])


@router.get("/list")
def list_stories():
    """Curated data stories / investigations"""
    stories = []

    # Story 1: The EV Battery Billions
    ev = query("""
        SELECT recipient_legal_name as entity, prog_name_en as program,
               agreement_value as value, grant_year as year
        FROM grants WHERE is_climate_relevant
            AND LOWER(prog_name_en) LIKE '%electric vehicle%'
            AND agreement_value > 100000000
        ORDER BY agreement_value DESC LIMIT 5
    """)
    ev_total = sum(r["value"] for r in ev)
    stories.append({
        "id": "ev-battery-billions",
        "title": "The EV Battery Billions",
        "subtitle": f"${ev_total:,.0f} in electric vehicle grants — who gets Canada's biggest climate bet?",
        "icon": "🔋",
        "category": "Deep Dive",
        "entities": [{"name": r["entity"], "value": r["value"], "program": r["program"], "year": r["year"]} for r in ev],
        "total_value": ev_total,
        "key_finding": f"Top 5 EV grants total ${ev_total:,.0f}. The single largest: ${ev[0]['value']:,.0f} to {ev[0]['entity']} ({ev[0]['year']})" if ev else "",
    })

    # Story 2: Sole-Source Climate Contracts
    ss = query("""
        SELECT vendor_name as entity, vendor_name_norm as entity_norm,
               owner_org_title as department,
               COUNT(*) as total, SUM(contract_value) as value,
               SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as ss_count,
               SUM(CASE WHEN is_sole_source THEN contract_value ELSE 0 END) as ss_value
        FROM contracts WHERE is_climate_relevant AND contract_value > 0
        GROUP BY vendor_name, vendor_name_norm, owner_org_title
        HAVING SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) >= 0.9
            AND SUM(contract_value) > 100000000
        ORDER BY ss_value DESC LIMIT 5
    """)
    ss_total = sum(r["ss_value"] for r in ss)
    stories.append({
        "id": "sole-source-billions",
        "title": "Billions Without Competition",
        "subtitle": f"${ss_total:,.0f} in climate contracts awarded non-competitively to repeat vendors",
        "icon": "🔒",
        "category": "Accountability",
        "entities": [{"name": r["entity"], "value": r["ss_value"], "department": r["department"][:50], "ss_rate": f"{r['ss_count']}/{r['total']}"} for r in ss],
        "total_value": ss_total,
        "key_finding": f"{len(ss)} vendors received ${ss_total:,.0f} in 90%+ sole-source climate contracts" if ss else "",
    })

    # Story 3: Who Lobbies AND Gets Paid
    loops = query("""
        SELECT org_name as entity, lobby_registration_count as lobbying,
               total_climate_value as value, loop_signal_score as score,
               sole_source_count as sole_source, receives_govt_funding as govt_funded
        FROM lobby_funding_loops
        WHERE loop_signal_score >= 60 AND total_climate_value > 10000000
        ORDER BY loop_signal_score DESC LIMIT 5
    """)
    loop_total = sum(r["value"] for r in loops)
    stories.append({
        "id": "lobby-funding-nexus",
        "title": "The Lobby-Funding Nexus",
        "subtitle": f"Organizations that lobby climate departments AND receive ${loop_total:,.0f} from them",
        "icon": "🔄",
        "category": "Accountability",
        "entities": [{"name": r["entity"], "value": r["value"], "lobbying": r["lobbying"], "score": r["score"]} for r in loops],
        "total_value": loop_total,
        "key_finding": f"Top 5 high-signal loops: {loops[0]['entity']} has {loops[0]['lobbying']} lobby registrations and ${loops[0]['value']:,.0f} in climate funding" if loops else "",
    })

    # Story 4: Provincial Divide
    provs = query("""
        SELECT recipient_province as province,
               SUM(agreement_value) as value,
               COUNT(*) as grants,
               COUNT(DISTINCT recipient_name_norm) as recipients
        FROM grants WHERE is_climate_relevant AND agreement_value > 0
            AND recipient_province IS NOT NULL AND recipient_province != ''
        GROUP BY recipient_province
        ORDER BY value DESC
    """)
    if len(provs) >= 2:
        top_prov = provs[0]
        bot_prov = provs[-1]
        ratio = top_prov["value"] / bot_prov["value"] if bot_prov["value"] > 0 else 0
        stories.append({
            "id": "provincial-divide",
            "title": "The Provincial Climate Divide",
            "subtitle": f"{top_prov['province']} gets {ratio:.0f}x more climate funding than {bot_prov['province']}",
            "icon": "🗺️",
            "category": "Equity",
            "entities": [{"name": p["province"], "value": p["value"], "grants": p["grants"], "recipients": p["recipients"]} for p in provs[:6]],
            "total_value": sum(p["value"] for p in provs),
            "key_finding": f"{top_prov['province']}: ${top_prov['value']:,.0f} across {top_prov['grants']} grants. {bot_prov['province']}: ${bot_prov['value']:,.0f} across {bot_prov['grants']} grants. Ratio: {ratio:.0f}:1",
        })

    # Story 5: The 2018 Climate Surge
    surge = query("""
        WITH yearly AS (
            SELECT year, SUM(total_value) as total FROM climate_spending_timeline
            WHERE year >= 2015 AND year <= 2025 GROUP BY year
        )
        SELECT y2.year, y2.total, y1.total as prev,
               y2.total - y1.total as increase
        FROM yearly y1 JOIN yearly y2 ON y2.year = y1.year + 1
        ORDER BY increase DESC LIMIT 1
    """)
    if surge:
        s = surge[0]
        stories.append({
            "id": "spending-surge",
            "title": f"The {s['year']} Climate Spending Surge",
            "subtitle": f"Climate spending jumped ${s['increase']:,.0f} in a single year",
            "icon": "📈",
            "category": "Trends",
            "entities": [],
            "total_value": s["total"],
            "key_finding": f"From {s['year']-1} (${s['prev']:,.0f}) to {s['year']} (${s['total']:,.0f}): a ${s['increase']:,.0f} increase",
        })

    return stories
