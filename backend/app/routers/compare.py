"""Entity Comparison — side-by-side org analysis"""
from fastapi import APIRouter, Query
from ..db import query

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("/")
def compare_entities(
    a: str = Query(..., min_length=2, description="First entity name (normalized)"),
    b: str = Query(..., min_length=2, description="Second entity name (normalized)"),
):
    """Compare two entities side-by-side with all available data"""
    def get_entity(name_norm: str) -> dict:
        name_upper = name_norm.upper()
        profile = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [name_upper])
        if not profile:
            return {"name": name_norm, "found": False}

        p = profile[0]
        lobby = query("SELECT * FROM lobby_funding_loops WHERE org_name_norm = ?", [name_upper])
        greenwash = query("SELECT * FROM greenwash_signals WHERE org_name_norm = ?", [name_upper])
        amendments = query("""
            SELECT COUNT(*) as c, SUM(absolute_growth) as growth
            FROM amendment_creep WHERE vendor_name_norm = ?
        """, [name_upper])
        fps = query("SELECT COUNT(*) as c FROM former_ps_contracts WHERE vendor_name_norm = ?", [name_upper])

        # Yearly breakdown
        yearly_contracts = query("""
            SELECT contract_year as year, COUNT(*) as contracts, SUM(contract_value) as value
            FROM contracts WHERE is_climate_relevant AND vendor_name_norm = ?
            GROUP BY contract_year ORDER BY contract_year
        """, [name_upper])
        yearly_grants = query("""
            SELECT grant_year as year, COUNT(*) as grants, SUM(agreement_value) as value
            FROM grants WHERE is_climate_relevant AND recipient_name_norm = ?
            GROUP BY grant_year ORDER BY grant_year
        """, [name_upper])

        from ..services.scoring import compute_entity_score
        score = compute_entity_score(name_upper)

        return {
            "name": p.get("entity_name") or name_norm,
            "name_norm": name_upper,
            "found": True,
            "province": p.get("province"),
            "grant_count": p.get("grant_count", 0),
            "grant_value": p.get("grant_value", 0),
            "contract_count": p.get("contract_count", 0),
            "contract_value": p.get("contract_value", 0),
            "total_climate_value": p.get("total_climate_value", 0),
            "sole_source_count": p.get("sole_source_count", 0),
            "dual_recipient": p.get("dual_recipient", False),
            "grant_programs": p.get("grant_programs", 0),
            "lobby_registrations": lobby[0]["lobby_registration_count"] if lobby else 0,
            "loop_signal_score": lobby[0]["loop_signal_score"] if lobby else 0,
            "greenwash_signal": greenwash[0]["signal_type"] if greenwash else None,
            "amendment_count": amendments[0]["c"] if amendments else 0,
            "amendment_growth": amendments[0]["growth"] if amendments else 0,
            "former_ps_contracts": fps[0]["c"] if fps else 0,
            "score": score,
            "yearly_contracts": yearly_contracts,
            "yearly_grants": yearly_grants,
        }

    entity_a = get_entity(a)
    entity_b = get_entity(b)

    return {"a": entity_a, "b": entity_b}
