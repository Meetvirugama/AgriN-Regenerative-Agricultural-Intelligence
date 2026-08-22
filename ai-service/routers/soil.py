from fastapi import (
    APIRouter,
    HTTPException,
    File,
    UploadFile,
)

from models.schemas import SoilVisionResponse


router = APIRouter(
    prefix="/soil",
    tags=["Layer 04 - Soil"],
)


@router.post(
    "/parse-soil-report",
    response_model=SoilVisionResponse,
)
async def parse_soil_report(
    image: UploadFile = File(...),
):

    if not image.content_type:
        raise HTTPException(
            status_code=400,
            detail="File content type is missing.",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
    }

    if image.content_type not in allowed_types:

        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported file type. "
                "Use JPEG, PNG, WebP, or PDF."
            ),
        )

    from services.gemini_client import analyze_image_with_prompt
    
    try:
        # We need to read the file content
        file_content = await image.read()
        
        prompt = (
            "You are an agricultural data extraction AI. "
            "Extract the soil properties from this laboratory report. "
            "If a value is not present, return null. "
            "For levels (nitrogen, phosphorus, potassium), map to 'low', 'medium', or 'high'. "
            "For texture, map to 'sandy', 'loam', 'clay', 'sandy_loam', 'clay_loam', or 'silt_loam'. "
            "For water_holding_capacity, map to 'low', 'medium', or 'high'."
        )
        
        return analyze_image_with_prompt(
            file_content, 
            image.content_type, 
            prompt, 
            schema_class=SoilVisionResponse
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse Gemini response into schema: {e}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Soil report vision extraction failed: {exc}",
        )
