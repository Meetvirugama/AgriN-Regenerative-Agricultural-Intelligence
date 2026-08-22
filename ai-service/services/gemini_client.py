import os
import json
import io
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

import itertools

keys_str = os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", ""))
gemini_keys = [k.strip() for k in keys_str.split(",") if k.strip()]

if not gemini_keys:
    print("WARNING: GEMINI_API_KEYS not set. Gemini API calls will fail.")
    client_cycle = None
else:
    client_cycle = itertools.cycle([genai.Client(api_key=k) for k in gemini_keys])

def _get_client():
    return next(client_cycle) if client_cycle else None

def analyze_image_with_prompt(image_bytes: bytes, mime_type: str, prompt: str, schema_class=None, extra_images: list = None) -> dict:
    """
    Analyzes an image (or multiple images) with a prompt using Gemini.
    extra_images: list of {bytes, mime_type} for additional photos (up to 2 more).
    """
    client = _get_client()
    if not client:
        raise ValueError("GEMINI_API_KEYS is not configured.")

    # We use gemini-3.6-flash as the default multimodal model
    model = 'gemini-3.6-flash'
    
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
    ]

    # Add extra photos (whole plant, close-up) if provided
    if extra_images:
        for img in extra_images:
            try:
                contents.append(
                    types.Part.from_bytes(data=img["bytes"], mime_type=img.get("mime_type", "image/jpeg"))
                )
            except Exception as e:
                print(f"[Gemini] Could not add extra image: {e}")

    contents.append(prompt)

    # If a schema is provided, enforce structured JSON output
    # Avoid response_schema to prevent AFC hang
    config_args = {"temperature": 0.2}

    config = types.GenerateContentConfig(**config_args)
    
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )
    
    if schema_class:
        try:
            text = response.text
            if not text:
                print("[Gemini] Empty response text.")
                raise ValueError("Empty response text")
            import re
            match = re.search(r'\{[\s\S]*\}|\[[\s\S]*\]', text)
            if match:
                return json.loads(match.group(0))
            return json.loads(text)
        except Exception as e:
            print(f"[Gemini] Error parsing response: {e}, returning fallback dict.")
            return {
                "image_quality": "poor",
                "condition_name": "Undetermined",
                "condition_category": "unknown",
                "confidence": 0.0,
                "severity": "unknown",
                "what_is_happening": "Unable to determine.",
                "why_is_it_happening": "AI processing failed.",
                "treatment_recommendation": "Consult an expert.",
                "action_timing": "Immediately",
                "monitor": "Check again later",
                "requires_expert": True,
                "escalation_triggered": True,
                "differential_diagnosis": [{"condition": "Unknown", "probability": 1.0, "rationale": "Fallback"}],
                "evidence": [{"source": "image", "finding": "Image analysis failed.", "supports_primary": True}]
            }
    return {"text": getattr(response, 'text', '')}

def generate_text(prompt: str, schema_class=None) -> dict:
    """
    Generates text from a prompt using Gemini.
    """
    client = _get_client()
    if not client:
        raise ValueError("GEMINI_API_KEYS is not configured.")

    model = "gemini-3.6-flash"
    
    config_args = {"temperature": 0.4}
    
    if schema_class:
        config_args["response_mime_type"] = "application/json"
        
        schema = schema_class.model_json_schema()
        
        # Recursively remove 'additionalProperties' which Gemini's API rejects
        def clean_schema(d):
            if isinstance(d, dict):
                d.pop("additionalProperties", None)
                for v in d.values():
                    clean_schema(v)
            elif isinstance(d, list):
                for v in d:
                    clean_schema(v)
        
        clean_schema(schema)
        config_args["response_schema"] = schema
        
    config = types.GenerateContentConfig(**config_args)

    try:
        response = client.models.generate_content(
            model=model,
            contents=[prompt],
            config=config,
        )
        
        if schema_class:
            return json.loads(response.text)
        return {"text": getattr(response, 'text', '')}
    except Exception as e:
        print(f"[Gemini] Error generating text: {e}")
        raise ValueError(f"Gemini API call failed: {e}")


# =============================================================================
# IMAGE QUALITY GATE  (Section 15 of Task List)
# Exposed here so quality_gate.py can import: from services.gemini_client import assess_image_quality
# =============================================================================

def assess_image_quality(image_bytes: bytes) -> dict:
    """
    Section 15 — Image Quality Gate.

    Assesses blur, brightness, and resolution BEFORE diagnosis.
    Uses Pillow (CPU-only, no GPU needed on M2).

    Returns:
      {
        "pass": true/false,
        "grade": "good" | "fair" | "poor",
        "issues": [...],
        "farmer_guidance": "...",
        "metrics": { blur_score, brightness_mean, width, height }
      }
    """
    try:
        from PIL import Image, ImageFilter
        import numpy as np
    except ImportError:
        # Pillow not available — skip quality check, allow diagnosis to proceed
        return {
            "pass": True,
            "grade": "unknown",
            "issues": ["quality_check_unavailable"],
            "farmer_guidance": "",
            "metrics": {},
        }

    issues = []

    # Load image
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = img.size

    # ── Resolution check ────────────────────────────────────────────────────
    MIN_DIMENSION = 224  # minimum for any CNN model input
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        issues.append("low_resolution")

    # ── Blur check (Laplacian variance) ───────────────────────────────────
    # Convert to grayscale, apply Laplacian, measure variance.
    # Low variance = blurry image.
    gray = img.convert("L")
    gray_arr = np.array(gray, dtype=np.float32)
    laplacian = np.array(gray.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    blur_score = float(laplacian.var())

    BLUR_THRESHOLD = 80.0   # empirical; calibrate with real farmer photos
    if blur_score < BLUR_THRESHOLD:
        issues.append("blurry")

    # ── Brightness check ────────────────────────────────────────────────
    brightness_mean = float(gray_arr.mean())
    if brightness_mean < 40:     # too dark
        issues.append("too_dark")
    elif brightness_mean > 230:  # overexposed
        issues.append("overexposed")

    # ── Grade ─────────────────────────────────────────────────────────────
    if len(issues) == 0:
        grade = "good"
    elif len(issues) == 1 and "low_resolution" not in issues:
        grade = "fair"
    else:
        grade = "poor"

    passed = grade in ("good", "fair")

    # ── Farmer guidance ───────────────────────────────────────────────
    guidance_parts = []
    if "blurry" in issues:
        guidance_parts.append("Hold your phone steady and tap the leaf to focus.")
    if "too_dark" in issues:
        guidance_parts.append("Move to natural daylight. Avoid shadows.")
    if "overexposed" in issues:
        guidance_parts.append("Avoid direct sunlight glare. Step into shade.")
    if "low_resolution" in issues:
        guidance_parts.append("Move closer to the leaf. Fill the frame.")

    farmer_guidance = " ".join(guidance_parts) if guidance_parts else ""

    if not passed:
        farmer_guidance = (
            "I can't reliably analyse this image. Please take:\n"
            "\u2022 a closer photo of the affected leaf\n"
            "\u2022 a clear whole-plant photo\n"
            "\u2022 a photo in good natural light\n"
            "\u2022 an underside photo if symptoms are there\n"
            + farmer_guidance
        )

    return {
        "pass": passed,
        "grade": grade,
        "issues": issues,
        "farmer_guidance": farmer_guidance,
        "metrics": {
            "blur_score": round(blur_score, 2),
            "brightness_mean": round(brightness_mean, 2),
            "width": width,
            "height": height,
        },
    }
