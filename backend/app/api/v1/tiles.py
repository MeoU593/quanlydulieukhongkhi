from fastapi import APIRouter, Query
from titiler.core.factory import TilerFactory
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers

from app.core.config import settings
import os

# Create TiTiler router
# We restrict the dataset path to be within our trusted DATA_PATH
def path_dependency(path: str = Query(..., description="Dataset filename")) -> str:
    """Validate and return full path to dataset."""
    # Security check: prevent directory traversal
    safe_path = os.path.normpath(os.path.join(settings.DATA_PATH, path))
    if not safe_path.startswith(os.path.normpath(settings.DATA_PATH)):
        raise ValueError("Invalid dataset path")
    return safe_path

# Initialize TilerFactory
cog = TilerFactory(
    router_prefix="/tiles",
    path_dependency=path_dependency
)

router = cog.router
