from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from app.api.deps import get_session, get_current_user
from app.models.user import User
from app.models.layer import Layer
from app.models.pollutant import Pollutant
from app.models.region import Region
from pydantic import BaseModel

router = APIRouter()

class StatPoint(BaseModel):
    label: str
    value: float
    year: int
    period: str

class ReportStats(BaseModel):
    trend_data: List[StatPoint]
    summary: dict

@router.get("/stats", response_model=ReportStats)
def get_stats(
    region_id: int,
    pollutant_code: str,
    year: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get statistics for a specific region, pollutant, and year.
    Returns trend data (monthly/quarterly averages) and a text summary.
    """
    # Get Pollutant ID
    pollutant = session.exec(select(Pollutant).where(Pollutant.code == pollutant_code)).first()
    if not pollutant:
        return ReportStats(trend_data=[], summary={"error": "Pollutant not found"})
        
    # Query Layers
    statement = select(Layer).where(
        Layer.region_id == region_id,
        Layer.pollutant_id == pollutant.id,
        Layer.year == year
    ).order_by(Layer.period_value)
    

    layers = session.exec(statement).all()
    
    # Process for Trend Data
    trend_data = []
    values = []
    
    for layer in layers:
        # Prioritize mean_value, fallback to (min+max)/2, else 0
        if layer.mean_value is not None:
            val = layer.mean_value
        elif layer.min_value is not None and layer.max_value is not None:
            val = (layer.min_value + layer.max_value) / 2
        else:
            val = 0
            
        if val > 0:
            values.append(val)
            
        trend_data.append(StatPoint(
            label=f"{layer.period_type} {layer.period_value}",
            value=val,
            year=layer.year,
            period=layer.period_value
        ))
        
    # Summary Statistics
    summary = {
        "count": len(values),
        "min": min(values) if values else 0,
        "max": max(values) if values else 0,
        "avg": sum(values) / len(values) if values else 0,
        "pollutant": pollutant_code,
        "year": year
    }
    
    return ReportStats(trend_data=trend_data, summary=summary)
