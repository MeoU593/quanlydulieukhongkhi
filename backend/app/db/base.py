from sqlmodel import SQLModel

# Import all models here for Alembic to detect
from app.models.region import Region
from app.models.pollutant import Pollutant
from app.models.layer import Layer
from app.models.user import User
from app.models.audit_log import AuditLog
