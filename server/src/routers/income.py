from fastapi import APIRouter

from server.src.models import Income
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter(prefix="/income", tags=["income"])


@router.get("/")
def get_income():
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM income")
    return result.to_dict(orient='records')

@router.get("/{id}") 
def get_income(id: int):
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM income WHERE id = ?", (id,))
    return result.to_dict(orient='records')

@router.post("/")
def create_income(income: Income):
    db = BaseDatabridge.get_instance()
    # Insert the income record
    db.execute("INSERT INTO income (title, amount, date, category, account_id) VALUES (?, ?, ?, ?, ?)", 
               (income.title, income.amount, income.date, income.category, income.account_id))
    
    # Update the account balance
    db.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
               (income.amount, income.account_id))
    
    return {"message": "Income created successfully"}

@router.put("/{id}")
def update_income(id: int, income: Income):
    db = BaseDatabridge.get_instance()
    
    # Get the old income amount
    old_income = db.query("SELECT amount, account_id FROM income WHERE id = ?", (id,))
    old_amount = old_income.iloc[0]['amount']
    old_account_id = old_income.iloc[0]['account_id']
    
    # Update income record
    db.execute("UPDATE income SET title = ?, amount = ?, date = ?, category = ?, account_id = ? WHERE id = ?", 
               (income.title, income.amount, income.date, income.category, income.account_id, id))
    
    # If account changed, update both old and new account balances
    if old_account_id != income.account_id:
        db.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", 
                  (old_amount, old_account_id))
        db.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
                  (income.amount, income.account_id))
    else:
        # Update the account balance with the difference
        difference = income.amount - old_amount
        db.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", 
                  (difference, income.account_id))
    
    return {"message": "Income updated successfully"}

@router.delete("/{id}")
def delete_income(id: int):
    db = BaseDatabridge.get_instance()
    
    # Get the income details before deletion
    income = db.query("SELECT amount, account_id FROM income WHERE id = ?", (id,))
    amount = income.iloc[0]['amount']
    account_id = income.iloc[0]['account_id']
    
    # Delete the income record
    db.execute("DELETE FROM income WHERE id = ?", (id,))
    
    # Update the account balance
    db.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", 
               (amount, account_id))
    
    return {"message": "Income deleted successfully"}