import os
import json
import io
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
# It will automatically pick up GEMINI_API_KEY from environment variables
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY not set. Gemini API calls will fail.")
    client = None
else:
    client = genai.Client(api_key=api_key)

def analyze_image_with_prompt(image_bytes: bytes, mime_type: str, prompt: str, schema_class=None, extra_images: list = None) -> dict:
    """
    Analyzes an image (or multiple images) with a prompt using Gemini.
    extra_images: list of {bytes, mime_type} for additional photos (up to 2 more).
    """
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured.")

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

import httpx
import itertools

groq_keys_str = os.environ.get("GROQ_API_KEYS", "")
groq_keys = [k.strip() for k in groq_keys_str.split(",") if k.strip()]
groq_key_cycle = itertools.cycle(groq_keys) if groq_keys else None

def generate_text(prompt: str, schema_class=None) -> dict:
    """
    Generates text from a prompt using Groq (to avoid Gemini rate limits).
    Uses a round-robin rotation of provided API keys.
    """
    if not groq_keys:
        raise ValueError("GROQ_API_KEYS is not configured in .env.")

    current_key = next(groq_key_cycle)
    
    # We use qwen/qwen3.6-27b for JSON generation
    model = "qwen/qwen3.6-27b"
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 4096
    }
    
    if schema_class:
        # Groq supports JSON mode
        payload["response_format"] = {"type": "json_object"}
        schema_str = json.dumps(schema_class.model_json_schema())
        payload["messages"].append({
            "role": "user", 
            "content": f"You must respond in valid JSON format matching this schema: {schema_str}"
        })

    max_retries = len(groq_keys)
    
    for attempt in range(max_retries):
        current_key = next(groq_key_cycle)
        headers = {
            "Authorization": f"Bearer {current_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            result_json = response.json()
            
            content = result_json["choices"][0]["message"]["content"]
            
            if schema_class:
                return json.loads(content)
            return {"text": content}
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print(f"[Groq] Key rate limited (429). Trying next key... (Attempt {attempt+1}/{max_retries})")
                continue # Try the next key
            else:
                print(f"[Groq] HTTP Error: {e.response.status_code} - {e.response.text}")
                raise ValueError(f"Groq API call failed: {e}")
                
        except Exception as e:
            print(f"[Groq] Error generating text: {e}")
            raise ValueError(f"Groq API call failed: {e}")
            
    raise ValueError("All Groq API keys are currently rate limited (429). Please try again later.")


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
