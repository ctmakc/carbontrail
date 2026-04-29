"""
CarbonTrail — Follow the Green Money
=====================================
Climate spending intelligence for Canadian public funding
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import dashboard, money_flow, lobby_loops, greenwash, gaps, recipients, search, ai, graph, programs, chat, anomalies, departments, explorer, insights, stories

app = FastAPI(
    title="CarbonTrail API",
    description="Climate spending intelligence — Follow the Green Money",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(money_flow.router)
app.include_router(lobby_loops.router)
app.include_router(greenwash.router)
app.include_router(gaps.router)
app.include_router(recipients.router)
app.include_router(search.router)
app.include_router(ai.router)
app.include_router(graph.router)
app.include_router(programs.router)
app.include_router(chat.router)
app.include_router(anomalies.router)
app.include_router(departments.router)
app.include_router(explorer.router)
app.include_router(insights.router)
app.include_router(stories.router)


@app.get("/api/health")
def health():
    from .db import query
    tables = query("SELECT count(*) as c FROM information_schema.tables WHERE table_schema='main'")
    return {"status": "ok", "tables": tables[0]["c"], "version": "0.1.0"}
