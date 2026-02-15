"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status

from db.firebase import get_db
from db.models_firebase import User
from schemas.auth import UserRegister, UserLogin, Token, UserResponse
from core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_db()
    
    # Check if user exists
    users_ref = db.collection('users')
    existing = users_ref.where('email', '==', user_data.email).limit(1).get()
    
    if len(list(existing)) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_ref = users_ref.document()
    user = User(
        id=user_ref.id,
        email=user_data.email,
        hashed_password=hashed_password
    )
    user_ref.set(user.to_dict())
    
    return UserResponse(id=user_ref.id, email=user.email)


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    db = get_db()
    
    # Find user
    users_ref = db.collection('users')
    users = users_ref.where('email', '==', user_data.email).limit(1).get()
    users_list = list(users)
    
    if not users_list:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_doc = users_list[0]
    user_data_dict = user_doc.to_dict()
    
    if not verify_password(user_data.password, user_data_dict['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc.id})
    return {"access_token": access_token, "token_type": "bearer"}
