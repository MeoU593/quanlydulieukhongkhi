from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta

from app.api.deps import get_session, get_current_user
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import Token, LoginRequest

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: LoginRequest,
    session: Session = Depends(get_session)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # 1. Find user
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    
    # 2. Verify password
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Check active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    # 4. Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=f"user_id:{user.id}", expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        subject=f"user_id:{user.id}"
    )
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me")
async def read_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value,
        "full_name": current_user.full_name,
        "email": current_user.email
    }
