from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, Any
import asyncio
import random
import datetime

router = APIRouter()

class SoilVisionResponse(BaseModel):
    overall_confidence: int
    field_confidences: Dict[str, int]
    texture: str = None
    organic_matter_pct: float = None
    nitrogen_level: str = None
    phosphorus_level: str = None
    potassium_level: str = None
    water_holding_capacity: str = None
    ph: float = None
    report_date: str = None
    source: str = None

@router.post("/parse-soil-report", response_model=SoilVisionResponse)
async def parse_soil_report(image: UploadFile = File(...)):
    try:
        # Read the file to ensure we can (simulate receiving it)
        content = await image.read()
        
        # Simulate network and processing latency for vision model
        await asyncio.sleep(2.0)

        # For demonstration, simulate a 10% chance of a "blurry scan"
        is_blurry = random.random() < 0.1

        if is_blurry:
            return SoilVisionResponse(
                overall_confidence=30,
                field_confidences={}
            )

        return SoilVisionResponse(
            overall_confidence=88,
            field_confidences={
                'texture': 95,
                'organic_matter_pct': 90,
                'nitrogen_level': 95,
                'phosphorus_level': 95,
                'potassium_level': 95,
                'water_holding_capacity': 90,
                'ph': 45
            },
            texture='clay_loam',
            organic_matter_pct=4.2,
            nitrogen_level='high',
            phosphorus_level='medium',
            potassium_level='high',
            water_holding_capacity='high',
            ph=6.5,
            report_date=datetime.datetime.utcnow().isoformat().split('T')[0],
            source='lab_report'
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
