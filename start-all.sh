#!/bin/bash
echo "🌱 Starting AgriMesh Multi-Tier Architecture..."

# Kill background processes on script exit
trap 'kill 0' SIGINT SIGTERM EXIT

echo "🐍 Starting Python AI Service (Port 8001)..."
cd ai-service
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn routers.weather_rules:app --port 8001 --reload 2>/dev/null || uvicorn main:app --port 8001 --reload &
cd ..

echo "🟢 Starting Node.js API Gateway (Port 8000)..."
cd server
npm run dev &
cd ..

echo "⚛️  Starting React Client (Port 5173)..."
cd client
npm run dev &
cd ..

echo "=================================================="
echo "✅ All services are booting up!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Node API: http://localhost:8000"
echo "📍 Python AI: http://localhost:8001"
echo "=================================================="
echo "Press Ctrl+C to stop all services."

# Wait for all background jobs to finish
wait
