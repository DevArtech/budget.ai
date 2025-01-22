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

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class NewUser(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class User(BaseModel):
    id: int
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None

class UserInDB(User):
    hashed_password: str
