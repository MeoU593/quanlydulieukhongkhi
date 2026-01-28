import rasterio
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

def calculate_raster_stats(filepath: str):
    """
    Calculates min, max, and mean values for the first band of a raster file.
    
    Args:
        filepath (str): Path to the raster file.
        
    Returns:
        tuple: (min_val, max_val, mean_val) or (None, None, None) if failed/empty.
    """
    if not os.path.exists(filepath):
        logger.error(f"File not found for stats calculation: {filepath}")
        return None, None, None

    try:
        with rasterio.open(filepath) as src:
            # Read band 1
            data = src.read(1, masked=True)
            
            # If completely masked or empty
            if data.count() == 0:
                logger.warning(f"{filepath}: No valid data found (all masked).")
                return None, None, None
                
            # Calculate stats
            # Convert to float to avoid numpy types in DB
            # Use nan-safe functions to ignore NaNs at the edges
            # Convert to standard python float for SQLModel compatibility
            min_val = float(np.nanmin(data))
            max_val = float(np.nanmax(data))
            mean_val = float(np.nanmean(data))
            
            # Check if everything is NaN
            if np.isnan(min_val):
                logger.warning(f"{filepath}: All pixels are NaN or Nodata")
                return None, None, None
            
            return min_val, max_val, mean_val
            
    except Exception as e:
        logger.error(f"Error calculating stats for {filepath}: {e}")
        return None, None, None
