"""Data Explorer — curated query templates for exploration"""
from fastapi import APIRouter
from pydantic import BaseModel
from ..db import query

router = APIRouter(prefix="/api/explorer", tags=["explorer"])

ALLOWED_TABLES = {
    "green_recipients", "lobby_funding_loops", "greenwash_signals",
    "provincial_climate_gaps", "climate_spending_timeline",
}

TEMPLATES = [
    {
        "id": "top_recipients_province",
        "name": "Top recipients by province",
        "description": "Largest climate funding recipients in a specific province",
        "params": [{"name": "province", "type": "text", "default": "ON"}],
        "sql": """SELECT entity_name, total_climate_value, grant_count, contract_count, sole_source_count, dual_recipient
FROM green_recipients WHERE province = ? AND total_climate_value > 0
ORDER BY total_climate_value DESC LIMIT 20"""
    },
    {
        "id": "loops_above_score",
        "name": "Lobby loops above score threshold",
        "description": "Organizations with loop signal score above a threshold",
        "params": [{"name": "min_score", "type": "number", "default": "50"}],
        "sql": """SELECT org_name, lobby_registration_count, grant_value, contract_value,
total_climate_value, sole_source_count, loop_signal_score
FROM lobby_funding_loops WHERE loop_signal_score >= ?
ORDER BY loop_signal_score DESC LIMIT 30"""
    },
    {
        "id": "spending_by_year",
        "name": "Climate spending by year",
        "description": "Total climate spending across all departments by year",
        "params": [],
        "sql": """SELECT year, SUM(total_value) as total, SUM(record_count) as records, SUM(recipient_count) as recipients
FROM climate_spending_timeline WHERE year >= 2010
GROUP BY year ORDER BY year"""
    },
    {
        "id": "province_program_matrix",
        "name": "Province × Program funding matrix",
        "description": "How much each program spends in each province",
        "params": [{"name": "province", "type": "text", "default": "BC"}],
        "sql": """SELECT program, SUM(total_value) as value, SUM(grant_count) as grants, SUM(recipient_count) as recipients
FROM provincial_climate_gaps WHERE province = ?
GROUP BY program ORDER BY value DESC LIMIT 20"""
    },
    {
        "id": "greenwash_with_funding",
        "name": "Greenwash signals with climate funding",
        "description": "Flagged orgs that also receive climate money",
        "params": [],
        "sql": """SELECT gs.org_name, gs.signal_type, gs.registration_count, gs.max_subject_breadth,
COALESCE(lf.total_climate_value, 0) as climate_funding, lf.loop_signal_score
FROM greenwash_signals gs
LEFT JOIN lobby_funding_loops lf ON gs.org_name_norm = lf.org_name_norm
WHERE gs.signal_type != 'standard' AND COALESCE(lf.total_climate_value, 0) > 0
ORDER BY lf.total_climate_value DESC LIMIT 20"""
    },
    {
        "id": "dual_recipients_sole_source",
        "name": "Dual recipients with sole-source contracts",
        "description": "Orgs getting both grants AND sole-source contracts",
        "params": [],
        "sql": """SELECT entity_name, province, grant_value, contract_value, sole_source_count, total_climate_value
FROM green_recipients WHERE dual_recipient AND sole_source_count > 0
ORDER BY total_climate_value DESC LIMIT 20"""
    },
]


@router.get("/templates")
def get_templates():
    return TEMPLATES


class RunQuery(BaseModel):
    template_id: str
    params: list[str] = []


@router.post("/run")
def run_query(req: RunQuery):
    template = next((t for t in TEMPLATES if t["id"] == req.template_id), None)
    if not template:
        return {"error": "Template not found", "data": []}
    
    try:
        results = query(template["sql"], req.params if req.params else None)
        return {"data": results, "count": len(results), "template": template["name"]}
    except Exception as e:
        return {"error": str(e), "data": []}
