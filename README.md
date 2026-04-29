# 🌍 CarbonTrail — Follow the Green Money

> Climate spending intelligence for Canadian public funding.
> Track where $321B+ in green money goes, who lobbies for it, and what patterns emerge.

[![GitHub](https://img.shields.io/badge/GitHub-ctmakc%2Fcarbontrail-emerald?style=flat&logo=github)](https://github.com/ctmakc/carbontrail)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![DuckDB](https://img.shields.io/badge/DuckDB-OLAP-FFC107?style=flat)

## Why This Exists

Canada spends **$321B+** through climate-related departments. **70,000+ lobbying registrations** target these departments. **Nobody connects the dots.**

CarbonTrail cross-references procurement, grants, and lobbying data to make climate spending transparent. **We are pro-climate** — transparent spending builds public trust. Public trust protects climate budgets.

## Features

### 📊 Analytics
| Feature | Description |
|---------|-------------|
| **Dashboard** | Live stats, top signals, spending timeline (Recharts) |
| **Green Money Flow** | Sankey diagram: Department → Program → Recipient |
| **Anomaly Detection** | Spending spikes, sole-source concentration, new vendor signals |
| **Funding Gaps** | Interactive Canada map, provincial equity analysis |

### 🕵️ Investigation
| Feature | Description |
|---------|-------------|
| **Lobby ↔ Funding Loops** | Orgs that lobby AND receive climate $ (2,262 detected) |
| **Greenwash Radar** | Energy-tax nexus, broad spectrum lobbying patterns |
| **Network Graph** | Force-directed visualization of org ↔ department connections |
| **Entity Profiles** | Full dossier: grants, contracts, lobbying, timeline, AI analysis |
| **Compare** | Side-by-side organization comparison |

### 🤖 Intelligence
| Feature | Description |
|---------|-------------|
| **AI Chat** | Conversational data exploration (Bedrock/Claude + fallback) |
| **AI Explanations** | One-click pattern analysis on every entity |
| **Climate Programs** | Deep-dive into 100+ individual programs with charts |

### 🛠️ Power Features
| Feature | Description |
|---------|-------------|
| **⌘K Command Palette** | Instant search across entities + page navigation |
| **Watchlist** | Track organizations (localStorage) |
| **CSV Export** | Download any table as CSV |
| **Print Reports** | Print-friendly entity profiles |
| **Keyboard Shortcuts** | Press `?` for shortcut panel |
| **Responsive** | Mobile hamburger menu, auto-collapse sidebar |
| **Toast Notifications** | Feedback on watchlist, export, share actions |

## Data Sources

| Source | Records | Coverage |
|--------|---------|----------|
| PSPC Contracts | 1,261,485 | Federal procurement (258K climate-relevant) |
| Federal Grants | 1,276,108 | Grants & contributions (113K climate-relevant) |
| Lobbyist Registry | 127,415 | All registrations (70K target climate depts) |
| Lobbyist Subjects | 996,271 | Subject matter codes |
| T3010 Charities | 83,581 | Registered charities |
| Charity Directors | 568,144 | Board members |

**Total: 5.2M+ records analyzed, 747 MB DuckDB database**

## Tech Stack

```
Frontend:  Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · d3-sankey · react-force-graph-2d
Backend:   Python FastAPI · DuckDB (embedded OLAP)
AI:        AWS Bedrock / Claude (with rule-based fallback)
Data:      Canadian Open Data (Open Government Licence)
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/ctmakc/carbontrail
cd carbontrail

# 2. ETL (one-time — downloads nothing, uses local CSVs)
cd backend
pip install -r requirements.txt
python etl/ingest.py     # ~67 seconds, creates 747MB DuckDB

# 3. Backend
uvicorn app.main:app --port 8902

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## Architecture

```
┌────────────────────┐     ┌───────────────────────┐
│  Next.js 16 (18pg) │────▶│   FastAPI (35 endpts)  │
│  Tailwind + shadcn  │     │   13 routers           │
│  Recharts · d3      │     │   AI service (Bedrock) │
│  react-force-graph  │     └───────────┬────────────┘
└────────────────────┘                  │
                               ┌────────▼────────┐
                               │  DuckDB (747MB)  │
                               │  17 tables       │
                               │  5.2M records    │
                               └─────────────────┘
```

## Key Findings

- **$321B+** tracked in climate-related spending
- **2,262** lobby-to-funding loops detected
- **3,559** dual recipients (grants + contracts from same depts)
- **$8.6B** in 100% sole-source contracts (Chantier Davie)
- **5,585** greenwash signals
- **NextStar Energy**: $14.5B grant + 6 lobbying registrations

## Principles

🌱 **Pro-climate** — transparency protects green budgets
🔍 **Review signals, not allegations** — careful language always
📎 **Source-linked** — every finding traces to public records
⚖️ **Responsible** — "pattern", "signal", "requires verification"

## License

MIT

---

*Built with conviction that climate action works better in the light.* 🌍
