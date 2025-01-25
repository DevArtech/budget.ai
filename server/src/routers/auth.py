from fastapi import APIRouter, Depends, status, HTTPException
from datetime import timedelta
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm

from server.src.models import Token, User, NewUser
from server.src.services.authentication_service import AuthenticationService
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter()
auth_service = AuthenticationService()


@router.post("/token")
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


@router.post("/signup")
async def signup(user: NewUser):
    user = auth_service.create_user(user)
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
):
    return current_user


@router.put("/users/me/update-spend-warning")
async def update_spend_warning(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
    spend_warning: int,
):
    db = BaseDatabridge.get_instance()
    db.execute(
        f"UPDATE users SET spend_warning = {spend_warning} WHERE id = {current_user.id}"
    )
    return {"message": "Spend warning updated successfully"}


@router.put("/users/me/update-savings-percent")
async def update_savings_percent(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
    savings_percent: int,
):
    db = BaseDatabridge.get_instance()
    db.execute(
        f"UPDATE users SET savings_percent = {savings_percent} WHERE id = {current_user.id}"
    )
    return {"message": "Savings percent updated successfully"}
