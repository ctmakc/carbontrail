# CarbonTrail — Deploy Runbook

Climate spending intelligence: **FastAPI + DuckDB** backend (`:8902`) and a
**Next.js 16** frontend (`:3100` on the host).

There are two supported paths:

- **Docker Compose** (recommended) — `./deploy.sh`
- **Bare-metal** — uvicorn + `next build/start`

---

## 1. Prerequisites

- Docker with the Compose v2 plugin (`docker compose`) — or legacy `docker-compose`.
- The source CSVs on the host at **`/data/opendata/canada`** (read-only mounted into the backend).
- An **Ollama OpenAI-compatible proxy** reachable from the host on **`:11434`**
  (the AI layer talks to it; set `AI_DISABLED=1` to skip it entirely).
- For bare-metal: Python 3.12 and Node 22.

---

## 2. The data / ETL step

The DuckDB file `backend/data/carbontrail.duckdb` (~1.2 GB) is **not** in git and is
**not** baked into the image. It is generated from the CSVs and mounted as a volume.

Generate it (only needed once, or when source data changes):

```bash
cd backend
python etl/ingest.py        # reads /data/opendata/canada, writes data/carbontrail.duckdb
```

`deploy.sh` does this automatically **only if the file is missing**.

> The backend opens the DB **read-only**, and `/api/health` queries it — so the file
> must exist before the backend will report healthy.

---

## 3. Environment variables

Copy the examples and edit as needed:

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env.local
```

| Variable | Service | Default (compose) | Purpose |
|---|---|---|---|
| `CARBONTRAIL_DB` | backend | `/app/data/carbontrail.duckdb` | Path to the DuckDB file (mounted volume) |
| `OLLAMA_BASE_URL` | backend | `http://host.docker.internal:11434/v1` | Ollama OpenAI-compatible endpoint |
| `LLM_MODEL` | backend | `gpt-oss:120b-cloud` | Model id served by the proxy |
| `AI_DISABLED` | backend | `0` | `1` forces the rule-based fallback |
| `NEXT_PUBLIC_API_URL` | frontend | `http://backend:8902` | Backend URL the Next.js `/api/*` rewrite targets |

> **No AWS / Bedrock.** The AI layer is now Ollama-only; the old `AWS_*` / `BEDROCK_MODEL_ID`
> variables have been removed.

### Bare-metal defaults differ for two values

| Variable | Bare-metal value |
|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8902` |

---

## 4. Ollama host-networking note (Docker)

The Ollama proxy runs on the **host**, not in a container. The backend service is given:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
environment:
  - OLLAMA_BASE_URL=http://host.docker.internal:11434/v1
```

`host.docker.internal` resolves to the host gateway, so the container can reach the
host's `:11434`. **`localhost` inside the container would point at the container itself
and fail** — use `host.docker.internal` from Docker, `localhost` only on bare-metal.

---

## 5. Deploy with Docker Compose (recommended)

```bash
./deploy.sh
```

It will: ensure the DuckDB exists (running ETL if missing) → `docker compose build` →
`docker compose up -d` → poll `http://localhost:8902/api/health` until ok → print URLs.

Manual equivalent:

```bash
docker compose build
docker compose up -d
curl -fsS http://localhost:8902/api/health
```

Resulting endpoints:

- Frontend: <http://localhost:3100>
- Backend:  <http://localhost:8902>
- API docs: <http://localhost:8902/docs>

Useful ops:

```bash
docker compose ps
docker compose logs -f backend
docker compose down            # stop
docker compose up -d --build   # rebuild + restart
```

---

## 6. Bare-metal path

**Backend:**

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python etl/ingest.py            # if the DB is missing
export OLLAMA_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=gpt-oss:120b-cloud
# export AI_DISABLED=1          # optional: rule-based fallback
uvicorn app.main:app --host 0.0.0.0 --port 8902
```

**Frontend** (separate shell):

```bash
cd frontend
npm ci
export NEXT_PUBLIC_API_URL=http://localhost:8902
npm run build
PORT=3100 npm start            # production
# or: PORT=3100 npm run dev    # development
```

---

## 7. Troubleshooting

- **Backend never healthy** — the DuckDB file is missing/unreadable. Confirm
  `backend/data/carbontrail.duckdb` exists and the `./backend/data` volume is mounted.
  Check `docker compose logs backend`.
- **AI calls fail / time out** — verify the Ollama proxy is up on the host (`curl
  http://localhost:11434/v1/models`) and that the backend uses `host.docker.internal`
  (Docker) rather than `localhost`. As a stopgap set `AI_DISABLED=1`.
- **Frontend can't reach the API** — confirm `NEXT_PUBLIC_API_URL` matches the backend
  (`http://backend:8902` in compose, `http://localhost:8902` bare-metal).
