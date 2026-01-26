from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

class UploadInitRequest(BaseModel):
    filename: str = Field(..., max_length=255, pattern=r".*\.tiff?$")
    file_size: int = Field(..., gt=0, le=2*1024*1024*1024)  # Max 2GB
    region_id: int
    pollutant_code: str
    year: int
    period_type: str
    period_value: str

class UploadInitResponse(BaseModel):
    upload_id: str
    chunk_size: int = 10 * 1024 * 1024  # 10MB
    expires_at: datetime

class ChunkUploadResponse(BaseModel):
    filename: str
    chunk_index: int
    total_chunks: int
    status: Literal["uploading", "completed"]

class UploadCompleteResponse(BaseModel):
    task_id: str
    status: Literal["processing", "completed"]
    message: str
    layer_id: Optional[int] = None
