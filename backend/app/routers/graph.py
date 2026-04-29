"""Graph data for force-directed network visualization"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("/lobby-network")
def lobby_network(min_score: int = Query(30), limit: int = Query(80)):
    """
    Build a force-directed graph of lobby-funding loops.
    Nodes = organizations + departments
    Edges = lobbying relationship + funding relationship
    """
    # Get top loop orgs
    orgs = query("""
        SELECT
            org_name_norm as id,
            org_name as label,
            lobby_registration_count as lobby_count,
            COALESCE(total_climate_value, 0) as climate_value,
            COALESCE(grant_count, 0) as grants,
            COALESCE(contract_count, 0) as contracts,
            COALESCE(sole_source_count, 0) as sole_source,
            loop_signal_score as score
        FROM lobby_funding_loops
        WHERE loop_signal_score >= ?
        ORDER BY loop_signal_score DESC
        LIMIT ?
    """, [min_score, limit])

    if not orgs:
        return {"nodes": [], "links": []}

    org_ids = [o["id"] for o in orgs]

    # Find which climate departments these orgs got money from
    dept_links = []
    for org_id in org_ids:
        # Grants from which departments?
        grant_depts = query("""
            SELECT DISTINCT
                owner_org_title as dept,
                COUNT(*) as count,
                SUM(agreement_value) as value
            FROM grants
            WHERE is_climate_relevant
                AND recipient_name_norm = ?
                AND owner_org_title IS NOT NULL
            GROUP BY owner_org_title
            HAVING SUM(agreement_value) > 0
            ORDER BY value DESC
            LIMIT 3
        """, [org_id])
        for d in grant_depts:
            dept_links.append({"source": org_id, "target": d["dept"], "type": "grant", "value": d["value"], "count": d["count"]})

        # Contracts from which departments?
        contract_depts = query("""
            SELECT DISTINCT
                owner_org_title as dept,
                COUNT(*) as count,
                SUM(contract_value) as value
            FROM contracts
            WHERE is_climate_relevant
                AND vendor_name_norm = ?
                AND owner_org_title IS NOT NULL
            GROUP BY owner_org_title
            HAVING SUM(contract_value) > 0
            ORDER BY value DESC
            LIMIT 3
        """, [org_id])
        for d in contract_depts:
            dept_links.append({"source": org_id, "target": d["dept"], "type": "contract", "value": d["value"], "count": d["count"]})

    # Collect unique departments
    dept_names = list(set(l["target"] for l in dept_links))

    # Build nodes
    nodes = []
    for o in orgs:
        nodes.append({
            "id": o["id"],
            "label": o["label"] or o["id"],
            "type": "org",
            "score": o["score"],
            "climate_value": o["climate_value"],
            "lobby_count": o["lobby_count"],
            "size": max(4, min(20, (o["score"] or 0) / 5)),
        })

    for dept in dept_names:
        short = dept.split("|")[0].strip() if dept else "Unknown"
        nodes.append({
            "id": dept,
            "label": short,
            "type": "dept",
            "score": 0,
            "climate_value": 0,
            "lobby_count": 0,
            "size": 12,
        })

    # Build links
    links = []
    for l in dept_links:
        links.append({
            "source": l["source"],
            "target": l["target"],
            "type": l["type"],
            "value": l["value"],
            "count": l["count"],
        })

    return {"nodes": nodes, "links": links}


@router.get("/entity-connections/{entity_name_norm}")
def entity_connections(entity_name_norm: str):
    """Get graph of single entity's connections to departments"""
    # Grants
    grants = query("""
        SELECT owner_org_title as dept, COUNT(*) as count, SUM(agreement_value) as value
        FROM grants WHERE is_climate_relevant AND recipient_name_norm = ? AND owner_org_title IS NOT NULL
        GROUP BY owner_org_title ORDER BY value DESC LIMIT 10
    """, [entity_name_norm])

    # Contracts
    contracts = query("""
        SELECT owner_org_title as dept, COUNT(*) as count, SUM(contract_value) as value
        FROM contracts WHERE is_climate_relevant AND vendor_name_norm = ? AND owner_org_title IS NOT NULL
        GROUP BY owner_org_title ORDER BY value DESC LIMIT 10
    """, [entity_name_norm])

    # Lobby targets
    lobby = query("""
        SELECT DISTINCT gi."INSTITUTION" as dept, COUNT(*) as count
        FROM climate_lobby_registrations lr
        JOIN lobbyist_govt_inst gi ON lr."REG_ID_ENR" = gi."REG_ID_ENR"
        WHERE UPPER(TRIM(COALESCE(lr."EN_CLIENT_ORG_CORP_NM_AN",''))) = ?
        GROUP BY gi."INSTITUTION"
        ORDER BY count DESC
        LIMIT 10
    """, [entity_name_norm])

    nodes = [{"id": entity_name_norm, "label": entity_name_norm, "type": "org", "size": 16}]
    links = []

    all_depts = set()
    for g in grants:
        all_depts.add(g["dept"])
        links.append({"source": entity_name_norm, "target": g["dept"], "type": "grant", "value": g["value"]})
    for c in contracts:
        all_depts.add(c["dept"])
        links.append({"source": entity_name_norm, "target": c["dept"], "type": "contract", "value": c["value"]})
    for l in lobby:
        all_depts.add(l["dept"])
        links.append({"source": entity_name_norm, "target": l["dept"], "type": "lobby", "value": l["count"]})

    for dept in all_depts:
        short = dept.split("(")[0].strip() if dept else "Unknown"
        nodes.append({"id": dept, "label": short, "type": "dept", "size": 10})

    return {"nodes": nodes, "links": links}
