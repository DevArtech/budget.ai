from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

from server.src.models import Expense, UserInDB
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.services.authentication_service import AuthenticationService
from datetime import date

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/")
async def get_expenses(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT e.* FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE a.user_id = ?",
        (current_user.id,),
    )
    return result.to_dict(orient="records")


@router.get("/fixed-per-month/")
async def get_fixed_per_month(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT SUM(amount) as total_fixed FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE a.user_id = ? AND e.recurrence IS NOT NULL",
        (current_user.id,),
    )
    return result.to_dict(orient="records")[0]["total_fixed"]


@router.get("/{id}/")
async def get_expense(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT e.* FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE e.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not result.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Expense not found")
    return result.to_dict(orient="records")


@router.post("/")
async def create_expense(
    expense: Expense,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Verify the account belongs to the user
    account = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
        (expense.account_id, current_user.id),
    ).to_dict(orient="records")
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Create the expense
    db.execute(
        "INSERT INTO expenses (title, amount, date, category, recurrence, account_id) VALUES (?, ?, ?, ?, ?, ?)",
        (
            expense.title,
            expense.amount,
            expense.date,
            expense.category,
            expense.recurrence,
            expense.account_id,
        ),
    )

    # Update account balance by subtracting the expense amount
    db.execute(
        "UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ? AND user_id = ?",
        (expense.amount, date.today(), expense.account_id, current_user.id),
    )

    return {"message": "Expense created successfully"}


@router.put("/{id}/")
async def update_expense(
    id: int,
    expense: Expense,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Get the original expense amount and verify ownership through account
    original_expense = db.query(
        "SELECT e.amount, e.account_id FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE e.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not original_expense.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Expense not found")

    original_amount = original_expense.to_dict(orient="records")[0]["amount"]
    original_account_id = original_expense.to_dict(orient="records")[0]["account_id"]

    # If changing accounts, verify the new account belongs to the user
    if original_account_id != expense.account_id:
        new_account = db.query(
            "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
            (expense.account_id, current_user.id),
        ).to_dict(orient="records")
        if not new_account:
            raise HTTPException(status_code=404, detail="New account not found")

    # Update the expense
    db.execute(
        "UPDATE expenses SET title = ?, amount = ?, date = ?, category = ?, recurrence = ? WHERE id = ?",
        (
            expense.title,
            expense.amount,
            expense.date,
            expense.category,
            expense.recurrence,
            id,
        ),
    )

    # If account changed, update both old and new account balances
    if original_account_id != expense.account_id:
        # Add back the amount to the original account
        db.execute(
            "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (original_amount, date.today(), original_account_id, current_user.id),
        )
        # Subtract the amount from the new account
        db.execute(
            "UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (expense.amount, date.today(), expense.account_id, current_user.id),
        )
    else:
        # Update the account balance by adjusting the difference
        adjustment = original_amount - expense.amount
        db.execute(
            "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (adjustment, date.today(), expense.account_id, current_user.id),
        )

    return {"message": "Expense updated successfully"}


@router.delete("/{id}/")
async def delete_expense(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Get the expense details before deletion and verify ownership through account
    expense = db.query(
        "SELECT e.amount, e.account_id FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE e.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not expense.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Expense not found")

    amount = expense.to_dict(orient="records")[0]["amount"]
    account_id = expense.to_dict(orient="records")[0]["account_id"]

    # Delete the expense
    db.execute("DELETE FROM expenses WHERE id = ?", (id,))

    # Update account balance by adding back the expense amount
    db.execute(
        "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
        (amount, date.today(), account_id, current_user.id),
    )

    return {"message": "Expense deleted successfully"}
