from fastapi import APIRouter, Depends, status, HTTPException
from datetime import timedelta
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm

from server.src.models import Token, User, NewUser
from server.src.services.authentication_service import AuthenticationService
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter()
auth_service = AuthenticationService()


@router.post("/token/")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/signup/")
async def signup(user: NewUser):
    user = auth_service.create_user(user)
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
