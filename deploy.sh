#!/usr/bin/env bash
#
# CarbonTrail — deploy script (docker compose)
# ============================================
# Idempotent: safe to re-run. It will
#   1. ensure the DuckDB database exists (runs the ETL only if it is missing)
#   2. build the images
#   3. start the stack detached
#   4. wait for the backend /api/health to report ok
#   5. print the URLs
#
# Usage:  ./deploy.sh
#
# Env knobs (all optional — see backend/.env.example):
#   OLLAMA_BASE_URL, LLM_MODEL, AI_DISABLED, NEXT_PUBLIC_API_URL
#
set -euo pipefail

# --- locate ourselves -------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DB_FILE="${CARBONTRAIL_DB_HOST:-backend/data/carbontrail.duckdb}"
HEALTH_URL="http://localhost:8902/api/health"
FRONTEND_URL="http://localhost:3100"
BACKEND_URL="http://localhost:8902"

# --- pick a docker compose command -----------------------------------------
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' is available." >&2
  exit 1
fi
echo "==> Using: ${COMPOSE}"

# --- 1. ensure the DuckDB database exists -----------------------------------
if [ -f "$DB_FILE" ]; then
  echo "==> Database present: ${DB_FILE} ($(du -h "$DB_FILE" | cut -f1))"
else
  echo "==> Database missing — running ETL (backend/etl/ingest.py)..."
  # Prefer an explicit project venv if present, else fall back to system python3.
  if [ -x "backend/.venv/bin/python" ]; then
    PY="backend/.venv/bin/python"
  else
    PY="python3"
  fi
  echo "    using interpreter: ${PY}"
  ( cd backend && CARBONTRAIL_DB="../${DB_FILE}" "$PY" etl/ingest.py )
  echo "==> ETL complete."
fi

# --- 2. build ---------------------------------------------------------------
echo "==> Building images..."
${COMPOSE} build

# --- 3. up ------------------------------------------------------------------
echo "==> Starting stack (detached)..."
${COMPOSE} up -d

# --- 4. wait for backend health --------------------------------------------
echo "==> Waiting for backend health at ${HEALTH_URL} ..."
ATTEMPTS=60   # ~2 minutes (60 x 2s)
for i in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "==> Backend healthy."
    break
  fi
  if [ "$i" -eq "$ATTEMPTS" ]; then
    echo "ERROR: backend did not become healthy in time." >&2
    echo "       Recent backend logs:" >&2
    ${COMPOSE} logs --tail=40 backend >&2 || true
    exit 1
  fi
  sleep 2
done

# --- 5. print URLs ----------------------------------------------------------
echo ""
echo "==========================================================="
echo "  CarbonTrail is up"
echo "  Frontend:  ${FRONTEND_URL}"
echo "  Backend:   ${BACKEND_URL}"
echo "  API docs:  ${BACKEND_URL}/docs"
echo "  Health:    ${HEALTH_URL}"
echo "==========================================================="
