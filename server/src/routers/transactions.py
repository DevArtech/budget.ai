import pandas as pd
from fastapi import APIRouter

from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/")
def get_all_transactions():
    db = BaseDatabridge.get_instance()
    income = db.query("SELECT id, title, amount, date, category, 'income' as type FROM income ORDER BY date DESC LIMIT 50")
    expenses = db.query("SELECT id, title, amount, date, category, 'expense' as type FROM expenses ORDER BY date DESC LIMIT 50") 
    result = pd.concat([income, expenses], ignore_index=True)
    result = result.sort_values('date', ascending=False)
    return result.to_dict(orient='records')
