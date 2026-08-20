from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

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
    # Optional: daily temperature history from weather_snapshots
    # If provided, real GDD is computed. If absent, falls back to a 15 GDD/day estimate.
    temp_max_c: Optional[List[float]] = None  # one value per day since sowing, most recent last
    temp_min_c: Optional[List[float]] = None  # paired with temp_max_c

class PhenologyResponse(BaseModel):
    accumulated_gdd: int
    current_stage: str
    stage_description: str
    gdd_method: str  # "real_temperature" | "estimated_15_per_day"

# Base temperatures (°C) by crop — below this, no GDD accumulates
BASE_TEMPS: dict[str, float] = {
    "wheat":   4.0,
    "rice":    10.0,
    "maize":   10.0,
    "cotton":  15.5,
    "soybean": 10.0,
    "sugarcane": 10.0,
}

def get_stage_description(stage: str, crop_type: str) -> str:
    descriptions = {
        'wheat': {
            'germination': 'Ensure soil remains moist but not waterlogged.',
            'vegetative': 'Focus on nitrogen application and weed control.',
            'flowering': 'Critical period for water stress. Avoid chemical spraying if possible.',
            'maturity': 'Monitor for harvest readiness and dry conditions.',
        },
        'rice': {
            'germination': 'Keep fields flooded but allow tips to breathe.',
            'vegetative': 'Top dress nitrogen and monitor for stem borers.',
            'flowering': 'Maintain water level. High disease vulnerability period.',
            'maturity': 'Drain field gradually to prepare for harvest.',
        },
        'maize': {
            'germination': 'Protect from early pests and birds.',
            'vegetative': 'Critical period for nitrogen uptake.',
            'flowering': 'Silking stage. Highly sensitive to heat and drought.',
            'maturity': 'Black layer forming. Monitor grain moisture.',
        },
    }
    
    crop_map = descriptions.get(crop_type.lower(), {})
    return crop_map.get(stage.lower(), 'Monitor field regularly.')

@router.post("/gdd", response_model=PhenologyResponse)
async def calculate_phenology(request: PhenologyRequest):
    """
    Calculates accumulated GDD and infers the current crop stage.

    Uses real daily temperature data (temp_max_c / temp_min_c) when provided
    by the Node caller (sourced from weather_snapshots). Falls back to the
    15 GDD/day estimate when temperature history is unavailable.
    """
    try:
        sowing = datetime.fromisoformat(request.sowing_date.replace('Z', '+00:00'))
        now = datetime.now(sowing.tzinfo)
        diff_days = max(0, (now - sowing).days)

        gdd_method = "estimated_15_per_day"
        gdd = 0

        # Real GDD calculation when temperature data is available
        if (
            request.temp_max_c
            and request.temp_min_c
            and len(request.temp_max_c) == len(request.temp_min_c)
            and len(request.temp_max_c) > 0
        ):
            crop = request.calendar.crop_type.lower()
            base_temp = BASE_TEMPS.get(crop, 10.0)
            for t_max, t_min in zip(request.temp_max_c, request.temp_min_c):
                mean_temp = (t_max + t_min) / 2.0
                daily_gdd = max(0.0, mean_temp - base_temp)
                gdd += daily_gdd
            gdd = int(round(gdd))
            gdd_method = "real_temperature"
        else:
            # Fallback: 15 GDD/day average estimate
            gdd = max(0, diff_days * 15)
        
        # Infer stage
        sorted_stages = sorted(request.calendar.stages, key=lambda x: x.gdd_threshold)
        current_stage = sorted_stages[0].stage if sorted_stages else 'vegetative'
        
        for stage_info in sorted_stages:
            if gdd >= stage_info.gdd_threshold:
                current_stage = stage_info.stage
            else:
                break
                
        description = get_stage_description(current_stage, request.calendar.crop_type)
        
        return PhenologyResponse(
            accumulated_gdd=gdd,
            current_stage=current_stage,
            stage_description=description,
            gdd_method=gdd_method,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
