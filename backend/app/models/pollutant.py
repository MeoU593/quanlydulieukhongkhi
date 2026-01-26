from sqlmodel import Field, SQLModel
from typing import Optional

class Pollutant(SQLModel, table=True):
    __tablename__ = "pollutants"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=10)  # CO, NO2, O3, HCHO
    name: str = Field(max_length=50)
    unit: str = Field(max_length=20)  # µg/m³, ppm
    description: Optional[str] = None
