from fastapi import APIRouter, HTTPException
from models.schemas import AdvisoryRequest, AdvisoryResponse
from services.gemini_client import generate_text
import traceback

router = APIRouter()

@router.post("/generate", response_model=AdvisoryResponse)
async def generate_advisory(request: AdvisoryRequest):
    """
    Generates a structured, localized agronomic advisory.
    """
    try:
        prompt = f"""
        You are an expert regenerative agriculture advisor. Create a structured advisory for a farmer.
        
        Field Context:
        - Crop: {request.crop_type}
        - Current Stage: {request.crop_stage}
        - Health Summary: {request.health_score_summary}
        - Weather Summary: {request.weather_summary}
        - Soil Summary: {request.soil_summary}
        
        Guidelines:
        1. Keep the advice highly actionable and localized.
        2. Emphasize regenerative practices where applicable.
        3. Respond in the following language code: {request.farmer_language}. If it's not English, translate your advice naturally.
        4. Provide brief, concise answers for each of the required fields.
        """
        
        result = generate_text(prompt, schema_class=AdvisoryResponse)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Advisory generation failed: {str(e)}")
