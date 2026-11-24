#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Starting Better Urban (local mode)..."

# Backend
cd "$ROOT/backend"
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd "$ROOT"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000  (docs: http://localhost:8000/docs)"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait