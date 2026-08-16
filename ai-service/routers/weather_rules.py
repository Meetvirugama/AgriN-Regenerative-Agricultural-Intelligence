from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class RuleConfig(BaseModel):
    rain_threshold_mm: float = 15.0
    heat_threshold_c: float = 35.0
    humidity_threshold_pct: float = 85.0

class WeatherSnapshot(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    rainfall_mm: float
    humidity_pct: float

class WeatherRuleRequest(BaseModel):
    field_id: str
    forecasts: List[WeatherSnapshot]
    config: Optional[RuleConfig] = RuleConfig()

class WeatherEventFlag(BaseModel):
    id: str
    field_id: str
    event_type: str
    start_date: str
    end_date: str
    severity: str
    message: str
    generated_at: str

@router.post("/evaluate", response_model=List[WeatherEventFlag])
async def evaluate_rules(request: WeatherRuleRequest):
    """
    Evaluates an array of forecasts against scientific thresholds to generate early warning flags.
    """
    try:
        flags = []
        field_id = request.field_id
        forecasts = request.forecasts
        config = request.config
        generated_at = datetime.utcnow().isoformat() + "Z"

        # 1. Check for heavy rain
        rain_days = [f for f in forecasts if f.rainfall_mm >= config.rain_threshold_mm]
        if rain_days:
            severity = 'high' if any(f.rainfall_mm > 40 for f in rain_days) else 'medium'
            message = 'Heavy rainfall expected this week.' if severity == 'high' else 'Rain expected in the coming days.'
            flags.append(WeatherEventFlag(
                id=f"flag_{field_id}_rain_{rain_days[0].date}",
                field_id=field_id,
                event_type='rain_expected',
                start_date=rain_days[0].date,
                end_date=rain_days[-1].date,
                severity=severity,
                message=message,
                generated_at=generated_at
            ))

        # 2. Check for heat event
        heat_days = [f for f in forecasts if f.temp_max >= config.heat_threshold_c]
        if heat_days:
            severity = 'high' if any(f.temp_max > 40 for f in heat_days) else 'medium'
            flags.append(WeatherEventFlag(
                id=f"flag_{field_id}_heat_{heat_days[0].date}",
                field_id=field_id,
                event_type='heat_event',
                start_date=heat_days[0].date,
                end_date=heat_days[-1].date,
                severity=severity,
                message='Extreme heat warning. Temperatures exceeding safe thresholds.',
                generated_at=generated_at
            ))

        # 3. Check for extreme humidity (disease risk)
        humid_days = [f for f in forecasts if f.humidity_pct >= config.humidity_threshold_pct]
        if humid_days:
            flags.append(WeatherEventFlag(
                id=f"flag_{field_id}_humidity_{humid_days[0].date}",
                field_id=field_id,
                event_type='humidity_spike',
                start_date=humid_days[0].date,
                end_date=humid_days[-1].date,
                severity='medium',
                message='High humidity detected. Increased disease risk.',
                generated_at=generated_at
            ))

        # 4. Check for frost warning
        frost_days = [f for f in forecasts if f.temp_min <= 2]
        if frost_days:
            severity = 'high' if any(f.temp_min <= 0 for f in frost_days) else 'medium'
            flags.append(WeatherEventFlag(
                id=f"flag_{field_id}_frost_{frost_days[0].date}",
                field_id=field_id,
                event_type='frost_warning',
                start_date=frost_days[0].date,
                end_date=frost_days[-1].date,
                severity=severity,
                message='Frost warning. High risk of crop damage.',
                generated_at=generated_at
            ))

        return flags
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
