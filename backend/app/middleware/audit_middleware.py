from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlmodel import Session
from app.models.audit_log import AuditLog
from app.db.session import SessionLocal
import json
from datetime import datetime

class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log user actions to audit_logs table
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip audit for certain paths
        skip_paths = ["/docs", "/openapi.json", "/redoc", "/health"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Get user info from request state (set by auth dependency)
        user_id = None
        if hasattr(request.state, "user"):
            user_id = request.state.user.id
        
        # Process request
        response = await call_next(request)
        
        # Only log write operations (POST, PUT, DELETE) and successful responses
        if request.method in ["POST", "PUT", "DELETE"] and response.status_code < 400:
            try:
                # Determine action and resource
                action = self._get_action(request.method)
                resource_type, resource_id = self._parse_resource(request.url.path)
                
                # Get client IP
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                
                # Create audit log
                session = SessionLocal()
                try:
                    audit_log = AuditLog(
                        user_id=user_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        details=json.dumps({
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": response.status_code
                        }),
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    session.add(audit_log)
                    session.commit()
                finally:
                    session.close()
            except Exception as e:
                # Don't fail the request if audit logging fails
                print(f"Audit logging error: {e}")
        
        return response
    
    def _get_action(self, method: str) -> str:
        """Map HTTP method to action"""
        mapping = {
            "POST": "CREATE",
            "PUT": "UPDATE",
            "DELETE": "DELETE",
            "PATCH": "UPDATE"
        }
        return mapping.get(method, method)
    
    def _parse_resource(self, path: str) -> tuple[str, str]:
        """Extract resource type and ID from path"""
        # Example: /api/v1/users/123 -> ("user", "123")
        parts = [p for p in path.split("/") if p]
        
        resource_type = None
        resource_id = None
        
        if len(parts) >= 3:
            resource_type = parts[2]  # Assuming /api/v1/{resource}
            if len(parts) >= 4:
                resource_id = parts[3]
        
        return resource_type, resource_id
