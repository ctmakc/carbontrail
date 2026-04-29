#!/bin/bash
# CarbonTrail — Follow the Green Money
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "🌍 CarbonTrail — Starting..."

# Check DuckDB exists
if [ ! -f "backend/data/carbontrail.duckdb" ]; then
  echo "⚠️  Database not found. Running ETL..."
  source /data/projects/vigil/.venv/bin/activate
  python3 backend/etl/ingest.py
fi

# Start backend
echo "→ Backend (FastAPI + DuckDB) on :8902..."
source /data/projects/vigil/.venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8902 &
BACKEND_PID=$!
cd "$PROJECT_DIR"

sleep 2

# Start frontend
echo "→ Frontend (Next.js) on :3100..."
cd frontend
PORT=3100 npm run dev &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🌍 CarbonTrail is running!"
echo "  Frontend:  http://localhost:3100"
echo "  Backend:   http://localhost:8902"
echo "  API Docs:  http://localhost:8902/docs"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
