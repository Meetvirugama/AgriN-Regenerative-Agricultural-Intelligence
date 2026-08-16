from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini_client import generate_text
import traceback

router = APIRouter()

class ClimateRiskRequest(BaseModel):
    region: str
    weather_history: str
    weather_forecast: str
    crop_type: str

class ClimateRiskResponse(BaseModel):
    risk_level: str
    primary_risks: list[str]
    mitigation_strategies: list[str]

@router.post("/risk", response_model=ClimateRiskResponse)
async def assess_climate_risk(request: ClimateRiskRequest):
    """
    Assesses climate risk for a specific region and crop based on weather data.
    """
    try:
        prompt = f"""
        You are a climate risk analyst for agriculture. Assess the risk for {request.crop_type} in {request.region}.
        
        Recent Weather: {request.weather_history}
        Forecast: {request.weather_forecast}
        
        Provide:
        1. A risk_level (low/medium/high/critical).
        2. A list of primary_risks (e.g., drought, frost, heat stress).
        3. A list of mitigation_strategies for the farmer.
        """
        
        result = generate_text(prompt, schema_class=ClimateRiskResponse)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Climate risk assessment failed: {str(e)}")
