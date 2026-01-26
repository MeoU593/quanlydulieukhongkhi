from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .user import User

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    
    # Action details
    action: str = Field(max_length=50)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type: Optional[str] = Field(default=None, max_length=50)  # user, layer, region, etc.
    resource_id: Optional[str] = Field(default=None, max_length=100)
    
    # Additional context
    details: Optional[str] = Field(default=None)  # JSON string with extra info
    ip_address: Optional[str] = Field(default=None, max_length=45)  # IPv4 or IPv6
    user_agent: Optional[str] = Field(default=None, max_length=255)
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # user: Optional["User"] = Relationship(back_populates="audit_logs")
