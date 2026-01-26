import requests
import sys

BASE_URL = "http://localhost:8000/v1"

def test_login():
    print("Testing Login...")
    
    # 1. Login
    payload = {
        "username": "admin",
        "password": "Admin123!"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Login Successful!")
            print(f"  Access Token: {data['access_token'][:20]}...")
            print(f"  Token Type: {data['token_type']}")
            return data['access_token']
        else:
            print(f"❌ Login Failed: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

if __name__ == "__main__":
    test_login()
