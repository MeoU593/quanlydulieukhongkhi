from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime

class Region(SQLModel, table=True):
    __tablename__ = "regions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=20)
    name: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
