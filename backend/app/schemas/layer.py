from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LayerRead(BaseModel):
    id: int
    product_id: str
    region_id: int
    pollutant_id: int
    year: int
    period_type: str
    period_value: str
    filepath: Optional[str] = None
    file_size_bytes: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    created_at: Optional[datetime] = None
    status: str = "active"

    # Enriched fields (set at API level, not from DB)
    pollutant_code: Optional[str] = None
    pollutant_unit: Optional[str] = None
    cog_url: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls.model_validate(obj)


class LayerList(BaseModel):
    items: List[LayerRead]
    total: int
