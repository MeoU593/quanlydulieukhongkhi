from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LayerFilter(BaseModel):
    region_id: Optional[int] = None
    pollutant_code: Optional[str] = Field(None, pattern="^(CO|NO2|O3|HCHO|SO2)$")
    year: Optional[int] = Field(None, ge=2018, le=2025)
    period_type: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")
    period_value: Optional[str] = None

class LayerRead(BaseModel):
    id: int
    product_id: str
    region_id: int
    pollutant_id: int
    year: int
    period_type: str
    period_value: str
    filepath: str
    created_at: datetime
    cog_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class LayerList(BaseModel):
    items: list[LayerRead]
    total: int

class LayerUpdate(BaseModel):
    region_id: Optional[int] = None
    pollutant_id: Optional[int] = None
    year: Optional[int] = None
    period_type: Optional[str] = None
    period_value: Optional[str] = None
