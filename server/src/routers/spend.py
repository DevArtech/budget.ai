from fastapi import APIRouter, Depends
from datetime import date
from typing import Annotated

from server.src.services.spend_service import SpendService
from server.src.models import UserInDB
from server.src.services.authentication_service import AuthenticationService

router = APIRouter(prefix="/spend", tags=["spend"])

@router.get("/budget-allotment")
async def get_budget_allotment(
    current_user: Annotated[UserInDB, Depends(AuthenticationService.get_current_active_user)],
    spend_service: SpendService = Depends(SpendService)
):
    return spend_service.get_budget_allotment(current_user)

@router.get("/spend-over-time")
async def get_spend_over_time(
    start_date: date, 
    end_date: date, 
    current_user: Annotated[UserInDB, Depends(AuthenticationService.get_current_active_user)],
    spend_service: SpendService = Depends(SpendService)
):
    return spend_service.get_spend_over_time(current_user, start_date, end_date)

