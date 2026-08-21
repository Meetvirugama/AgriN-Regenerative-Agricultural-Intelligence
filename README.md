# AgriN & Regenerative Agricultural Intelligence

Welcome to **AgriMesh**, a 3-tier AI-powered agricultural intelligence platform designed to provide precision farming insights, satellite analysis, and generative agronomy.

## System Architecture

AgriMesh uses a clean separation of concerns across three microservices:

1. **Frontend (`client/`)**
   - React 19 + Vite (JavaScript)
   - Real-time dashboards, maps, and camera capture.
   - Run with: `cd client && npm run dev`

2. **Backend Gateway (`server/`)**
   - Node.js + Express (JavaScript)
   - Pure stateless API gateway, database orchestration (PostgreSQL), JWT auth, and cron jobs.
   - Run with: `cd server && npm run dev`

3. **AI Compute Engine (`ai-service/`)**
   - Python + FastAPI
   - Heavy data processing, Computer Vision (Gemini), predictive ML modeling, and geospatial arrays.
   - Run with: `cd ai-service && fastapi dev main.py --port 8001`

*(Note: The AI service is designed as the intended final state for all heavy ML/AI work, not a temporary leftover. Do not duplicate Python logic into Node.)*

## Getting Started

### 0. Configure environment variables

Each service reads its config from a local `.env` file. Copy the provided examples and fill in your keys:

```bash
cp server/.env.example server/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

At minimum you'll want a `GEMINI_API_KEY` (both `server/.env` and `ai-service/.env`) and a `JWT_SECRET` in `server/.env`.

### 1. Start the database (PostgreSQL + PostGIS)

```bash
docker compose up -d db
cd server
npm install
npm run db:migrate   # applies all migrations, including the PostGIS extension
npm run db:seed      # optional: adds a stub farmer + demo fields
```

If you don't use Docker, point `DATABASE_URL` in `server/.env` at your own PostgreSQL instance (PostGIS extension required).

### 2. Start all three services

The easiest way is the bundled script, which brings up the database, waits for it to be healthy, runs migrations, and then starts all three services together:

```bash
./start-all.sh
```

Or start each service manually in separate terminals:

```bash
# AI Compute Engine (Python/FastAPI) — port 8001
cd ai-service
pip install -r requirements.txt
fastapi dev main.py --port 8001

# Backend Gateway (Node/Express) — port 8000
cd server
npm install
npm run dev

# Frontend (React/Vite) — port 5173
cd client
npm install
npm run dev
```

Once running: frontend on `http://localhost:5173`, API gateway on `http://localhost:8000`, AI service on `http://localhost:8001`. The gateway talks to the AI service via `PYTHON_SERVICE_URL` (`server/.env`) and to Postgres via `DATABASE_URL`; the frontend talks to the gateway via `VITE_API_URL` (`client/.env`).
