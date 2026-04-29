"""AI-powered pattern explanation endpoints"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from ..db import query
from ..services.ai import explain_pattern

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ExplainRequest(BaseModel):
    pattern_type: str  # lobby_loop, greenwash_signal, recipient_profile, funding_gap, general
    entity_name_norm: str | None = None
    data: dict | None = None


@router.post("/explain")
def explain(req: ExplainRequest):
    """Generate AI explanation for a pattern"""
    data = req.data or {}

    # Auto-populate data from DB if entity_name provided
    if req.entity_name_norm and not req.data:
        if req.pattern_type == "lobby_loop":
            rows = query("SELECT * FROM lobby_funding_loops WHERE org_name_norm = ?", [req.entity_name_norm])
            if rows:
                r = rows[0]
                data = {
                    "org_name": r.get("org_name"),
                    "lobby_count": r.get("lobby_registration_count", 0),
                    "grant_value": r.get("grant_value", 0),
                    "grant_count": r.get("grant_count", 0),
                    "contract_value": r.get("contract_value", 0),
                    "contract_count": r.get("contract_count", 0),
                    "sole_source_count": r.get("sole_source_count", 0),
                    "receives_govt_funding": r.get("receives_govt_funding", False),
                    "signal_score": r.get("loop_signal_score", 0),
                    "total_climate_value": r.get("total_climate_value", 0),
                }

        elif req.pattern_type == "greenwash_signal":
            rows = query("SELECT * FROM greenwash_signals WHERE org_name_norm = ?", [req.entity_name_norm])
            if rows:
                r = rows[0]
                # Also get funding data
                funding = query("SELECT total_climate_value FROM lobby_funding_loops WHERE org_name_norm = ?", [req.entity_name_norm])
                data = {
                    "org_name": r.get("org_name"),
                    "registration_count": r.get("registration_count", 0),
                    "signal_type": r.get("signal_type"),
                    "any_environment": r.get("any_environment", False),
                    "any_energy": r.get("any_energy", False),
                    "any_taxation_trade": r.get("any_taxation_trade", False),
                    "max_subject_breadth": r.get("max_subject_breadth", 0),
                    "climate_funding": funding[0]["total_climate_value"] if funding else 0,
                }

        elif req.pattern_type == "recipient_profile":
            rows = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [req.entity_name_norm])
            if rows:
                data = rows[0]

    explanation = explain_pattern(req.pattern_type, data)
    return {"explanation": explanation, "pattern_type": req.pattern_type, "data": data}


@router.get("/explain-loop/{org_name_norm}")
def explain_loop(org_name_norm: str):
    """Quick endpoint — explain a lobby-funding loop by org name"""
    rows = query("SELECT * FROM lobby_funding_loops WHERE org_name_norm = ?", [org_name_norm])
    if not rows:
        return {"explanation": "Organization not found in lobby-funding loops.", "data": None}
    r = rows[0]
    data = {
        "org_name": r.get("org_name"),
        "lobby_count": r.get("lobby_registration_count", 0),
        "grant_value": r.get("grant_value", 0),
        "grant_count": r.get("grant_count", 0),
        "contract_value": r.get("contract_value", 0),
        "contract_count": r.get("contract_count", 0),
        "sole_source_count": r.get("sole_source_count", 0),
        "receives_govt_funding": r.get("receives_govt_funding", False),
        "signal_score": r.get("loop_signal_score", 0),
    }
    explanation = explain_pattern("lobby_loop", data)
    return {"explanation": explanation, "data": data}


@router.get("/explain-recipient/{entity_name_norm}")
def explain_recipient(entity_name_norm: str):
    """Quick endpoint — explain a recipient's profile"""
    rows = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [entity_name_norm])
    if not rows:
        return {"explanation": "Organization not found.", "data": None}
    data = rows[0]
    explanation = explain_pattern("recipient_profile", data)
    return {"explanation": explanation, "data": data}
