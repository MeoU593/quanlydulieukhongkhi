import rasterio
import os

# Đường dẫn file gốc của user
input_path = r"d:\phú lê\quanlydulieukhong khi\Chuyen de 2.4-20260122T222814Z-3-001\Chuyen de 2.4\CO_monthly_M1_Conc_LaoCai_2019_1000m.tif"
output_path = input_path.replace(".tif", "_fixed.tif")

print(f"Processing: {input_path}")

try:
    with rasterio.open(input_path) as src:
        # Copy profile từ file gốc
        profile = src.profile.copy()
        
        # Kiểm tra CRS và Transform
        crs = src.crs
        transform = src.transform
        
        print(f"Original CRS: {crs}")
        print(f"Original Transform: {transform}")
        
        if not crs:
            print("Warning: CRS not found! Assuming WGS84 (EPSG:4326)...")
            crs = rasterio.crs.CRS.from_epsg(4326)
            profile.update(crs=crs)
            
        # Update driver to ensure GeoTIFF
        profile.update(driver='GTiff')
        
        print(f"Writing to: {output_path}")
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(src.read())
            
        print("✅ Fixed file created successfully!")
        print("👉 Please upload the '_fixed.tif' file to the website.")
        
except Exception as e:
    print(f"❌ Error: {e}")
