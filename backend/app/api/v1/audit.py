from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.api.deps import get_session, get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    username: Optional[str] = None

@router.get("/", response_model=List[AuditLogRead])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) # Require login
):
    """
    Get recent audit logs. 
    Can be filtered by resource_type or action if needed in future.
    """
    # Join with User to get username
    statement = select(AuditLog, User.username).outerjoin(User, AuditLog.user_id == User.id).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    results = session.exec(statement).all()
    
    logs = []
    for log, username in results:
        # Convert to Pydantic model
        log_dict = log.dict()
        log_dict["username"] = username if username else "System/Unknown"
        logs.append(AuditLogRead(**log_dict))
        
    return logs
