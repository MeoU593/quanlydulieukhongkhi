from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from titiler.core.errors import DEFAULT_STATUS_CODES
from app.core.config import settings
from app.middleware.audit_middleware import AuditMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add audit logging middleware
app.add_middleware(AuditMiddleware)

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

# Include API router
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Include TiTiler router
from app.api.v1.tiles import router as tiles_router
from titiler.core.errors import add_exception_handlers

app.include_router(tiles_router, prefix=f"{settings.API_V1_STR}/tiles", tags=["tiles"])
add_exception_handlers(app, DEFAULT_STATUS_CODES)

