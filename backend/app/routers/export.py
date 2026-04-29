"""CSV Export — download any dataset as CSV"""
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from ..db import query
import csv
import io

router = APIRouter(prefix="/api/export", tags=["export"])


def _to_csv(data: list[dict], filename: str) -> StreamingResponse:
    if not data:
        return StreamingResponse(
            io.StringIO("No data"),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/recipients")
def export_recipients(limit: int = Query(1000, ge=1, le=10000)):
    """Export top climate recipients as CSV"""
    data = query("""
        SELECT entity_name, entity_name_norm, province, business_number,
               grant_count, grant_value, contract_count, contract_value,
               sole_source_count, total_climate_value, dual_recipient
        FROM green_recipients
        ORDER BY total_climate_value DESC LIMIT ?
    """, [limit])
    return _to_csv(data, "carbontrail_recipients.csv")


@router.get("/lobby-loops")
def export_loops(limit: int = Query(1000, ge=1, le=10000)):
    """Export lobby-funding loops as CSV"""
    data = query("""
        SELECT org_name, lobby_registration_count, grant_count, grant_value,
               contract_count, contract_value, sole_source_count,
               total_climate_value, loop_signal_score, receives_govt_funding
        FROM lobby_funding_loops WHERE loop_signal_score > 0
        ORDER BY loop_signal_score DESC LIMIT ?
    """, [limit])
    return _to_csv(data, "carbontrail_lobby_loops.csv")


@router.get("/amendments")
def export_amendments(limit: int = Query(1000, ge=1, le=10000)):
    """Export amendment creep data as CSV"""
    data = query("""
        SELECT vendor_name, owner_org_title as department,
               original_value, contract_value as final_value,
               absolute_growth, growth_pct, contract_year as year,
               is_sole_source, description_en
        FROM amendment_creep
        ORDER BY absolute_growth DESC LIMIT ?
    """, [limit])
    return _to_csv(data, "carbontrail_amendments.csv")


@router.get("/revolving-door")
def export_revolving_door():
    """Export former public servant contracts as CSV"""
    data = query("""
        SELECT vendor_name, owner_org_title as department,
               contract_value, contract_year as year, is_sole_source,
               solicitation_procedure, description_en
        FROM former_ps_contracts
        ORDER BY contract_value DESC
    """)
    return _to_csv(data, "carbontrail_revolving_door.csv")


@router.get("/greenwash")
def export_greenwash(limit: int = Query(1000, ge=1, le=10000)):
    """Export greenwash signals as CSV"""
    data = query("""
        SELECT org_name, signal_type, registration_count,
               any_environment, any_energy, any_natural_resources,
               any_taxation_trade, max_subject_breadth
        FROM greenwash_signals
        ORDER BY registration_count DESC LIMIT ?
    """, [limit])
    return _to_csv(data, "carbontrail_greenwash.csv")


@router.get("/entity/{name_norm}")
def export_entity(name_norm: str):
    """Export full entity profile as CSV (grants + contracts)"""
    upper = name_norm.upper()
    grants = query("""
        SELECT 'grant' as type, prog_name_en as program,
               agreement_value as value, owner_org_title as department,
               grant_year as year, description_en
        FROM grants WHERE is_climate_relevant AND recipient_name_norm = ?
        ORDER BY agreement_value DESC
    """, [upper])
    contracts = query("""
        SELECT 'contract' as type, description_en as program,
               contract_value as value, owner_org_title as department,
               contract_year as year, solicitation_procedure
        FROM contracts WHERE is_climate_relevant AND vendor_name_norm = ?
        ORDER BY contract_value DESC
    """, [upper])
    all_data = grants + contracts
    return _to_csv(all_data, f"carbontrail_{name_norm.replace(' ', '_')}.csv")
