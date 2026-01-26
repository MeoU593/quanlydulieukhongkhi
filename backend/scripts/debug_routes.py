"""
Debug script to check if FastAPI app loads routes correctly
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("1. Importing FastAPI app...")
    from app.main import app
    print("   ✓ App imported successfully")
    
    print("\n2. Checking app routes...")
    routes = [(r.path, list(r.methods) if hasattr(r, 'methods') else 'N/A') for r in app.routes]
    print(f"   Total routes: {len(routes)}")
    
    print("\n3. Looking for /api/v1/auth/login...")
    auth_routes = [r for r in routes if 'auth' in r[0].lower()]
    if auth_routes:
        print(f"   ✓ Found auth routes: {auth_routes}")
    else:
        print("   ✗ No auth routes found!")
    
    print("\n4. All routes:")
    for path, methods in routes:
        print(f"   {methods:20} {path}")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
