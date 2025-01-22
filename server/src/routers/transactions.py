import pandas as pd
from fastapi import APIRouter, Depends
from typing import Annotated

from server.src.databridge.base_databridge import BaseDatabridge
from server.src.models import UserInDB
from server.src.services.authentication_service import AuthenticationService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/")
async def get_all_transactions(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    db = BaseDatabridge.get_instance()
    income = db.query(
        """
        SELECT i.id, i.title, i.amount, i.date, i.category, 'income' as type 
        FROM income i 
        JOIN accounts a ON i.account_id = a.id 
        WHERE a.user_id = ? 
        ORDER BY date DESC LIMIT 50
    """,
        (current_user.id,),
    )
    expenses = db.query(
        """
        SELECT e.id, e.title, e.amount, e.date, e.category, 'expense' as type 
        FROM expenses e 
        JOIN accounts a ON e.account_id = a.id 
        WHERE a.user_id = ? 
        ORDER BY date DESC LIMIT 50
    """,
        (current_user.id,),
    )
    result = pd.concat([income, expenses], ignore_index=True)
    result = result.sort_values("date", ascending=False)
    return result.to_dict(orient="records")
