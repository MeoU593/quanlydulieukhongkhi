"""
Initialize database with seed data
Run this script to create tables and populate initial data
"""
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, create_db_and_tables
from app.models.region import Region
from app.models.pollutant import Pollutant
from app.models.user import User, UserRole
from app.models.layer import Layer  # Import to register table
from app.models.audit_log import AuditLog  # Import to register table
from app.core.security import get_password_hash
from sqlmodel import Session, select

def init_db():
    print("Creating database tables...")
    create_db_and_tables()
    
    print("Seeding initial data...")
    with Session(engine) as session:
        # Seed regions
        existing_regions = session.exec(select(Region)).first()
        if not existing_regions:
            regions = [
                Region(code="LAO_CAI", name="Lào Cai"),
                Region(code="HA_NOI", name="Hà Nội"),
            ]
            session.add_all(regions)
            print("✓ Created regions")
        
        # Seed pollutants
        existing_pollutants = session.exec(select(Pollutant)).first()
        if not existing_pollutants:
            pollutants = [
                Pollutant(code="CO", name="Carbon Monoxide", unit="µg/m³"),
                Pollutant(code="NO2", name="Nitrogen Dioxide", unit="µg/m³"),
                Pollutant(code="O3", name="Ozone", unit="µg/m³"),
                Pollutant(code="HCHO", name="Formaldehyde", unit="µg/m³"),
                Pollutant(code="SO2", name="Sulfur Dioxide", unit="µg/m³"),
            ]
            session.add_all(pollutants)
            print("✓ Created pollutants")
        
        # Create admin user
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                full_name="System Administrator",
                email="admin@example.com",
                is_active=True
            )
            session.add(admin_user)
            print("✓ Created admin user (username: admin, password: admin123)")
        else:
            print("✓ Admin user already exists")
        
        session.commit()
        print("\n✅ Database initialized successfully!")

if __name__ == "__main__":
    init_db()
