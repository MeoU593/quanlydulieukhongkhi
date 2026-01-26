import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.schemas.upload import UploadInitRequest, UploadInitResponse, ChunkUploadResponse, UploadCompleteResponse
from app.services.upload_service import upload_service
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/init", response_model=UploadInitResponse)
def init_upload(request: UploadInitRequest):
    """Initialize a chunked upload session"""
    upload_id = upload_service.init_upload(request.filename, request.dict())
    expires = datetime.utcnow() + timedelta(hours=1)
    chunk_size = 10 * 1024 * 1024  # 10MB chunks
    return UploadInitResponse(
        upload_id=upload_id,
        chunk_size=chunk_size,
        expires_at=expires
    )

@router.post("/{upload_id}/chunk", response_model=ChunkUploadResponse)
async def upload_chunk(
    upload_id: str,
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    filename: str = Form(None), # Optional for backward compatibility, but should be sent
    file: UploadFile = File(...)
):
    """Upload a single chunk"""
    # Fallback if filename not provided (backward compat)
    actual_filename = filename or file.filename or "unknown.tif"
    
    await upload_service.save_chunk(upload_id, chunk_index, actual_filename, file)
    
    status = "uploading"
    # Note: With multiple files, "completed" status for a single chunk loop 
    # doesn't mean the whole session is done. Frontend determines when to call complete.
    
    return ChunkUploadResponse(
        filename=actual_filename,
        chunk_index=chunk_index,
        total_chunks=total_chunks,
        status=status
    )

@router.post("/{upload_id}/complete", response_model=UploadCompleteResponse)
def complete_upload(
    upload_id: str,
    session: Session = Depends(get_session)
):
    """Assemble chunks into final file and register layer"""
    try:
        # Assemble file and get metadata
        # Rename assemble_file to process_session in service
        file_path, metadata = upload_service.process_session(upload_id)
        
        # Create Layer record if metadata exists
        layer_id = None
        if metadata:
            from app.models.layer import Layer
            from app.models.pollutant import Pollutant
            
            # Find pollutant
            pollutant = session.exec(select(Pollutant).where(Pollutant.code == metadata.get("pollutant_code"))).first()
            pollutant_id = pollutant.id if pollutant else 1  # Default or error handling needs improvement
            
            layer = Layer(
                product_id=upload_id,
                region_id=metadata.get("region_id"),
                pollutant_id=pollutant_id,
                year=metadata.get("year"),
                period_type=metadata.get("period_type"),
                period_value=metadata.get("period_value"),
                filepath=file_path,
                file_size_bytes=os.path.getsize(file_path),
                status="active"
            )
            session.add(layer)
            session.commit()
            session.refresh(layer)
            layer_id = layer.id
            
        return UploadCompleteResponse(
            task_id=upload_id,
            status="completed",
            message=f"File assembled at {file_path}. Layer registered.",
            layer_id=layer_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
