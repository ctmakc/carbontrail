"""CarbonTrail API test suite"""
import pytest
from fastapi.testclient import TestClient
import sys; sys.path.insert(0, "/data/projects/carbontrail/backend"); from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["tables"] > 0


def test_dashboard_stats():
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["climate_contracts"] > 0
    assert data["climate_grants"] > 0
    assert data["climate_lobby_registrations"] > 0


def test_dashboard_timeline():
    r = client.get("/api/dashboard/spending-timeline")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "year" in data[0]
    assert "total_value" in data[0]


def test_top_signals():
    r = client.get("/api/dashboard/top-signals?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert len(data) <= 5
    if data:
        assert "org_name" in data[0]
        assert "loop_signal_score" in data[0]


def test_search():
    r = client.get("/api/search/?q=shell&limit=3")
    assert r.status_code == 200
    data = r.json()
    assert len(data) <= 3
    if data:
        assert "name_norm" in data[0]


def test_search_min_length():
    r = client.get("/api/search/?q=a")
    assert r.status_code == 422  # validation error


def test_recipients_top():
    r = client.get("/api/recipients/top?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "total_climate_value" in data[0]


def test_recipients_dual():
    r = client.get("/api/recipients/dual?limit=5")
    assert r.status_code == 200
    data = r.json()
    for d in data:
        assert d.get("dual_recipient") is not False  # should be dual


def test_recipients_detail():
    r = client.get(f"/api/recipients/detail/NEXTSTAR%20ENERGY%20INC.")
    assert r.status_code == 200
    data = r.json()
    assert "profile" in data
    assert "grants" in data
    assert "contracts" in data


def test_recipients_score():
    r = client.get("/api/recipients/score/NEXTSTAR%20ENERGY%20INC.")
    assert r.status_code == 200
    data = r.json()
    assert "scores" in data
    assert "grade" in data
    assert data["scores"]["overall"] > 0


def test_loops_top():
    r = client.get("/api/loops/top?limit=5")
    assert r.status_code == 200
    data = r.json()
    if data:
        assert "loop_signal_score" in data[0]


def test_loops_stats():
    r = client.get("/api/loops/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_orgs_with_loops" in data


def test_flow_by_program():
    r = client.get("/api/flow/by-program?limit=5")
    assert r.status_code == 200
    assert len(r.json()) <= 5


def test_flow_sankey():
    r = client.get("/api/flow/sankey?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert "dept_to_program" in data
    assert "program_to_recipient" in data


def test_greenwash_signals():
    r = client.get("/api/greenwash/signals?limit=5")
    assert r.status_code == 200


def test_anomalies_summary():
    r = client.get("/api/anomalies/summary")
    assert r.status_code == 200
    data = r.json()
    assert "spending_spikes" in data


def test_departments_list():
    r = client.get("/api/departments/list")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "total_value" in data[0]


def test_programs_list():
    r = client.get("/api/programs/list?limit=5")
    assert r.status_code == 200
    assert len(r.json()) <= 5


def test_insights():
    r = client.get("/api/insights/key-findings")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "title" in data[0]


def test_stories():
    r = client.get("/api/stories/list")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "title" in data[0]
    assert "total_value" in data[0]


def test_explorer_templates():
    r = client.get("/api/explorer/templates")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "id" in data[0]


def test_explorer_run():
    r = client.post("/api/explorer/run", json={"template_id": "spending_by_year"})
    assert r.status_code == 200
    data = r.json()
    assert "data" in data
    assert len(data["data"]) > 0


def test_graph_lobby_network():
    r = client.get("/api/graph/lobby-network?min_score=50&limit=5")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "links" in data


def test_chat():
    r = client.post("/api/chat/", json={"message": "top recipients"})
    assert r.status_code == 200
    data = r.json()
    assert "reply" in data
    assert len(data["reply"]) > 10


def test_gaps_provincial():
    r = client.get("/api/gaps/provincial")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
