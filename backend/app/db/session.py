from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Create engine (SQLite for easy start, can switch to PostgreSQL later)
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

def SessionLocal():
    """Create a new database session"""
    return Session(engine)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
