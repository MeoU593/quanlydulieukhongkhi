import rasterio
import sys

file_path = r"d:\phú lê\quanlydulieukhong khi\Chuyen de 2.4-20260122T222814Z-3-001\Chuyen de 2.4\CO_monthly_M1_Conc_LaoCai_2019_1000m.tif"
output_file = "tiff_analysis.txt"

with open(output_file, "w", encoding="utf-8") as f:
    try:
        with rasterio.open(file_path) as src:
            f.write(f"File: {file_path}\n")
            f.write(f"CRS: {src.crs}\n")
            f.write(f"Bounds: {src.bounds}\n")
            f.write(f"Values: Min={src.read(1).min()}, Max={src.read(1).max()}\n")
            if src.crs:
                f.write("STATUS: OK (GeoTIFF)\n")
            else:
                f.write("STATUS: MISSING_CRS (Requires .tfw/.prj)\n")
    except Exception as e:
        f.write(f"ERROR: {e}\n")
