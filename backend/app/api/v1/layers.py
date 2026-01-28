from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import Response
from sqlmodel import Session, select, func
from typing import Optional
from app.db.session import get_session
from app.models.layer import Layer
from app.models.pollutant import Pollutant
from app.schemas.layer import LayerRead, LayerList
from titiler.core.factory import TilerFactory
from rio_tiler.io import COGReader
from rio_tiler.profiles import img_profiles
from rio_tiler.errors import TileOutsideBounds
from app.utils.histogram import calculate_raster_histogram
import numpy as np
import io
from PIL import Image

router = APIRouter()

# Helper for transparent tile
def get_transparent_tile():
    buf = io.BytesIO()
    Image.new('RGBA', (1, 1), (0, 0, 0, 0)).save(buf, format='PNG')
    return Response(buf.getvalue(), media_type="image/png")

@router.get("/", response_model=LayerList)
def get_layers(
    request: Request,
    region_id: Optional[int] = Query(None),
    pollutant_code: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    period_type: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """Get filtered list of layers"""
    # Join with Pollutant to get code but select Layer
    query = select(Layer, Pollutant).where(Layer.status == "active").join(Pollutant, Layer.pollutant_id == Pollutant.id)
    
    if region_id:
        query = query.where(Layer.region_id == region_id)
    if year:
        query = query.where(Layer.year == year)
    if period_type:
        query = query.where(Layer.period_type == period_type)
    if pollutant_code:
        query = query.where(Pollutant.code == pollutant_code)
    
    results = session.exec(query).all()
    
    # Enrich with tile URL and pollutant code
    base_url = str(request.base_url).rstrip("/")
    result_items = []
    
    # results is list of (Layer, Pollutant) tuples because of select(Layer, Pollutant)
    for layer, pollutant in results:
        layer_read = LayerRead.from_orm(layer)
        layer_read.pollutant_code = pollutant.code
        layer_read.pollutant_unit = pollutant.unit
        layer_read.cog_url = f"{base_url}/api/v1/layers/{layer.id}/tiles/{{z}}/{{x}}/{{y}}"
        result_items.append(layer_read)
    
    return LayerList(items=result_items, total=len(results))

@router.get("/{layer_id}", response_model=LayerRead)
def get_layer(layer_id: int, request: Request, session: Session = Depends(get_session)):
    """Get layer by ID"""
    layer = session.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
        
    layer_read = LayerRead.from_orm(layer)
    # Get pollutant unit/code
    from app.models.pollutant import Pollutant
    pollutant = session.get(Pollutant, layer.pollutant_id)
    if pollutant:
        layer_read.pollutant_code = pollutant.code
        layer_read.pollutant_unit = pollutant.unit
        
    base_url = str(request.base_url).rstrip("/")
    layer_read.cog_url = f"{base_url}/api/v1/layers/{layer.id}/tiles/{{z}}/{{x}}/{{y}}"
    
    return layer_read

@router.get("/{layer_id}/tiles/{z}/{x}/{y}")
def tile(
    layer_id: int,
    z: int,
    x: int,
    y: int,
    session: Session = Depends(get_session)
):
    """Serve tiles from layer"""
    layer = session.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    
    try:
        with COGReader(layer.filepath) as cog:
            # Read tile data
            try:
                img = cog.tile(x, y, z)
            except TileOutsideBounds:
                return get_transparent_tile()
            
            # If the tile exists but is empty (all transparent), return transparent PNG
            # img.mask is 0 for transparent, 255 for opaque. 
            # If max is 0, nothing is opaque.
            if img.mask.max() == 0:
                 return get_transparent_tile()
            
            # Simple stats from the tile for rescaling
            stats = img.statistics()
            min_val = list(stats.values())[0].min
            max_val = list(stats.values())[0].max
            
            # Avoid division by zero
            if max_val == min_val:
                max_val = min_val + 1.0
            
            # Rescale the image for visualization
            img.rescale(in_range=[(min_val, max_val)])
            
            # Apply colormap (viridis)
            content = img.render(img_format="PNG", colormap_name="viridis")
            
            return Response(content, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Tile error: {e}") # Log error
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{layer_id}/histogram")
def get_layer_histogram(layer_id: int, session: Session = Depends(get_session)):
    """Get histogram data for a layer"""
    try:
        layer = session.get(Layer, layer_id)
        if not layer:
            raise HTTPException(status_code=404, detail="Layer not found")
        
        if not layer.filepath:
            return {"items": []}

        histogram = calculate_raster_histogram(layer.filepath)
        return {"items": histogram}
    except Exception as e:
        print(f"Histogram error for layer {layer_id}: {e}")
        return {"items": [], "error": str(e)}

@router.delete("/{layer_id}", status_code=204)
def delete_layer(
    layer_id: int,
    session: Session = Depends(get_session)
    # user: User = Depends(get_current_active_superuser) # TODO: Restricted access?
):
    """Delete a layer and its associated file"""
    layer = session.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    
    # Delete file from disk
    import os
    if layer.filepath and os.path.exists(layer.filepath):
        try:
            os.remove(layer.filepath)
        except OSError as e:
            print(f"Error removing file {layer.filepath}: {e}")
            # We continue to delete the record even if file deletion fails, 
            # or maybe we should error out? For now, log and proceed.

    session.delete(layer)
    session.commit()
    return None
