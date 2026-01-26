from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .layer import Layer
    # from .audit_log import AuditLog

class UserRole(str, Enum):
    VIEWER = "viewer"
    UPLOADER = "uploader"
    ADMIN = "admin"

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    password_hash: str = Field(max_length=255)
    
    role: UserRole = Field(default=UserRole.VIEWER)
    full_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=100)
    
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # layers: list["Layer"] = Relationship(back_populates="creator")
    # audit_logs: list["AuditLog"] = Relationship(back_populates="user")
