---
inclusion: fileMatch
fileMatchPattern: "**/routes*.{py,js,jsx}"
---

# API Development Guide

## API Structure

All API endpoints are versioned and prefixed with `/api/v1`.

### Backend Route Organization

```
server/src/
├── auth/routes.py          # Authentication endpoints
├── session_engine/routes.py # Interview session endpoints
├── analytics/routes.py     # Analytics and reporting
└── profile/routes.py       # User profile management
```

## Creating New Endpoints

### 1. Define Request/Response Models

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class CreateSessionRequest(BaseModel):
    difficulty: str = Field(..., regex="^(easy|medium|hard)$")
    focus_area: str
    duration_minutes: int = Field(default=30, ge=15, le=120)

class SessionResponse(BaseModel):
    id: str
    user_id: str
    status: str
    difficulty: str
    started_at: datetime
```

### 2. Create Route Handler

```python
from fastapi import APIRouter, Depends, HTTPException, status
from src.auth.security import get_current_user_firebase
from src.db.models import User

router = APIRouter()

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: CreateSessionRequest,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Create a new interview session.
    
    Args:
        data: Session configuration
        current_user: Authenticated user
    
    Returns:
        Created session details
    """
    # Implementation
    pass
```

### 3. Register Router in main.py

```python
from src.session_engine.routes import router as sessions_router

app.include_router(
    sessions_router,
    prefix="/api/v1/sessions",
    tags=["sessions"]
)
```

## Authentication

### Protected Endpoints

All endpoints except registration and login require authentication:

```python
from src.auth.security import get_current_user_firebase

@router.get("/protected")
async def protected_endpoint(
    current_user: User = Depends(get_current_user_firebase)
):
    # current_user is automatically populated
    return {"user_id": current_user.id}
```

### Optional Authentication

```python
from typing import Optional
from src.auth.security import get_current_user_firebase

@router.get("/public")
async def public_endpoint(
    current_user: Optional[User] = Depends(get_current_user_firebase)
):
    if current_user:
        # Authenticated user
        pass
    else:
        # Anonymous user
        pass
```

## Error Handling

### Standard HTTP Exceptions

```python
from fastapi import HTTPException, status

# 400 Bad Request
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid input data"
)

# 401 Unauthorized
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication required"
)

# 403 Forbidden
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient permissions"
)

# 404 Not Found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)

# 500 Internal Server Error
raise HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Internal server error"
)
```

### Custom Error Responses

```python
from fastapi.responses import JSONResponse

@router.get("/custom-error")
async def custom_error():
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": [
                {"field": "email", "message": "Invalid format"}
            ]
        }
    )
```

## Request Validation

### Using Pydantic Models

```python
from pydantic import BaseModel, validator, Field
from typing import List

class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    experience_level: str
    target_roles: List[str] = Field(default_factory=list)
    
    @validator('experience_level')
    def validate_experience(cls, v):
        allowed = ['junior', 'mid', 'senior', 'lead']
        if v not in allowed:
            raise ValueError(f'Must be one of: {allowed}')
        return v
```

### Query Parameters

```python
from typing import Optional

@router.get("/sessions")
async def list_sessions(
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user_firebase)
):
    # Filter by status if provided
    pass
```

### Path Parameters

```python
@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    # Fetch session by ID
    pass
```

## Response Formatting

### Success Responses

```python
# Simple data
return {"message": "Success", "data": result}

# List with pagination
return {
    "items": sessions,
    "total": total_count,
    "limit": limit,
    "offset": offset
}

# Created resource
return SessionResponse(
    id=session_id,
    user_id=user_id,
    status="active",
    # ...
)
```

### Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Database Operations

### Creating Documents

```python
from src.db.firebase_client import get_db, Collections
from datetime import datetime

db = get_db()

session_data = {
    "user_id": current_user.id,
    "status": "active",
    "created_at": datetime.utcnow(),
    "difficulty": data.difficulty
}

session_ref = db.collection(Collections.SESSIONS).document()
session_ref.set(session_data)

return {"id": session_ref.id, **session_data}
```

### Reading Documents

```python
# Get single document
session_ref = db.collection(Collections.SESSIONS).document(session_id)
session_doc = session_ref.get()

if not session_doc.exists:
    raise HTTPException(status_code=404, detail="Session not found")

session_data = session_doc.to_dict()
```

### Updating Documents

```python
# Update specific fields
session_ref.update({
    "status": "completed",
    "completed_at": datetime.utcnow()
})

# Set with merge
session_ref.set({
    "status": "completed"
}, merge=True)
```

### Querying Collections

```python
# Simple query
sessions = db.collection(Collections.SESSIONS)\
    .where("user_id", "==", current_user.id)\
    .where("status", "==", "active")\
    .get()

# With ordering and limit
sessions = db.collection(Collections.SESSIONS)\
    .where("user_id", "==", current_user.id)\
    .order_by("created_at", direction="DESCENDING")\
    .limit(10)\
    .get()

# Convert to list
session_list = [
    {"id": doc.id, **doc.to_dict()}
    for doc in sessions
]
```

### Deleting Documents

```python
session_ref = db.collection(Collections.SESSIONS).document(session_id)
session_ref.delete()
```

## File Uploads

### Handling Audio Files

```python
from fastapi import File, UploadFile

@router.post("/sessions/{session_id}/audio")
async def upload_audio(
    session_id: str,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user_firebase)
):
    # Validate file type
    if audio.content_type not in ["audio/wav", "audio/mp3", "audio/webm"]:
        raise HTTPException(400, "Invalid audio format")
    
    # Validate file size (25MB max)
    contents = await audio.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(400, "File too large")
    
    # Process audio
    # Save to Firebase Storage or process directly
    
    return {"message": "Audio uploaded successfully"}
```

## Background Tasks

### Using FastAPI Background Tasks

```python
from fastapi import BackgroundTasks

def send_email_notification(email: str, message: str):
    # Send email logic
    pass

@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_firebase)
):
    # Complete session
    
    # Schedule background task
    background_tasks.add_task(
        send_email_notification,
        current_user.email,
        "Session completed"
    )
    
    return {"message": "Session completed"}
```

## API Documentation

### Adding Descriptions

```python
@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create interview session",
    description="Creates a new interview session with specified difficulty and focus area",
    response_description="Created session details"
)
async def create_session(data: CreateSessionRequest):
    pass
```

### Adding Examples

```python
class CreateSessionRequest(BaseModel):
    difficulty: str
    focus_area: str
    
    class Config:
        schema_extra = {
            "example": {
                "difficulty": "medium",
                "focus_area": "algorithms",
                "duration_minutes": 30
            }
        }
```

## Testing Endpoints

### Using FastAPI TestClient

```python
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_create_session():
    response = client.post(
        "/api/v1/sessions",
        json={
            "difficulty": "medium",
            "focus_area": "algorithms"
        },
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 201
    assert "id" in response.json()
```

### Manual Testing

Use FastAPI's interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Best Practices

1. **Always validate inputs** using Pydantic models
2. **Use appropriate HTTP status codes**
3. **Include authentication** for protected endpoints
4. **Log errors** with context for debugging
5. **Return consistent response formats**
6. **Document all endpoints** with docstrings
7. **Handle edge cases** gracefully
8. **Validate ownership** before modifying resources
9. **Use transactions** for atomic operations
10. **Implement rate limiting** for production
