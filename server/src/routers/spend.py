from fastapi import APIRouter, Depends
from datetime import date

from server.src.services.spend_service import SpendService

router = APIRouter(prefix="/spend", tags=["spend"])

@router.get("/budget-allotment")
async def get_budget_allotment(spend_service: SpendService = Depends(SpendService)):
    return spend_service.get_budget_allotment()

@router.get("/spend-over-time")
async def get_spend_over_time(start_date: date, end_date: date, spend_service: SpendService = Depends(SpendService)):
    return spend_service.get_spend_over_time(start_date, end_date)

