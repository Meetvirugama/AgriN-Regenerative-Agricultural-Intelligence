"""
DiagnosisService - Layer 07: Context Fusion Engine (Python)

Architecture:
  Image bytes -> Local PyTorch Vision Model -> Top-K Visual Conditions
  Top-K Visual Conditions + Field Context -> Gemini 2.5 Flash -> AI Reasoning

RULES:
  - Never invent context. UNAVAILABLE if data is missing.
  - Unknown is a valid diagnosis when confidence < confidence_threshold.
  - Every evidence item must cite a real source.
  - Image quality must be assessed first.
"""

import json
from typing import Optional, List
from models.schemas import FullDiagnosisResponse
from models.crop_registry import crop_registry
from services.gemini_client import analyze_image_with_prompt
from services.vision_inference import vision_predictor


def _get_known_classes(crop_type: str) -> list:
    crop_key = crop_type.lower().split()[0]
    return crop_registry.get_classes(crop_key)


def _build_reasoning_prompt(
    vision_results: dict,
    crop_type: str,
    crop_stage: str,
    days_since_sowing=None,
    irrigation_type=None,
    weather=None,
    satellite=None,
    soil=None,
    farmer_observations=None,
) -> str:
    """Build the context-enriched reasoning prompt for Gemini."""
    known_classes = _get_known_classes(crop_type)
    class_list = "\n  - ".join(known_classes)

    # Vision block (from local PyTorch model)
    vision_block = f"""VISION MODEL PREDICTIONS:
  Primary Condition: {vision_results.get('condition', 'Unknown')}
  Raw Confidence: {vision_results.get('confidence', 0.0):.3f}
  Top-K Differential:"""
    for item in vision_results.get('top_k', []):
        vision_block += f"\n    - {item['condition']} ({item['probability']:.3f})"

    # Crop block
    crop_block = f"""CROP CONTEXT:
  Type: {crop_type}
  Growth stage: {crop_stage}
  Days since sowing: {days_since_sowing if days_since_sowing else 'UNAVAILABLE'}
  Irrigation: {irrigation_type if irrigation_type else 'UNAVAILABLE'}"""

    # Weather block
    if weather:
        weather_block = f"""WEATHER (Open-Meteo, current):
  Max temp: {weather.get('temp_max', '?')}C  Min temp: {weather.get('temp_min', '?')}C
  Humidity: {weather.get('humidity_pct', '?')}%
  Recent rainfall: {weather.get('rainfall_mm', '?')}mm
  Source: {weather.get('source', 'open-meteo')}"""
    else:
        weather_block = "WEATHER: UNAVAILABLE"

    # Satellite block
    if satellite:
        if satellite.get('cloud_obstructed'):
            sat_block = f"SATELLITE: UNAVAILABLE (cloud-obstructed, last clear: {satellite.get('observation_date', 'unknown')})"
        else:
            ndvi = satellite.get('ndvi_mean')
            ndvi_str = f"{ndvi:.3f}" if ndvi is not None else "?"
            sat_block = f"""SATELLITE (Sentinel-2, {satellite.get('observation_date', '?')}):
  NDVI mean: {ndvi_str}
  NDVI trend: {satellite.get('ndvi_trend', 'unknown')}
  Data quality: {satellite.get('data_quality', '?')}"""
    else:
        sat_block = "SATELLITE: UNAVAILABLE"

    # Soil block
    if soil:
        soil_block = f"""SOIL (source: {soil.get('source', '?')}):
  Texture: {soil.get('texture', '?')}
  pH: {soil.get('ph', '?')}
  Organic matter: {soil.get('organic_matter_pct', '?')}%
  Nitrogen: {soil.get('nitrogen_level', '?')}"""
    else:
        soil_block = "SOIL: UNAVAILABLE"

    # Farmer observations block (Feature 24 — 5 contextual questions)
    if farmer_observations and isinstance(farmer_observations, dict):
        obs_lines = []
        q_map = {
            "noticed_when": "When did you first notice this?",
            "is_spreading": "Is the problem spreading?",
            "recent_rain": "Has it rained recently?",
            "recent_spray": "Did you apply fertilizer or pesticide recently?",
            "affected_area": "Is this affecting one area or the whole field?",
        }
        for key, question in q_map.items():
            answer = farmer_observations.get(key)
            if answer:
                obs_lines.append(f"  Q: {question}")
                obs_lines.append(f"  A: {answer}")
        if obs_lines:
            farmer_block = "FARMER OBSERVATIONS (direct report):\n" + "\n".join(obs_lines)
        else:
            farmer_block = "FARMER OBSERVATIONS: None provided"
    else:
        farmer_block = "FARMER OBSERVATIONS: None provided"

    return f"""You are AgriMesh AI Reasoning Engine (Layer 07).

You receive a crop photograph (and possibly additional photos), the output of our local PyTorch Vision Model, and real environmental field context.
If multiple photos are provided: Photo 1 is the primary affected area, Photo 2 is the whole plant, Photo 3 is a close-up detail.
Your task is DIFFERENTIAL DIAGNOSIS and REASONING - merge ALL visual findings with the context to create actionable advice.

---
{vision_block}

{crop_block}

{weather_block}

{sat_block}

{soil_block}

{farmer_block}
---

STRICT RULES:
1. Assess the PyTorch vision predictions against the context. If vision predicts a fungal disease but weather is extremely dry, lower the confidence or shift the primary diagnosis to the next likely differential.
2. Provide EXACTLY 3 differential candidates ranked by probability (must sum to ~1.0).
3. If fused confidence < 0.55 -> condition_category = "unknown", requires_expert = true.
4. CONTEXT FUSION:
   - Humidity >80% + recent rainfall -> supports fungal disease
   - Declining NDVI + visual stress -> supports water/heat stress
   - Low soil pH -> supports nutrient deficiency
   - Temperature >38C -> supports heat stress
   - Farmer says "spreading rapidly" -> increases severity
   - Farmer says "applied pesticide recently" -> consider phytotoxicity
5. EVIDENCE: cite at least one finding per available data source.
6. Never invent weather, NDVI, or soil numbers.
7. severity: critical/high/medium/low/none/unknown
8. ANSWER THE 6 FARMER QUESTIONS EXACTLY:
   - what_is_happening: Brief description of the suspected issue.
   - why_is_it_happening: Explanation combining visual symptoms with field context.
   - treatment_recommendation: What should the farmer do to fix this?
   - action_timing: When should they act? (e.g. "Within 24 hours", "Next watering cycle").
   - monitor: What signs should they watch for in the future?
9. escalation_triggered = true if severity is critical OR requires_expert is true.
10. Use simple language a farmer can understand.

Respond ONLY with valid JSON in EXACTLY this format (no markdown code blocks, no other text):
{{
  "condition_name": "Specific condition name",
  "condition_category": "disease | pest | nutrient_deficiency | water_stress | heat_stress | healthy | unknown",
  "fused_confidence": 0.0-1.0,
  "severity": "critical | high | medium | low | none | unknown",
  "requires_expert": true | false,
  "escalation_triggered": true | false,
  "primary_condition": "String describing primary condition",
  "what_is_happening": "Brief description",
  "why_is_it_happening": "Explanation",
  "treatment_recommendation": "What should the farmer do",
  "action_timing": "When should they act",
  "monitor": "What signs to watch for",
  "differentials": [
    {{ "condition": "name", "probability": 0.0-1.0 }}
  ],
  "evidence": [
    {{ "source": "image | weather | satellite | soil | crop_stage | field_history", "finding": "finding text" }}
  ]
}}"""


def diagnose(
    image_bytes: bytes,
    mime_type: str,
    crop_type: str,
    crop_stage: str,
    days_since_sowing=None,
    irrigation_type=None,
    weather=None,
    satellite=None,
    soil=None,
    farmer_observations=None,
    extra_images=None,
):
    """
    Full Layer 07 diagnosis:
      Image -> Local PyTorch Model -> AI Reasoning Engine (Gemini) -> FullDiagnosisResponse
    """
    
    # 1. Run local PyTorch Vision Inference (or Gemini fallback)
    try:
        vision_results = vision_predictor.predict(image_bytes, crop_type=crop_type)
    except Exception as e:
        print(f"[Diagnosis] Vision model failed or not trained yet. Falling back to pure Gemini vision: {e}")
        vision_results = {
            "condition": "Unknown",
            "confidence": 0.0,
            "top_k": []
        }

    # 2. Build reasoning prompt combining vision results + field context + farmer observations
    prompt = _build_reasoning_prompt(
        vision_results=vision_results,
        crop_type=crop_type,
        crop_stage=crop_stage,
        days_since_sowing=days_since_sowing,
        irrigation_type=irrigation_type,
        weather=weather,
        satellite=satellite,
        soil=soil,
        farmer_observations=farmer_observations,
    )

    # 3. Call Gemini for Context Fusion and Reasoning
    # We still pass the image(s) to Gemini so it can visually verify the PyTorch model's prediction!
    result = analyze_image_with_prompt(
        image_bytes=image_bytes,
        mime_type=mime_type,
        prompt=prompt,
        schema_class=FullDiagnosisResponse,
        extra_images=extra_images,
    )

    return result
