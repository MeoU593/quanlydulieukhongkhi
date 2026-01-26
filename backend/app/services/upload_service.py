import os
import uuid
import shutil
from datetime import datetime, timedelta
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class UploadService:
    def __init__(self):
        self.upload_dir = os.path.join(settings.DATA_PATH, "temp_uploads")
        os.makedirs(self.upload_dir, exist_ok=True)

    def init_upload(self, filename: str, metadata: dict = None) -> str:
        upload_id = str(uuid.uuid4())
        upload_path = os.path.join(self.upload_dir, upload_id)
        os.makedirs(upload_path, exist_ok=True)
        
        # Save metadata if provided
        if metadata:
            import json
            meta_path = os.path.join(upload_path, "metadata.json")
            with open(meta_path, "w") as f:
                json.dump(metadata, f)
                
        return upload_id

    async def save_chunk(self, upload_id: str, chunk_index: int, filename: str, chunk_file: UploadFile) -> str:
        upload_path = os.path.join(self.upload_dir, upload_id)
        if not os.path.exists(upload_path):
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        # Use a safe filename to prevent directory traversal
        safe_filename = os.path.basename(filename)
        chunk_name = f"{safe_filename}.part{chunk_index}"
        file_path = os.path.join(upload_path, chunk_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(chunk_file.file, buffer)
            
        return file_path

    def process_session(self, upload_id: str) -> tuple[str, dict]:
        """
        Assembles all files in the session, fixes georeferencing if needed,
        and returns the path to the main GeoTIFF and metadata.
        """
        upload_path = os.path.join(self.upload_dir, upload_id)
        if not os.path.exists(upload_path):
            raise ValueError("Upload session not found")

        # 1. Identify all unique files being uploaded
        # Files are named: {filename}.part{index}
        try:
            files_map = {} # filename -> [part0, part1, ...]
            all_parts = sorted(os.listdir(upload_path))
            
            for part in all_parts:
                if part == "metadata.json": continue
                if ".part" not in part: continue
                
                # Split at the last occurrence of .part
                filename, _ = part.rsplit(".part", 1)
                if filename not in files_map:
                    files_map[filename] = []
                files_map[filename].append(part)

            if not files_map:
                raise ValueError("No file chunks found")

            # 2. Assemble each file
            assembled_files = []
            for filename, parts in files_map.items():
                dest_path = os.path.join(upload_path, filename)
                # Sort parts by index (part0, part1, ...)
                # Assuming index is integer after "part"
                parts.sort(key=lambda x: int(x.rsplit(".part", 1)[1]))
                
                with open(dest_path, "wb") as outfile:
                    for part in parts:
                        part_path = os.path.join(upload_path, part)
                        with open(part_path, "rb") as infile:
                            outfile.write(infile.read())
                        # os.remove(part_path) # Optional: remove parts to save space
                
                assembled_files.append(filename)

            # 3. Smart Processing (Geo-Fixing)
            # Find the main .tif file
            tif_file = next((f for f in assembled_files if f.lower().endswith(('.tif', '.tiff'))), None)
            if not tif_file:
                raise ValueError("No GeoTIFF file found in upload")

            main_tif_path = os.path.join(upload_path, tif_file)
            
            # Check for sidecar files (.tfw, .aux.xml)
            import rasterio
            
            # Attempt to fix/merge if sidecars exist
            # Rasterio automatically looks for .tfw if it's in the same folder.
            # But we want to ensure we "burn" the CRS/transform into the file 
            # so it's a standalone GeoTIFF moving forward.
            
            output_filename = f"{upload_id}.tif"
            dest_dir = os.path.join(settings.DATA_PATH, "raw")
            os.makedirs(dest_dir, exist_ok=True)
            final_path = os.path.join(dest_dir, output_filename)

            with rasterio.open(main_tif_path) as src:
                # Copy profile
                profile = src.profile.copy()
                
                # Check if we need to fix CRS
                if not src.crs:
                    print(f"Refining GeoTIFF: {tif_file} missing CRS. Attempting to fix...")
                    # Assume WGS84 if missing
                    # Future improvement: Allow passing EPSG in metadata
                    profile.update(crs=rasterio.crs.CRS.from_epsg(4326))
                
                # Ensure driver is GTiff
                profile.update(driver='GTiff')
                
                with rasterio.open(final_path, 'w', **profile) as dst:
                    dst.write(src.read())

            # 4. Get metadata
            metadata = {}
            meta_path = os.path.join(upload_path, "metadata.json")
            if os.path.exists(meta_path):
                import json
                with open(meta_path, "r") as f:
                    metadata = json.load(f)

            # Cleanup temp
            shutil.rmtree(upload_path)
            
            return final_path, metadata

        except Exception as e:
            # Don't delete temp immediately for debugging if needed, or do.
            # shutil.rmtree(upload_path) 
            raise e

upload_service = UploadService()
