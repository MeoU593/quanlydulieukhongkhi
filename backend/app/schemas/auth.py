from pydantic import BaseModel, Field
from typing import Literal

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds

class TokenPayload(BaseModel):
    sub: str = None
    exp: int = None
    type: Literal["access", "refresh"] = None
