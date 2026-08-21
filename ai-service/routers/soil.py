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

    # Do NOT return fabricated soil values.
    #
    # Replace this section with Gemini multimodal
    # document/image extraction.

    raise HTTPException(
        status_code=501,
        detail=(
            "Soil report vision extraction is not "
            "connected yet. Connect Gemini multimodal "
            "before returning soil measurements."
        ),
    )
