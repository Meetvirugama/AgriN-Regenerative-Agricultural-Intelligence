from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import CropIdentificationResponse
from services.gemini_client import analyze_image_with_prompt
import traceback

router = APIRouter()

@router.post("/identify", response_model=CropIdentificationResponse)
async def identify_crop(image: UploadFile = File(...)):
    """
    Identifies the crop type from an image using Gemini Vision.
    """
    try:
        contents = await image.read()
        mime_type = image.content_type or "image/jpeg"
        
        prompt = (
            "Analyze this image of a farm field or plant. Identify the primary crop type. "
            "If possible, also identify the specific variety. "
            "Provide a confidence score between 0.0 and 1.0."
        )
        
        result = analyze_image_with_prompt(contents, mime_type, prompt, schema_class=CropIdentificationResponse)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Crop identification failed: {str(e)}")
