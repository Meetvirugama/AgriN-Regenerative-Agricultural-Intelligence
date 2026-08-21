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

    import os
    from google import genai
    from pydantic import ValidationError

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured.",
        )

    try:
        client = genai.Client(api_key=gemini_key)
        
        # We need to read the file content
        file_content = await image.read()
        
        # Upload the file to Gemini (or send it inline)
        # Using inline for simplicity since it's < 10MB
        prompt = (
            "You are an agricultural data extraction AI. "
            "Extract the soil properties from this laboratory report. "
            "If a value is not present, return null. "
            "For levels (nitrogen, phosphorus, potassium), map to 'low', 'medium', or 'high'. "
            "For texture, map to 'sandy', 'loam', 'clay', 'sandy_loam', 'clay_loam', or 'silt_loam'. "
            "For water_holding_capacity, map to 'low', 'medium', or 'high'."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                genai.types.Part.from_bytes(
                    data=file_content,
                    mime_type=image.content_type,
                )
            ],
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SoilVisionResponse,
                temperature=0.0,
            ),
        )
        
        if not response.text:
            raise ValueError("Empty response from Gemini")
            
        return SoilVisionResponse.model_validate_json(response.text)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse Gemini response into schema: {e}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Soil report vision extraction failed: {exc}",
        )
