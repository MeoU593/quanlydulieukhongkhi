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
            from app.models.region import Region
            from app.models.audit_log import AuditLog
            from app.api.deps import get_current_user
            from app.utils.stats import calculate_raster_stats

            # Find pollutant & region
            pollutant = session.exec(select(Pollutant).where(Pollutant.code == metadata.get("pollutant_code"))).first()
            pollutant_id = pollutant.id if pollutant else 1
            
            region_id = metadata.get("region_id")
            region = session.get(Region, region_id)
            
            # --- SEMANTIC RENAMING ---
            final_path = file_path
            if region and pollutant:
                year = metadata.get("year", "unk")
                # Format: CODE_POLLUTANT_YEAR.tif
                # Sanitize just in case
                r_code = region.code.replace(" ", "_").upper()
                p_code = pollutant.code.replace(" ", "_").upper()
                
                new_filename = f"{r_code}_{p_code}_{year}.tif"
                
                # Determine dest dir from current file_path
                dest_dir = os.path.dirname(file_path)
                new_path = os.path.join(dest_dir, new_filename)
                
                # Handle duplicates
                if os.path.exists(new_path):
                    # Append timestamp
                    import time
                    ts = int(time.time())
                    new_filename = f"{r_code}_{p_code}_{year}_{ts}.tif"
                    new_path = os.path.join(dest_dir, new_filename)
                
                try:
                    os.rename(file_path, new_path)
                    final_path = new_path
                except OSError as e:
                    print(f"Error renaming file: {e}")
                    # Keep original UUID name if rename fails

            # Calculate stats on the (possibly renamed) file
            min_val, max_val, mean_val = calculate_raster_stats(final_path)

            layer = Layer(
                product_id=upload_id,
                region_id=region_id,
                pollutant_id=pollutant_id,
                year=metadata.get("year"),
                period_type=metadata.get("period_type"),
                period_value=metadata.get("period_value"),
                filepath=final_path,
                file_size_bytes=os.path.getsize(final_path),
                min_value=min_val,
                max_value=max_val,
                mean_value=mean_val,
                status="active"
            )
            session.add(layer)
            session.commit()
            session.refresh(layer)
            layer_id = layer.id

            # --- AUDIT LOGGING ---
            audit_log = AuditLog(
                user_id=1,  # Default to admin
                action="CREATE",
                resource_type="Layer",
                resource_id=str(layer_id),
                details=f"Uploaded {os.path.basename(final_path)}",
                ip_address="127.0.0.1"
            )
            session.add(audit_log)
            session.commit()

            
        return UploadCompleteResponse(
            task_id=upload_id,
            status="completed",
            message=f"File saved as {os.path.basename(final_path)}. Layer registered.",
            layer_id=layer_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
