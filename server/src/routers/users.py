from fastapi import APIRouter, Depends
from typing import Annotated

from server.src.models import User
from server.src.services.authentication_service import AuthenticationService
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter(prefix="/users", tags=["users"])
auth_service = AuthenticationService()

@router.get("/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
):
    return current_user


@router.put("/me/update-spend-warning/")
async def update_spend_warning(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
    spend_warning: int,
):
    db = BaseDatabridge.get_instance()
    db.execute(
        f"UPDATE users SET spend_warning = {spend_warning} WHERE id = {current_user.id}"
    )
    return {"message": "Spend warning updated successfully"}


@router.put("/me/update-savings-percent/")
async def update_savings_percent(
    current_user: Annotated[User, Depends(auth_service.get_current_active_user)],
    savings_percent: int,
):
    db = BaseDatabridge.get_instance()
    db.execute(
        f"UPDATE users SET savings_percent = {savings_percent} WHERE id = {current_user.id}"
    )
    return {"message": "Savings percent updated successfully"}
