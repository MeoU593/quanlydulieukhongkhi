import rasterio
import os

# Đường dẫn file do user cung cấp
file_path = r"d:\phú lê\quanlydulieukhong khi\Chuyen de 2.4-20260122T222814Z-3-001\Chuyen de 2.4\CO_monthly_M1_Conc_LaoCai_2019_1000m.tif"

print(f"Checking file: {file_path}")

if not os.path.exists(file_path):
    print("File not found!")
    exit(1)

try:
    with rasterio.open(file_path) as src:
        print("-" * 30)
        print(f"Driver: {src.driver}")
        print(f"CRS (Coordinate Reference System): {src.crs}")
        print(f"Transform: {src.transform}")
        print(f"Bounds: {src.bounds}")
        print(f"Size: {src.width} x {src.height}")
        print(f"Bands: {src.count}")
        print(f"Nodata value: {src.nodata}")
        
        # Read center pixel value to check data range
        data = src.read(1)
        print(f"Min value: {data.min()}")
        print(f"Max value: {data.max()}")
        print("-" * 30)
        
        if src.crs:
            print("✅ File has embedded CRS.")
        else:
            print("❌ File MISSING CRS (needs .tfw or .prj or manual definition).")
            
except Exception as e:
    print(f"Error reading file: {e}")
