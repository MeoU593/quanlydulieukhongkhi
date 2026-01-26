import requests
import json

# Test auth endpoint
url = "http://localhost:8000/api/v1/auth/login"
data = {"username": "admin", "password": "admin123"}

print(f"Testing POST {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test regions endpoint
print("\n" + "="*50)
url2 = "http://localhost:8000/api/v1/regions"
print(f"Testing GET {url2}")
try:
    response2 = requests.get(url2)
    print(f"Status Code: {response2.status_code}")
    print(f"Response: {response2.text}")
except Exception as e:
    print(f"Error: {e}")
