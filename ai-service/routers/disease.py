from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.schemas import DiseaseDiagnosisResponse
from services.gemini_client import analyze_image_with_prompt
import traceback

router = APIRouter()

@router.post("/diagnose", response_model=DiseaseDiagnosisResponse)
async def diagnose_disease(
    image: UploadFile = File(...),
    crop_type: str = Form(...),
    crop_stage: str = Form(...),
    recent_weather: str = Form(...)
):
    """
    Diagnoses a crop disease based on an image and environmental context.
    """
    try:
        contents = await image.read()
        mime_type = image.content_type or "image/jpeg"
        
        prompt = (
            f"You are an expert agronomist. Analyze this image of a {crop_type} crop. "
            f"The crop is currently in the '{crop_stage}' stage. "
            f"Recent weather conditions: {recent_weather}. "
            "Identify any visible diseases, pests, or nutrient deficiencies. "
            "Provide the disease name, a confidence score (0.0 - 1.0), severity (low/medium/high), "
            "and a brief recommended treatment."
        )
        
        result = analyze_image_with_prompt(contents, mime_type, prompt, schema_class=DiseaseDiagnosisResponse)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Disease diagnosis failed: {str(e)}")
