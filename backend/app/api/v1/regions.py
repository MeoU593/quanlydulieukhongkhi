from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.region import Region
from app.schemas.common import RegionRead

router = APIRouter()

@router.get("/", response_model=list[RegionRead])
def get_regions(session: Session = Depends(get_session)):
    """Get all regions"""
    regions = session.exec(select(Region)).all()
    return regions

@router.get("/{region_id}", response_model=RegionRead)
def get_region(region_id: int, session: Session = Depends(get_session)):
    """Get region by ID"""
    region = session.get(Region, region_id)
    return region
