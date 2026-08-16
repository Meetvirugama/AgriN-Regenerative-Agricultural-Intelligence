from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import crop, disease, advisory, climate
import os

app = FastAPI(
    title="AgriMesh AI Service",
    description="Python/FastAPI microservice for AgriMesh AI inference using Google Gemini.",
    version="1.0.0"
)

# CORS - Allow requests from the Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Node.js backend IP/URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "gemini_configured": bool(os.environ.get("GEMINI_API_KEY"))}

# Include Routers
app.include_router(crop.router, prefix="/api/v1/crop", tags=["Crop"])
app.include_router(disease.router, prefix="/api/v1/disease", tags=["Disease"])
app.include_router(advisory.router, prefix="/api/v1/advisory", tags=["Advisory"])
app.include_router(climate.router, prefix="/api/v1/climate", tags=["Climate"])

if __name__ == "__main__":
    import uvicorn
    # When running directly, start on port 8001 so it doesn't conflict with Node.js on 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
