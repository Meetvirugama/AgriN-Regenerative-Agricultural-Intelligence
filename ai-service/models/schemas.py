from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import os
import zipfile
import json

# ── Dataset paths (your local dataset folder) ────────────────────────────────
_DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "dataset")
_PLANTVILLAGE_ZIP = os.path.join(_DATASET_DIR, "data.zip")          # ~2.2GB PlantVillage
_PLANTDOC_ZIP     = os.path.join(_DATASET_DIR, "PlantDoc-Dataset-master.zip")  # ~984MB PlantDoc
_PLANTSEG_ZIP     = os.path.join(_DATASET_DIR, "PlantSeg-main.zip")  # ~50MB segmentation

def _discover_classes_from_zip(zip_path: str) -> list[str]:
    """
    Scan zip file to discover class folder names (PlantVillage/PlantDoc structure).
    Returns unique top-level directory names (these = class labels).
    """
    classes = set()
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            for name in z.namelist():
                parts = name.split("/")
                # PlantVillage: train/Tomato__Early_blight/img.jpg → parts[1]
                # PlantDoc: PlantDoc-Dataset-master/train/Tomato/img.jpg → parts[2] or parts[3]
                if len(parts) >= 3 and not parts[-1] == "":
                    folder = parts[-2]  # Parent folder of the image = class name
                    if folder and "." not in folder:
                        classes.add(folder)
    except Exception:
        pass
    return sorted(classes)


# Covers PlantVillage + PlantDoc classes present in your local dataset.
# These are the known labels Gemini Vision should reason against.
KNOWN_CONDITIONS = {
    "tomato": [
        "Tomato Bacterial Spot",
        "Tomato Early Blight",
        "Tomato Late Blight",
        "Tomato Leaf Mold",
        "Tomato Septoria Leaf Spot",
        "Tomato Spider Mites (Two-spotted spider mite)",
        "Tomato Target Spot",
        "Tomato Tomato Yellow Leaf Curl Virus",
        "Tomato Tomato Mosaic Virus",
        "Tomato Healthy",
    ],
    "potato": [
        "Potato Early Blight",
        "Potato Late Blight",
        "Potato Healthy",
    ],
    "corn": [
        "Corn (maize) Cercospora Leaf Spot / Gray Leaf Spot",
        "Corn (maize) Common Rust",
        "Corn (maize) Northern Leaf Blight",
        "Corn (maize) Healthy",
    ],
    "apple": [
        "Apple Apple Scab",
        "Apple Black Rot",
        "Apple Cedar Apple Rust",
        "Apple Healthy",
    ],
    "grape": [
        "Grape Black Rot",
        "Grape Esca (Black Measles)",
        "Grape Leaf Blight (Isariopsis Leaf Spot)",
        "Grape Healthy",
    ],
    "wheat": [
        "Wheat Brown Rust",
        "Wheat Loose Smut",
        "Wheat Stripe Rust",
        "Wheat Healthy",
    ],
    "cotton": [
        "Cotton Leaf Curl Virus",
        "Cotton Bacterial Blight",
        "Cotton Aphid Infestation",
        "Cotton Healthy",
    ],
    "rice": [
        "Rice Blast",
        "Rice Brown Spot",
        "Rice Sheath Blight",
        "Rice Neck Rot",
        "Rice Healthy",
    ],
    "default": [
        "Fungal Disease",
        "Bacterial Disease",
        "Viral Disease",
        "Pest Infestation",
        "Nutrient Deficiency",
        "Water Stress",
        "Heat Stress",
        "Healthy",
        "Unknown",
    ],
}


# ── Evidence item ─────────────────────────────────────────────────────────────
class EvidenceItem(BaseModel):
    source: Literal["image", "weather", "satellite", "soil", "crop_stage", "field_history"]
    finding: str
    supports_primary: bool = True


# ── Differential candidate ─────────────────────────────────────────────────────
class DifferentialCandidate(BaseModel):
    condition: str
    probability: float = Field(ge=0.0, le=1.0)
    rationale: str

# ── Canonical condition-category mapping (taxonomy.json equivalent) ──────────
# Maps condition name substrings → condition_category.
# Used by evidence fusion to classify vision output into typed evidence.
CONDITION_CATEGORY_MAP = {
    # Fungal diseases
    "early_blight": "disease",
    "late_blight": "disease",
    "leaf_mold": "disease",
    "septoria": "disease",
    "target_spot": "disease",
    "black_rot": "disease",
    "brown_rust": "disease",
    "loose_smut": "disease",
    "stripe_rust": "disease",
    "cercospora": "disease",
    "northern_leaf_blight": "disease",
    "common_rust": "disease",
    "blast": "disease",
    "brown_spot": "disease",
    "sheath_blight": "disease",
    # Bacterial
    "bacterial_spot": "disease",
    "bacterial_blight": "disease",
    # Viral
    "mosaic_virus": "disease",
    "yellow_leaf_curl": "disease",
    "leaf_curl_virus": "disease",
    "esca": "disease",
    # Pests
    "spider_mite": "pest",
    "aphid": "pest",
    # Stress
    "water_stress": "water_stress",
    "heat_stress": "heat_stress",
    # Deficiency
    "nutrient": "nutrient_deficiency",
    "deficiency": "nutrient_deficiency",
    # Healthy
    "healthy": "healthy",
}


def get_condition_category(condition_name: str) -> str:
    """Infer condition_category from a condition name string."""
    lower = condition_name.lower().replace(" ", "_").replace("-", "_")
    for keyword, category in CONDITION_CATEGORY_MAP.items():
        if keyword in lower:
            return category
    return "unknown"


# ── Full diagnosis response ────────────────────────────────────────────────────
class FullDiagnosisResponse(BaseModel):
    image_quality: Literal["good", "fair", "poor"]
    condition_name: str
    condition_category: Literal[
        "disease", "pest", "nutrient_deficiency",
        "water_stress", "heat_stress", "healthy", "unknown"
    ]
    confidence: float = Field(ge=0.0, le=1.0)
    severity: Literal["low", "medium", "high", "critical", "none", "unknown"]
    
    # The 6 Questions from AgriMesh HLI
    what_is_happening: str
    why_is_it_happening: str
    treatment_recommendation: str
    action_timing: str
    monitor: str
    
    requires_expert: bool = False
    escalation_triggered: bool = False
    differential_diagnosis: List[DifferentialCandidate]
    evidence: List[EvidenceItem]


# ── Legacy simple response (kept for backward compat) ─────────────────────────
class DiseaseDiagnosisResponse(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    treatment_recommendation: str


# ── Other existing schemas ─────────────────────────────────────────────────────
class CropIdentificationResponse(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    confidence_score: float


class DiseaseDiagnosisRequest(BaseModel):
    crop_type: str
    crop_stage: str
    recent_weather: str


class AdvisoryRequest(BaseModel):
    field_id: str
    crop_type: str
    crop_stage: str
    health_score_summary: str
    weather_summary: str
    soil_summary: str
    farmer_language: str = "en"


class AdvisoryResponse(BaseModel):
    crop_health_status: str
    irrigation_advice: str
    pest_disease_risks: str
    nutrient_management: str
    weather_impact: str
    regenerative_practice: str
