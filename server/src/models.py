from datetime import date
from pydantic import BaseModel
from typing import Optional

class Account(BaseModel):
    name: str
    type: str
    balance: float
    last_updated: date

class Transaction(BaseModel):
    account_id: int
    title: str
    amount: float
    date: date
    category: str

class Expense(Transaction):
    recurrence: Optional[str] = None

class Income(Transaction):
    pass