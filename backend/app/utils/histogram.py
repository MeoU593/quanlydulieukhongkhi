import rasterio
import numpy as np
import os
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

def calculate_raster_histogram(filepath: str, bins: int = 20) -> List[Dict[str, Any]]:
    """
    Calculates a histogram for the first band of a raster file.
    
    Args:
        filepath (str): Path to the raster file.
        bins (int): Number of histogram bins.
        
    Returns:
        List[Dict[str, Any]]: A list of {bin_start, bin_end, count} objects.
    """
    if not os.path.exists(filepath):
        logger.error(f"File not found for histogram calculation: {filepath}")
        return []

    try:
        with rasterio.open(filepath) as src:
            # Read band 1
            data = src.read(1, masked=True)
            
            # If completely masked or empty
            if data.count() == 0:
                logger.warning(f"{filepath}: No valid data found for histogram.")
                return []
                
            # Filter out NaNs and masked values
            valid_data = data.compressed()
            valid_data = valid_data[~np.isnan(valid_data)]
            
            if len(valid_data) == 0:
                return []

            # Calculate histogram - ensure we handle potentially constant data
            data_min = np.min(valid_data)
            data_max = np.max(valid_data)
            
            if data_min == data_max:
                counts = np.array([len(valid_data)])
                bin_edges = np.array([data_min, data_max + 1.0])
            else:
                counts, bin_edges = np.histogram(valid_data, bins=bins)
            
            # Format results for frontend
            result = []
            for i in range(len(counts)):
                result.append({
                    "bin_start": float(bin_edges[i]),
                    "bin_end": float(bin_edges[i+1]),
                    "count": int(counts[i]),
                    "label": f"{bin_edges[i]:.2f} - {bin_edges[i+1]:.2f}"
                })
            
            return result
            
    except Exception as e:
        logger.error(f"Error calculating histogram for {filepath}: {e}")
        return []
