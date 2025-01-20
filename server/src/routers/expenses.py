from fastapi import APIRouter

from server.src.models import Expense
from server.src.databridge.base_databridge import BaseDatabridge
from datetime import date

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/")
def get_expenses():
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM expenses")
    return result.to_dict(orient='records')

@router.get("/fixed-per-month")
def get_fixed_per_month():
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT SUM(amount) as total_fixed FROM expenses WHERE recurrence IS NOT NULL")
    return result.to_dict(orient='records')[0]['total_fixed']

@router.get("/{id}") 
def get_expense(id: int):
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM expenses WHERE id = ?", (id,))
    return result.to_dict(orient='records')

@router.post("/")
def create_expense(expense: Expense):
    db = BaseDatabridge.get_instance()
    
    # Create the expense
    db.execute("INSERT INTO expenses (title, amount, date, category, recurrence, account_id) VALUES (?, ?, ?, ?, ?, ?)", 
               (expense.title, expense.amount, expense.date, expense.category, expense.recurrence, expense.account_id))
    
    # Update account balance by subtracting the expense amount
    db.execute("UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ?",
               (expense.amount, date.today(), expense.account_id))
               
    return {"message": "Expense created successfully"}

@router.put("/{id}")
def update_expense(id: int, expense: Expense):
    db = BaseDatabridge.get_instance()
    
    # Get the original expense amount
    original_expense = db.query("SELECT amount, account_id FROM expenses WHERE id = ?", (id,))
    original_amount = original_expense.to_dict(orient='records')[0]['amount']
    original_account_id = original_expense.to_dict(orient='records')[0]['account_id']
    
    # Update the expense
    db.execute("UPDATE expenses SET title = ?, amount = ?, date = ?, category = ?, recurrence = ? WHERE id = ?", 
               (expense.title, expense.amount, expense.date, expense.category, expense.recurrence, id))
    
    # If account changed, update both old and new account balances
    if original_account_id != expense.account_id:
        # Add back the amount to the original account
        db.execute("UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ?",
                  (original_amount, date.today(), original_account_id))
        # Subtract the amount from the new account
        db.execute("UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ?",
                  (expense.amount, date.today(), expense.account_id))
    else:
        # Update the account balance by adjusting the difference
        adjustment = original_amount - expense.amount
        db.execute("UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ?",
                  (adjustment, date.today(), expense.account_id))
    
    return {"message": "Expense updated successfully"}

@router.delete("/{id}")
def delete_expense(id: int):
    db = BaseDatabridge.get_instance()
    
    # Get the expense details before deletion
    expense = db.query("SELECT amount, account_id FROM expenses WHERE id = ?", (id,))
    amount = expense.to_dict(orient='records')[0]['amount']
    account_id = expense.to_dict(orient='records')[0]['account_id']
    
    # Delete the expense
    db.execute("DELETE FROM expenses WHERE id = ?", (id,))
    
    # Update account balance by adding back the expense amount
    db.execute("UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ?",
               (amount, date.today(), account_id))
               
    return {"message": "Expense deleted successfully"}