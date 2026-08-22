from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from routers.advisory import router as advisory_router
from routers.phenology import router as phenology_router
from routers.weather_rules import router as weather_router
from routers.climate_risk import router as climate_router
from routers.soil import router as soil_router
from routers.satellite import router as satellite_router
from routers.regenerative import router as regenerative_router
from routers.cross_border import router as cross_border_router

# Import existing unrefactored routers to ensure they don't break
from routers import crop, disease, voice

app = FastAPI(
    title="AgriMesh Intelligence API",
    version="1.0.0",
    description=(
        "Field-specific agricultural intelligence "
        "and decision-support API."
    ),
)

# Preserve CORS middleware for the Node.js frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "name": "AgriMesh Intelligence API",
        "status": "running",
        "version": "1.0.0",
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEYS") or os.environ.get("GEMINI_API_KEY"))
    }

# Inject the /api/v1 prefix so that the Node.js backend client logic remains functional.
# Since your new routers already declare their specific prefix (e.g., prefix="/advisory"),
# they will elegantly map to /api/v1/advisory when nested here.
app.include_router(advisory_router, prefix="/api/v1")
app.include_router(phenology_router, prefix="/api/v1")
app.include_router(weather_router, prefix="/api/v1")
app.include_router(climate_router, prefix="/api/v1")
app.include_router(soil_router, prefix="/api/v1")
app.include_router(satellite_router, prefix="/api/v1")
app.include_router(regenerative_router, prefix="/api/v1")
app.include_router(cross_border_router, prefix="/api/v1")

# Legacy routes
app.include_router(crop.router, prefix="/api/v1/crop", tags=["Layer 01 - Crop Diagnosis"])
app.include_router(disease.router, prefix="/api/v1/disease", tags=["Layer 07 - Disease Diagnosis"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Layer 12 - Voice/Audio"])

if __name__ == "__main__":
    import uvicorn
    # Required for start-all.sh to boot properly on the expected port
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
