#!/bin/bash
set -e
echo "🌱 Starting AgriMesh Multi-Tier Architecture..."

# Kill background processes on script exit
trap 'kill 0' SIGINT SIGTERM EXIT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ── 0. Env file sanity check ─────────────────────────────────────────────────
for svc in server ai-service client; do
  if [ ! -f "$svc/.env" ]; then
    echo "⚠️  $svc/.env not found — copying from $svc/.env.example"
    cp "$svc/.env.example" "$svc/.env"
  fi
done

# ── 1. Database (Postgres + PostGIS via Docker) ─────────────────────────────
echo "🐘 Starting PostgreSQL/PostGIS (Docker)..."
if command -v docker &> /dev/null; then
  docker compose up -d db

  echo "⏳ Waiting for database to be healthy..."
  until [ "$(docker inspect -f '{{.State.Health.Status}}' agrimesh-db 2>/dev/null)" = "healthy" ]; do
    sleep 1
  done
  echo "✅ Database is healthy."

  echo "🛠  Running migrations..."
  (cd server && npm run db:migrate)
else
  echo "⚠️  Docker not found — assuming DATABASE_URL in server/.env points to an already-running Postgres/PostGIS instance."
fi

# ── 2. Python AI Service (Port 8001) ────────────────────────────────────────
echo "🐍 Starting Python AI Service (Port 8001)..."
(
  cd ai-service
  if [ -d "venv" ]; then
    source venv/bin/activate
  fi
  uvicorn main:app --port 8001 --reload
) &

# ── 3. Node.js API Gateway (Port 8000) ──────────────────────────────────────
echo "🟢 Starting Node.js API Gateway (Port 8000)..."
(cd server && npm run dev) &

# ── 4. React Client (Port 5173) ─────────────────────────────────────────────
echo "⚛️  Starting React Client (Port 5173)..."
(cd client && npm run dev) &

echo "=================================================="
echo "✅ All services are booting up!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Node API: http://localhost:8000"
echo "📍 Python AI: http://localhost:8001"
echo "📍 Postgres: localhost:5432 (db: agrimesh)"
echo "=================================================="
echo "Press Ctrl+C to stop all services."

# Wait for all background jobs to finish
wait
