from fastapi import APIRouter

from server.src.models import Account
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/")
def get_accounts():
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM accounts")
    return result.to_dict(orient='records')

@router.get("/{id}") 
def get_account(id: int):
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM accounts WHERE id = ?", (id,))
    return result.to_dict(orient='records')

@router.get("/{id}/transactions")
def get_account_transactions(id: int):
    db = BaseDatabridge.get_instance()
    expenses = db.query("SELECT *, 'expense' as type FROM expenses WHERE account_id = ?", (id,))
    income = db.query("SELECT *, 'income' as type FROM income WHERE account_id = ?", (id,))
    
    # Convert both results to records and combine them
    transactions = expenses.to_dict(orient='records') + income.to_dict(orient='records')
    return transactions

@router.post("/")
def create_account(account: Account):
    db = BaseDatabridge.get_instance()
    db.execute("INSERT INTO accounts (name, type, balance, last_updated) VALUES (?, ?, ?, ?)", 
               (account.name, account.type, account.balance, account.last_updated))
    return {"message": "Account created successfully"}

@router.put("/{id}")
def update_account(id: int, account: Account):
    db = BaseDatabridge.get_instance()
    db.execute("UPDATE accounts SET name = ?, type = ?, balance = ?, last_updated = ? WHERE id = ?", 
               (account.name, account.type, account.balance, account.last_updated, id))
    return {"message": "Account updated successfully"}

@router.delete("/{id}")
def delete_account(id: int):
    db = BaseDatabridge.get_instance()
    db.execute("DELETE FROM accounts WHERE id = ?", (id,))
    return {"message": "Account deleted successfully"}