from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.pollutant import Pollutant
from app.schemas.common import PollutantRead

router = APIRouter()

@router.get("/", response_model=list[PollutantRead])
def get_pollutants(session: Session = Depends(get_session)):
    """Get all pollutants"""
    pollutants = session.exec(select(Pollutant)).all()
    return pollutants

@router.get("/{pollutant_id}", response_model=PollutantRead)
def get_pollutant(pollutant_id: int, session: Session = Depends(get_session)):
    """Get pollutant by ID"""
    pollutant = session.get(Pollutant, pollutant_id)
    return pollutant
