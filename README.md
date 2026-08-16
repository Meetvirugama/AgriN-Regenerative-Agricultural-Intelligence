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

To spin up the entire stack locally:

```bash
# 1. Start the Database & AI Engine
cd ai-service
pip install -r requirements.txt
fastapi dev main.py --port 8001

# 2. Start the Backend API
cd ../server
npm install
npm run dev

# 3. Start the Frontend App
cd ../client
npm install
npm run dev
```
