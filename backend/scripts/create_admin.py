from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_admin():
    print("Creating admin user...")
    with Session(engine) as session:
        # Check if admin exists
        user = session.exec(select(User).where(User.username == "admin")).first()
        if user:
            print("Admin user already exists!")
            return
            
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("Admin123!"),  # Change in prod
            role=UserRole.ADMIN,
            full_name="System Administrator",
            email="admin@example.com",
            is_active=True
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        print(f"✓ Admin user created! (ID: {admin_user.id})")
        print("Username: admin")
        print("Password: Admin123!")

if __name__ == "__main__":
    create_admin()
