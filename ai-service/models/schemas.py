from pydantic import BaseModel, Field
from typing import List, Optional

class CropIdentificationResponse(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    confidence_score: float

class DiseaseDiagnosisRequest(BaseModel):
    crop_type: str
    crop_stage: str
    recent_weather: str

class DiseaseDiagnosisResponse(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    treatment_recommendation: str

class AdvisoryRequest(BaseModel):
    field_id: str
    crop_type: str
    crop_stage: str
    health_score_summary: str
    weather_summary: str
    soil_summary: str
    farmer_language: str = "en"

class AdvisoryResponse(BaseModel):
    crop_health_status: str
    irrigation_advice: str
    pest_disease_risks: str
    nutrient_management: str
    weather_impact: str
    regenerative_practice: str
