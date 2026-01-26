from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

# Request schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.VIEWER
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)

class UserUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[UserRole] = None
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None

# Response schemas
class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    full_name: Optional[str]
    email: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserList(BaseModel):
    users: list[UserResponse]
    total: int
