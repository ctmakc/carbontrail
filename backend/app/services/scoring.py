"""
CarbonTrail Climate Accountability Score
Composite score per entity combining multiple signals.
"""
from ..db import query


def compute_entity_score(entity_name_norm: str) -> dict:
    """Compute a multi-dimensional accountability score for an entity."""

    scores = {
        "funding_concentration": 0,  # How much $ from climate depts
        "sole_source_ratio": 0,      # % of contracts that are sole-source
        "lobby_intensity": 0,         # Lobby registrations per $ received
        "dual_recipient": 0,          # Gets both grants AND contracts
        "multi_department": 0,        # Funded by multiple depts
        "amendment_creep": 0,         # Contract growth via amendments
        "revolving_door": 0,          # Former public servant flag
        "overall": 0,
    }
    details = {}

    # Get profile
    profile = query("SELECT * FROM green_recipients WHERE entity_name_norm = ?", [entity_name_norm])
    if not profile:
        return {"scores": scores, "details": {}, "grade": "N/A"}
    p = profile[0]

    # 1. Funding concentration (0-25): log scale of total climate value
    tv = p.get("total_climate_value", 0)
    if tv > 0:
        import math
        scores["funding_concentration"] = min(25, int(math.log10(max(tv, 1)) * 3))
        details["funding_concentration"] = f"${tv:,.0f} total climate funding"

    # 2. Sole-source ratio (0-25)
    cc = p.get("contract_count", 0)
    ss = p.get("sole_source_count", 0)
    if cc > 0:
        ratio = ss / cc
        scores["sole_source_ratio"] = int(ratio * 25)
        details["sole_source_ratio"] = f"{ss}/{cc} contracts sole-source ({ratio*100:.0f}%)"
    else:
        details["sole_source_ratio"] = "No contracts"

    # 3. Lobby intensity (0-20)
    lobby = query("SELECT * FROM lobby_funding_loops WHERE org_name_norm = ?", [entity_name_norm])
    if lobby:
        lc = lobby[0].get("lobby_registration_count", 0)
        scores["lobby_intensity"] = min(20, lc * 2)
        details["lobby_intensity"] = f"{lc} lobby registrations"
    else:
        details["lobby_intensity"] = "No lobbying detected"

    # 4. Dual recipient (0-15)
    if p.get("dual_recipient"):
        scores["dual_recipient"] = 15
        details["dual_recipient"] = "Receives both grants AND contracts from climate depts"
    else:
        details["dual_recipient"] = "Single funding stream"

    # 5. Multi-department (0-15)
    gp = p.get("grant_programs", 0)
    if gp >= 3:
        scores["multi_department"] = 15
    elif gp >= 2:
        scores["multi_department"] = 10
    elif gp >= 1:
        scores["multi_department"] = 5
    details["multi_department"] = f"{gp} different climate programs"

    # 6. Amendment creep (0-10)
    amend = query("""
        SELECT COUNT(*) as c, SUM(absolute_growth) as growth, MAX(growth_pct) as max_pct
        FROM amendment_creep WHERE vendor_name_norm = ?
    """, [entity_name_norm])
    if amend and amend[0]["c"] > 0:
        ac = amend[0]["c"]
        scores["amendment_creep"] = min(10, ac * 2)
        details["amendment_creep"] = f"{ac} amended contracts, max growth {amend[0]['max_pct']:.0f}%"
    else:
        details["amendment_creep"] = "No amendment creep detected"

    # 7. Revolving door (0-10)
    fps = query("SELECT COUNT(*) as c, SUM(contract_value) as v FROM former_ps_contracts WHERE vendor_name_norm = ?", [entity_name_norm])
    if fps and fps[0]["c"] > 0:
        scores["revolving_door"] = min(10, fps[0]["c"] * 5)
        details["revolving_door"] = f"{fps[0]['c']} contracts flagged as former public servant (${fps[0]['v']:,.0f})"
    else:
        details["revolving_door"] = "No revolving door flags"

    # Overall
    scores["overall"] = sum(v for k, v in scores.items() if k != "overall")

    # Grade
    o = scores["overall"]
    grade = "A" if o <= 20 else "B" if o <= 40 else "C" if o <= 60 else "D" if o <= 80 else "F"

    return {"scores": scores, "details": details, "grade": grade}
