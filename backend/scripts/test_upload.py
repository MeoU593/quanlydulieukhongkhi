import requests
import os
import time

# Configuration
API_URL = "http://localhost:8000/v1/upload"
FILE_SIZE = 50 * 1024 * 1024  # 50MB dummy file
CHUNK_SIZE = 10 * 1024 * 1024  # 10MB chunks
FILENAME = "test_large_file.tif"

def create_dummy_file():
    print(f"Creating dummy file {FILENAME} ({FILE_SIZE/1024/1024} MB)...")
    with open(FILENAME, "wb") as f:
        f.write(os.urandom(FILE_SIZE))

def test_upload():
    # 1. Init upload
    print("Initializing upload session...")
    init_data = {
        "filename": FILENAME,
        "file_size": FILE_SIZE,
        "region_id": 1,
        "pollutant_code": "CO",
        "year": 2024,
        "period_type": "monthly",
        "period_value": "M01"
    }
    try:
        response = requests.post(f"{API_URL}/init", json=init_data)
        if response.status_code != 200:
            print(f"Init failed: {response.text}")
            return
        
        data = response.json()
        upload_id = data["upload_id"]
        print(f"Upload ID: {upload_id}")
        
    except Exception as e:
        print(f"Connection error: {e}")
        return

    # 2. Upload chunks
    total_chunks = (FILE_SIZE + CHUNK_SIZE - 1) // CHUNK_SIZE
    print(f"Uploading {total_chunks} chunks...")
    
    with open(FILENAME, "rb") as f:
        for i in range(total_chunks):
            chunk_data = f.read(CHUNK_SIZE)
            files = {"file": (FILENAME, chunk_data)}
            data = {
                "chunk_index": i,
                "total_chunks": total_chunks
            }
            
            res = requests.post(f"{API_URL}/{upload_id}/chunk", params={"upload_id": upload_id}, data=data, files=files)
            if res.status_code != 200:
                print(f"Chunk {i} failed: {res.text}")
                return
            print(f"  Chunk {i+1}/{total_chunks} uploaded")

    # 3. Complete upload
    print("Completing upload...")
    res = requests.post(f"{API_URL}/{upload_id}/complete", params={"upload_id": upload_id, "filename": FILENAME})
    if res.status_code == 200:
        print("✅ SUCCESS: File uploaded and assembled!")
        print(res.json())
    else:
        print(f"Completion failed: {res.text}")

    # Cleanup
    if os.path.exists(FILENAME):
        os.remove(FILENAME)

if __name__ == "__main__":
    if not os.path.exists(FILENAME):
        create_dummy_file()
    test_upload()
