from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
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
        "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "Corn_(maize)___Common_rust_",
        "Corn_(maize)___Northern_Leaf_Blight",
        "Corn_(maize)___healthy",
    ],
    "apple": [
        "Apple Apple Scab",
        "Apple Black Rot",
        "Apple Cedar Apple Rust",
        "Apple Healthy",
    ],
    "grape": [
        "Grape___Black_rot",
        "Grape___Esca_(Black_Measles)",
        "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "Grape___healthy",
    ],
    "cherry": [
        "Cherry_(including_sour)___Powdery_mildew",
        "Cherry_(including_sour)___healthy",
    ],
    "peach": [
        "Peach___Bacterial_spot",
        "Peach___healthy",
    ],
    "pepper": [
        "Pepper,_bell___Bacterial_spot",
        "Pepper,_bell___healthy",
    ],
    "strawberry": [
        "Strawberry___Leaf_scorch",
        "Strawberry___healthy",
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




Severity = Literal["green", "amber", "red"]
RiskLevel = Literal["low", "medium", "high", "critical"]


# ============================================================
# COMMON
# ============================================================

class DimensionResult(BaseModel):
    value: str
    severity: Severity
    basis: List[str] = Field(default_factory=list)


# ============================================================
# HEALTH SCORE — LAYER 06
# ============================================================

class HealthScoreRequest(BaseModel):
    field_id: str

    latest_tile: Optional[Dict[str, Any]] = None
    latest_trend: Optional[Dict[str, Any]] = None

    active_anomalies: List[Dict[str, Any]] = Field(
        default_factory=list
    )

    crop_stage: Dict[str, Any] = Field(
        default_factory=dict
    )

    weather: Dict[str, Any] = Field(
        default_factory=dict
    )

    soil: Dict[str, Any] = Field(
        default_factory=dict
    )


class HealthScoreResponse(BaseModel):
    crop_health: DimensionResult
    water_condition: DimensionResult
    soil_condition: DimensionResult
    weather_risk: DimensionResult
    disease_risk: DimensionResult
    climate_stress: DimensionResult
    vegetation_trend: DimensionResult


# ============================================================
# ADVISORY — LAYER 09
# ============================================================

class AdvisoryRequest(BaseModel):
    crop_type: str
    crop_stage: str

    satellite_summary: Any
    weather_summary: Any
    soil_summary: Any

    farmer_language: str = "en"

    field_context: Optional[Dict[str, Any]] = None
    farmer_observation: Optional[str] = None


class AdvisoryResponse(BaseModel):
    id: Optional[str] = None
    severity: str

    action_text: str
    action_deadline: str

    what_text: str
    why_text: str

    monitor_text: str

    historical_parallel_callout: Optional[str] = None

    source_layers: List[str] = []


# ============================================================
# PHENOLOGY — LAYER 02
# ============================================================

class StageThreshold(BaseModel):
    stage: str
    gdd_threshold: int


class CropCalendar(BaseModel):
    crop_type: str
    region: str
    stages: List[StageThreshold]


class PhenologyRequest(BaseModel):
    sowing_date: str
    calendar: CropCalendar

    temp_max_c: Optional[List[float]] = None
    temp_min_c: Optional[List[float]] = None


class PhenologyResponse(BaseModel):
    accumulated_gdd: int
    current_stage: str
    stage_description: str
    gdd_method: Literal[
        "real_temperature",
        "estimated_15_per_day"
    ]


# ============================================================
# WEATHER — LAYER 03
# ============================================================

class RuleConfig(BaseModel):
    rain_threshold_mm: float = Field(default=15.0, ge=0)
    heat_threshold_c: float = 35.0
    humidity_threshold_pct: float = Field(
        default=85.0,
        ge=0,
        le=100
    )
    frost_threshold_c: float = 2.0


class WeatherSnapshot(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    rainfall_mm: float = Field(default=0, ge=0)
    humidity_pct: float = Field(
        default=0,
        ge=0,
        le=100
    )


class WeatherRuleRequest(BaseModel):
    field_id: str
    forecasts: List[WeatherSnapshot]

    config: RuleConfig = Field(
        default_factory=RuleConfig
    )


class WeatherEventFlag(BaseModel):
    id: str
    field_id: str
    event_type: str
    start_date: str
    end_date: str
    severity: Literal["low", "medium", "high"]
    message: str
    generated_at: str


# ============================================================
# CLIMATE RISK — LAYER 08
# ============================================================

class ClimateRiskRequest(BaseModel):
    field_id: str
    crop_type: str
    crop_stage: str

    lat: float
    lng: float

    sowing_date: str

    weather_summary: Optional[Dict[str, Any]] = None
    historical_context: Optional[Dict[str, Any]] = None


class ClimateRiskResponse(BaseModel):
    severity: str
    riskType: str
    timeframe: str
    protectiveAction: str
    generatedAt: str
    primaryRisks: List[str]
    mitigationStrategies: List[str]


# ============================================================
# SOIL — LAYER 04
# ============================================================

class SoilVisionResponse(BaseModel):
    overall_confidence: int = Field(
        ge=0,
        le=100
    )

    field_confidences: Dict[str, int] = Field(
        default_factory=dict
    )

    texture: Optional[str] = None
    organic_matter_pct: Optional[float] = None

    nitrogen_level: Optional[str] = None
    phosphorus_level: Optional[str] = None
    potassium_level: Optional[str] = None

    water_holding_capacity: Optional[str] = None

    ph: Optional[float] = Field(
        default=None,
        ge=0,
        le=14
    )

    report_date: Optional[str] = None
    source: Optional[str] = None


# ============================================================
# SATELLITE — LAYER 05
# ============================================================

class ProcessSatelliteRequest(BaseModel):
    field_id: str

    current_tile: Dict[str, Any]

    history: List[Dict[str, Any]] = Field(
        default_factory=list
    )


class ProcessSatelliteResponse(BaseModel):
    latestTile: Optional[Dict[str, Any]] = None
    trend: Optional[Dict[str, Any]] = None
    activeAnomalies: List[Dict[str, Any]] = Field(
        default_factory=list
    )


# ============================================================
# REGENERATIVE AGRICULTURE — LAYER 10
# ============================================================

class RegenPlanRequest(BaseModel):
    context: Dict[str, Any]


class RegenPlanResponse(BaseModel):
    practices: List[Dict[str, Any]]
    next_season_options: List[Dict[str, Any]]


# ============================================================
# CROSS BORDER — LAYER 14
# ============================================================

class GlobalInsight(BaseModel):
    id: str
    insightType: str
    sourceRegion: str
    comparableClimateZone: str

    recommendation: str

    confidenceScore: float = Field(
        ge=0,
        le=1
    )

    adoptionRate: int = Field(
        ge=0,
        le=100
    )


class CrossBorderResponse(BaseModel):
    fieldId: str
    insights: List[GlobalInsight]
