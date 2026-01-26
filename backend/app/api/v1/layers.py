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

router = APIRouter()

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
    query = select(Layer).where(Layer.status == "active")
    
    if region_id:
        query = query.where(Layer.region_id == region_id)
    if year:
        query = query.where(Layer.year == year)
    if period_type:
        query = query.where(Layer.period_type == period_type)
    if pollutant_code:
        # Join with pollutant table to filter by code
        query = query.join(Pollutant).where(Pollutant.code == pollutant_code)
    
    layers = session.exec(query).all()
    
    # Enrich with tile URL
    base_url = str(request.base_url).rstrip("/")
    result_items = []
    for layer in layers:
        layer_read = LayerRead.from_orm(layer)
        layer_read.cog_url = f"{base_url}/api/v1/layers/{layer.id}/tiles/{{z}}/{{x}}/{{y}}"
        result_items.append(layer_read)
    
    return LayerList(items=result_items, total=len(layers))

@router.get("/{layer_id}", response_model=LayerRead)
def get_layer(layer_id: int, request: Request, session: Session = Depends(get_session)):
    """Get layer by ID"""
    layer = session.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
        
    layer_read = LayerRead.from_orm(layer)
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
            img = cog.tile(x, y, z)
            
            # Get statistics for rescaling (approximate from tile itself for speed)
            # For better results, stats should be computed once and stored in DB
            stats = img.statistics()
            min_val = list(stats.values())[0].min
            max_val = list(stats.values())[0].max
            
            # Avoid division by zero
            if max_val == min_val:
                max_val = min_val + 1
            
            # Rescale to 0-255 range for visualization
            img.rescale(in_range=[(min_val, max_val)])
            
            # Apply colormap (viridis)
            # NOTE: render automatically handles alpha band if present. 
            # If nodata not set in tif, we might need to mask it manually.
            content = img.render(img_format="PNG", colormap_name="viridis")
            
            return Response(content, media_type="image/png")
    except Exception as e:
        print(f"Tile error: {e}") # Log error
        raise HTTPException(status_code=500, detail=str(e))
