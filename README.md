# 🌍 CarbonTrail — Follow the Green Money

> Climate spending intelligence for Canadian public funding.
> Where do billions in green money go? Who lobbies for it? What patterns emerge?

## Why This Exists

Canada spends **$320B+** through climate-related departments (ECCC, NRCan, Transport, Infrastructure, Agriculture, Fisheries). **70,000+ lobbying registrations** target these same departments. **Nobody connects the dots.**

CarbonTrail is a public-interest analytics platform that cross-references procurement, grants, and lobbying data to make climate spending transparent and accountable.

**We are pro-climate.** Transparent spending builds public trust. Public trust protects climate budgets. Accountability is the best defence against rollbacks.

## What It Does

| Module | Function | Key Insight |
|--------|----------|-------------|
| **Green Money Flow** | Track climate $ by program, province, year | Where billions actually land |
| **Top Recipients** | Who gets the most climate funding | Concentration and dual-sourcing |
| **Lobby ↔ Funding Loops** | Orgs that lobby AND receive climate $ | 2,262 loops detected |
| **Greenwash Radar** | Anomalous lobbying patterns | Energy+Tax nexus, broad spectrum |
| **Funding Gaps** | Where climate money ISN'T reaching | Geographic equity analysis |
| **Search** | Find any organization | Full-text across 84K+ entities |

## Data

| Source | Records | Description |
|--------|---------|-------------|
| PSPC Contracts | 1,261,485 | Federal procurement (258K climate-relevant) |
| Federal Grants | 1,276,108 | Grants & contributions (113K climate-relevant) |
| Lobbyist Registry | 127,415 | All registrations (70K target climate depts) |
| Lobbyist Subjects | 996,271 | Subject matter codes (environment, energy, resources) |
| T3010 Charities | 83,581 | Registered charities |
| Charity Directors | 568,144 | Board members for network analysis |

**Total: 5.2M+ records analyzed, 746 MB DuckDB database**

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Python FastAPI + DuckDB (embedded OLAP)
- **AI:** AWS Bedrock / Claude (planned: pattern explanations)
- **Data:** 6 Canadian open data sources, filtered for climate relevance

## Quick Start

```bash
# 1. Run ETL (one-time — ingests CSV → DuckDB, ~67 seconds)
cd backend && source /path/to/venv/bin/activate && python etl/ingest.py

# 2. Install frontend deps
cd frontend && npm install

# 3. Start everything
./start.sh

# Opens:
#   Frontend:  http://localhost:3100
#   Backend:   http://localhost:8902
#   API Docs:  http://localhost:8902/docs
```

## AWS Architecture (Target)

```
┌────────────────────────┐
│  Next.js 16 (Amplify)  │
│  Green-themed dashboard │
└──────────┬─────────────┘
           │
┌──────────▼─────────────┐
│  FastAPI (ECS/Fargate)  │
│  7 route modules        │
└──────────┬─────────────┘
           │
┌──────────▼─────────────┐     ┌──────────────────┐
│  RDS PostgreSQL / DuckDB│     │  S3 Data Lake     │
│  746 MB, 19 tables      │     │  Raw CSVs (8.8GB) │
└─────────────────────────┘     └──────────────────┘
           │
┌──────────▼─────────────┐
│  AWS Bedrock (Claude)   │
│  Pattern explanations   │
│  Anomaly narratives     │
└─────────────────────────┘
```

**Estimated AWS costs at scale: $800-2,000/month**
- RDS: $200/mo (db.t3.large)
- ECS: $150/mo (2 tasks)
- S3: $20/mo (data lake)
- Bedrock: $200-1,000/mo (AI analysis)
- CloudFront: $50/mo

## Principles

- 🌱 **Pro-climate stance** — we exist to make green spending *more effective*
- 🔍 **Review signals, not allegations** — patterns deserve investigation, not condemnation
- 📎 **Source-linked** — every finding traces to public records
- ⚖️ **Careful language** — "pattern", "signal", "requires verification"
- 🌍 **Open data, open analysis** — public money, public accountability

## License

MIT

---

*Built with conviction that climate action works better in the light.*
