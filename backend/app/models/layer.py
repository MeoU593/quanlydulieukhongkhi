from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime
from enum import Enum

class PeriodType(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class Layer(SQLModel, table=True):
    __tablename__ = "layers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: str = Field(unique=True, index=True, max_length=100)
    
    region_id: int = Field(foreign_key="regions.id", index=True)
    pollutant_id: int = Field(foreign_key="pollutants.id", index=True)
    
    year: int = Field(index=True)
    period_type: str = Field(max_length=20)  # monthly, quarterly, yearly
    period_value: str = Field(max_length=10)  # M01, Q1, Y2024
    
    filepath: str = Field(max_length=500)
    file_size_bytes: Optional[int] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active")  # active, archived, deleted
