---
inclusion: always
---

# Coding Standards - Interview AI

## General Principles

1. **Write Clean, Readable Code**: Code should be self-documenting
2. **Follow DRY**: Don't Repeat Yourself
3. **KISS**: Keep It Simple, Stupid
4. **Security First**: Always validate inputs and handle errors properly
5. **Type Safety**: Use type hints in Python, PropTypes or TypeScript concepts in React

## Python (Backend) Standards

### Code Style
- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Use snake_case for functions and variables
- Use PascalCase for classes

### Type Hints
```python
def create_user(email: str, password: str) -> dict:
    """Always use type hints for function parameters and return values"""
    pass
```

### Error Handling
```python
# Always use specific exceptions
try:
    user = firebase_auth.create_user(email, password)
except firebase_auth.EmailAlreadyExistsError:
    raise HTTPException(status_code=400, detail="Email already exists")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Logging
```python
import logging
logger = logging.getLogger(__name__)

# Use appropriate log levels
logger.debug("Detailed information for debugging")
logger.info("General information about application flow")
logger.warning("Warning about potential issues")
logger.error("Error that needs attention")
```

### FastAPI Endpoints
```python
@router.post("/endpoint", response_model=ResponseModel, status_code=status.HTTP_201_CREATED)
async def endpoint_name(
    data: RequestModel,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Clear docstring explaining what the endpoint does.
    
    Args:
        data: Description of the request data
        current_user: Authenticated user (injected by dependency)
    
    Returns:
        Description of the response
    """
    pass
```

## JavaScript/React (Frontend) Standards

### Code Style
- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for components
- Use UPPER_SNAKE_CASE for constants

### Component Structure
```jsx
// 1. Imports
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// 2. Component definition
export default function ComponentName() {
  // 3. Hooks
  const [state, setState] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies])
  
  // 5. Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    // Handler logic
  }
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### State Management (Zustand)
```javascript
// Keep stores focused and organized
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      
      // Actions
      login: async (email, password) => {
        // Action logic
        set({ user, token })
      },
      
      logout: () => {
        set({ user: null, token: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
)
```

### Error Handling
```javascript
try {
  const response = await api.post('/endpoint', data)
  // Handle success
} catch (error) {
  const errorMessage = error.response?.data?.detail || error.message || 'Operation failed'
  setError(errorMessage)
  // Show user-friendly error
}
```

### API Calls
```javascript
// Use the configured axios instance
import api from '../services/api'

// API calls should be in try-catch blocks
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint')
    return response.data
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw error
  }
}
```

## Firebase Integration

### Authentication
```python
# Backend: Always verify tokens
from src.auth.security import get_current_user_firebase

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user_firebase)):
    # User is authenticated
    pass
```

```javascript
// Frontend: Use Firebase SDK for auth operations
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase'

const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await userCredential.user.getIdToken()
  // Send idToken to backend
}
```

### Firestore Operations
```python
# Always use the Collections enum
from src.db.firebase_client import get_db, Collections

db = get_db()
user_ref = db.collection(Collections.USERS).document(user_id)
user_doc = user_ref.get()

if user_doc.exists:
    user_data = user_doc.to_dict()
```

## Security Best Practices

1. **Never Log Sensitive Data**: No passwords, tokens, or PII in logs
2. **Validate All Inputs**: Use Pydantic models for validation
3. **Use Environment Variables**: Never hardcode secrets
4. **Sanitize User Input**: Prevent injection attacks
5. **Rate Limiting**: Implement for production endpoints
6. **HTTPS Only**: In production, enforce HTTPS

## Git Commit Messages

Follow conventional commits:
```
feat: add user profile page
fix: resolve login token expiration issue
docs: update Firebase setup guide
refactor: simplify authentication flow
test: add tests for session engine
chore: update dependencies
```

## Documentation

### Code Comments
- Use docstrings for all functions and classes
- Comment complex logic, not obvious code
- Keep comments up-to-date with code changes

### API Documentation
- FastAPI auto-generates docs, but add clear descriptions
- Document all request/response models
- Include example payloads

## Testing Guidelines

### Backend Tests
```python
import pytest
from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 201
```

### Frontend Tests
- Test user interactions, not implementation details
- Mock API calls
- Test error states

## Performance Considerations

1. **Lazy Loading**: Load components and data as needed
2. **Memoization**: Use React.memo for expensive components
3. **Database Queries**: Minimize Firestore reads
4. **Caching**: Cache frequently accessed data
5. **Bundle Size**: Keep client bundle small

## Accessibility

1. Use semantic HTML elements
2. Add ARIA labels where needed
3. Ensure keyboard navigation works
4. Maintain color contrast ratios
5. Test with screen readers
