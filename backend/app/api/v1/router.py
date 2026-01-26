from fastapi import APIRouter
from app.api.v1 import regions, pollutants, layers, upload, auth, users

api_router = APIRouter()

api_router.include_router(regions.router, prefix="/regions", tags=["regions"])
api_router.include_router(pollutants.router, prefix="/pollutants", tags=["pollutants"])
api_router.include_router(layers.router, prefix="/layers", tags=["layers"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
