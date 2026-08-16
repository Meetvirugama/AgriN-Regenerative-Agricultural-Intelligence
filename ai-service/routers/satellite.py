from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import time

router = APIRouter()

class ProcessSatelliteRequest(BaseModel):
    field_id: str
    current_tile: Any
    history: List[Any]

class ProcessSatelliteResponse(BaseModel):
    trend: Optional[Any]
    anomalies: List[Any]

@router.post("/process", response_model=ProcessSatelliteResponse)
async def process_satellite_data(request: ProcessSatelliteRequest):
    try:
        field_id = request.field_id
        current_tile = request.current_tile
        history = request.history
        
        # 1. Compute Trend
        trend = None
        if len(history) > 1:
            prev_tile = history[1] # Follows the logic from TS
            ndvi_trend_direction = 'stable'
            moisture_trend = 'stable'
            
            ndvi_diff = current_tile.get('ndviMean', 0) - prev_tile.get('ndviMean', 0)
            if ndvi_diff > 0.05:
                ndvi_trend_direction = 'improving'
            elif ndvi_diff < -0.05:
                ndvi_trend_direction = 'declining'
                
            moisture_diff = current_tile.get('moistureProxy', 0) - prev_tile.get('moistureProxy', 0)
            if moisture_diff > 0.05:
                moisture_trend = 'improving'
            elif moisture_diff < -0.05:
                moisture_trend = 'declining'
                
            summary_text = 'Conditions are stable.'
            if ndvi_trend_direction == 'improving':
                summary_text = 'Greener than last week.'
            elif ndvi_trend_direction == 'declining':
                summary_text = 'Slight vegetation decline observed.'
                
            trend = {
                'fieldId': field_id,
                'date': current_tile.get('captureDate'),
                'ndviTrendDirection': ndvi_trend_direction,
                'moistureTrend': moisture_trend,
                'ndviValue': current_tile.get('ndviMean'),
                'moistureValue': current_tile.get('moistureProxy'),
                'summaryText': summary_text,
                'computedAt': datetime.utcnow().isoformat() + "Z"
            }
            
        # 2. Detect Anomalies
        anomalies = []
        if len(history) >= 2:
            prev_tile = history[1]
            current_subregions = current_tile.get('ndviBySubregion', [])
            prev_subregions = prev_tile.get('ndviBySubregion', [])
            
            for current_sub in current_subregions:
                sub_id = current_sub.get('subregionId')
                prev_sub = next((s for s in prev_subregions if s.get('subregionId') == sub_id), None)
                
                if prev_sub:
                    prev_ndvi = prev_sub.get('ndvi', 0)
                    curr_ndvi = current_sub.get('ndvi', 0)
                    
                    if prev_ndvi > 0:
                        drop_pct = (prev_ndvi - curr_ndvi) / prev_ndvi
                        if drop_pct > 0.15: # 15% drop
                            severity = 'high' if drop_pct > 0.25 else 'moderate'
                            anomalies.append({
                                'id': f"anomaly-{int(time.time() * 1000)}-{sub_id}",
                                'fieldId': field_id,
                                'subregionGeometry': current_sub.get('geometry'),
                                'subregionLabel': current_sub.get('label'),
                                'detectedDate': current_tile.get('captureDate'),
                                'anomalyType': 'vegetation_decline',
                                'severity': severity,
                                'stillActive': True,
                                'resolvedDate': None
                            })
                            
        return ProcessSatelliteResponse(trend=trend, anomalies=anomalies)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
