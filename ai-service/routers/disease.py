from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from models.schemas import FullDiagnosisResponse, KNOWN_CONDITIONS
from models.crop_registry import crop_registry
from services.diagnosis_service import diagnose
from services.gemini_client import assess_image_quality
import traceback
import json

router = APIRouter()


@router.post("/diagnose", response_model=FullDiagnosisResponse)
async def diagnose_disease(
    image: UploadFile = File(...),
    image2: Optional[UploadFile] = File(default=None),
    image3: Optional[UploadFile] = File(default=None),
    crop_type: str = Form(default="unknown"),
    crop_stage: str = Form(default="unknown"),
    days_since_sowing: Optional[int] = Form(default=None),
    irrigation_type: Optional[str] = Form(default=None),
    # JSON strings for environmental context from Node.js
    weather_json: Optional[str] = Form(default=None),
    satellite_json: Optional[str] = Form(default=None),
    soil_json: Optional[str] = Form(default=None),
    # Farmer observations Q&A from pre-diagnosis questions (Feature 24)
    farmer_observations_json: Optional[str] = Form(default=None),
):
    """
    Layer 07 — Crop Health Diagnosis Engine.

    Accepts a crop photo (+ up to 2 extra photos) + real field context + farmer Q&A.
    Returns structured differential diagnosis with evidence trail.

    Called by Node.js disease.service.js after assembling field context.
    """
    try:
        image_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"

        # ── Section 0.2: Crop support gate ────────────────────────────────────
        # Do NOT run a tomato-only model on wheat or rice.
        # Unsupported crops return a clear structured response.
        crop_key = crop_type.lower().split()[0]
        if not crop_registry.is_supported(crop_key):
            supported = crop_registry.list_supported_crops()
            return FullDiagnosisResponse(
                image_quality="unknown",
                condition_name="Unsupported Crop",
                condition_category="unknown",
                confidence=0.0,
                severity="unknown",
                what_is_happening=f"Crop '{crop_type}' is not yet supported.",
                why_is_it_happening=f"AgriMesh currently only supports: {', '.join(supported)}.",
                treatment_recommendation="No action can be recommended.",
                action_timing="N/A",
                monitor="Check back as more crops are added.",
                requires_expert=True,
                escalation_triggered=False,
                differential_diagnosis=[],
                evidence=[{
                    "source": "system",
                    "finding": f"crop_type '{crop_key}' has no active model in CropModelRegistry.",
                    "supports_primary": False,
                }],
            )

        # ── Section 15: Image Quality Gate ────────────────────────────────────
        # Check quality BEFORE running expensive Gemini Vision call.
        quality = assess_image_quality(image_bytes)
        if not quality["pass"]:
            # Return a structured "poor quality" response — do NOT run diagnosis
            return FullDiagnosisResponse(
                image_quality="poor",
                condition_name="Insufficient Image Quality",
                condition_category="unknown",
                confidence=0.0,
                severity="unknown",
                what_is_happening="The provided image is too poor quality to diagnose.",
                why_is_it_happening=f"Issues detected: {', '.join(quality.get('issues', []))}",
                treatment_recommendation=quality.get("farmer_guidance", "Please retake the photo."),
                action_timing="Immediately",
                monitor="Retake photo and resubmit.",
                requires_expert=True,
                escalation_triggered=False,
                differential_diagnosis=[],
                evidence=[{
                    "source": "image",
                    "finding": f"Image quality gate failed: {', '.join(quality.get('issues', []))}",
                    "supports_primary": False,
                }],
            )

        # Parse optional JSON context blobs
        weather = json.loads(weather_json) if weather_json else None
        satellite = json.loads(satellite_json) if satellite_json else None
        soil = json.loads(soil_json) if soil_json else None
        farmer_observations = json.loads(farmer_observations_json) if farmer_observations_json else None

        # Extra images (whole plant, close-up)
        extra_images = []
        if image2:
            try:
                b2 = await image2.read()
                if b2:
                    extra_images.append({"bytes": b2, "mime_type": image2.content_type or "image/jpeg"})
            except Exception:
                pass
        if image3:
            try:
                b3 = await image3.read()
                if b3:
                    extra_images.append({"bytes": b3, "mime_type": image3.content_type or "image/jpeg"})
            except Exception:
                pass

        result = diagnose(
            image_bytes=image_bytes,
            mime_type=mime_type,
            crop_type=crop_type,
            crop_stage=crop_stage,
            days_since_sowing=days_since_sowing,
            irrigation_type=irrigation_type,
            weather=weather,
            satellite=satellite,
            soil=soil,
            farmer_observations=farmer_observations,
            extra_images=extra_images if extra_images else None,
        )

        # ── Section 23: Confidence calibration — degrade if image is fair ────
        # If quality is 'fair', cap confidence at 0.75 (not calibrated yet, but
        # prevents overconfident output on borderline images).
        if isinstance(result, dict) and quality["grade"] == "fair":
            if result.get("confidence", 1.0) > 0.75:
                result["confidence"] = 0.75

        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")



@router.get("/classes/{crop_type}")
async def get_known_classes(crop_type: str):
    """
    Returns the known disease/condition class list for a crop type.
    Used by the frontend to show what conditions are detectable.
    """
    from models.schemas import KNOWN_CONDITIONS
    crop_key = crop_type.lower().split()[0]
    classes = KNOWN_CONDITIONS.get(crop_key, KNOWN_CONDITIONS["default"])
    return {"crop_type": crop_type, "classes": classes, "count": len(classes)}


@router.get("/dataset-classes")
async def get_dataset_classes():
    """
    Scans the local dataset ZIPs and returns all discovered class names.
    This is the ground truth of what conditions the model can recognise.
    Returns classes from: PlantVillage (data.zip) + PlantDoc (PlantDoc-Dataset-master.zip)
    """
    from models.schemas import (
        _discover_classes_from_zip,
        _PLANTVILLAGE_ZIP,
        _PLANTDOC_ZIP,
        _PLANTSEG_ZIP,
    )

    results = {}

    pv_classes = _discover_classes_from_zip(_PLANTVILLAGE_ZIP)
    results["plantvillage"] = {
        "file": "data.zip",
        "available": len(pv_classes) > 0,
        "class_count": len(pv_classes),
        "classes": pv_classes,
    }

    pd_classes = _discover_classes_from_zip(_PLANTDOC_ZIP)
    results["plantdoc"] = {
        "file": "PlantDoc-Dataset-master.zip",
        "available": len(pd_classes) > 0,
        "class_count": len(pd_classes),
        "classes": pd_classes,
    }

    ps_classes = _discover_classes_from_zip(_PLANTSEG_ZIP)
    results["plantseg"] = {
        "file": "PlantSeg-main.zip",
        "available": len(ps_classes) > 0,
        "class_count": len(ps_classes),
        "classes": ps_classes,
    }

    all_classes = sorted(set(pv_classes + pd_classes))
    results["combined_unique"] = {
        "count": len(all_classes),
        "classes": all_classes,
    }

    return results


@router.post("/quality-check")
async def quality_check(image: UploadFile = File(...)):
    """
    Section 15 — Image Quality Gate.
    Runs before diagnosis. Returns pass/fail + reasons.

    Checks:
      - blur (Laplacian variance)
      - brightness (too dark / overexposed)
      - resolution (too small)
      - basic content check
    """
    try:
        image_bytes = await image.read()
        result = assess_image_quality(image_bytes)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Quality check failed: {str(e)}")


@router.get("/models")
async def list_models():
    """
    Returns all registered active models and their status.
    PyTorch models report real accuracy from training metadata.
    """
    from services.vision_inference import vision_predictor
    return {
        "models": vision_predictor.model_info(),
        "pytorch_crops": vision_predictor.list_supported_crops(),
        "gemini_fallback_crops": [
            crop for crop in KNOWN_CONDITIONS.keys()
            if crop not in vision_predictor.list_supported_crops() and crop != "default"
        ],
    }
