from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
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

class PhenologyResponse(BaseModel):
    accumulated_gdd: int
    current_stage: str
    stage_description: str

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
    """
    try:
        # Stub: Assumes 15 GDD accumulated per day on average
        sowing = datetime.fromisoformat(request.sowing_date.replace('Z', '+00:00'))
        now = datetime.now(sowing.tzinfo)
        diff_days = (now - sowing).days
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
            stage_description=description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
