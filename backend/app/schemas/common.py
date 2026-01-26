from pydantic import BaseModel
from typing import Optional

class RegionRead(BaseModel):
    id: int
    code: str
    name: str
    
    class Config:
        from_attributes = True

class PollutantRead(BaseModel):
    id: int
    code: str
    name: str
    unit: str
    
    class Config:
        from_attributes = True
