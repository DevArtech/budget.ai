from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from datetime import date

from server.src.models import Income, UserInDB
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.services.authentication_service import AuthenticationService

router = APIRouter(prefix="/income", tags=["income"])


@router.get("/")
async def get_income(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT i.* FROM income i JOIN accounts a ON i.account_id = a.id WHERE a.user_id = ?",
        (current_user.id,),
    )
    return result.to_dict(orient="records")


@router.get("/{id}/")
async def get_income(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT i.* FROM income i JOIN accounts a ON i.account_id = a.id WHERE i.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not result.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Income not found")
    return result.to_dict(orient="records")


@router.post("/")
async def create_income(
    income: Income,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Verify the account belongs to the user
    account = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
        (income.account_id, current_user.id),
    ).to_dict(orient="records")
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Insert the income record
    db.execute(
        "INSERT INTO income (title, amount, date, category, account_id) VALUES (?, ?, ?, ?, ?)",
        (income.title, income.amount, income.date, income.category, income.account_id),
    )

    # Update the account balance
    db.execute(
        "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
        (income.amount, date.today(), income.account_id, current_user.id),
    )

    return {"message": "Income created successfully"}


@router.put("/{id}/")
async def update_income(
    id: int,
    income: Income,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Get the old income amount and verify ownership through account
    old_income = db.query(
        "SELECT i.amount, i.account_id FROM income i JOIN accounts a ON i.account_id = a.id WHERE i.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not old_income.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Income not found")

    old_amount = old_income.to_dict(orient="records")[0]["amount"]
    old_account_id = old_income.to_dict(orient="records")[0]["account_id"]

    # If changing accounts, verify the new account belongs to the user
    if old_account_id != income.account_id:
        new_account = db.query(
            "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
            (income.account_id, current_user.id),
        ).to_dict(orient="records")
        if not new_account:
            raise HTTPException(status_code=404, detail="New account not found")

    # Update income record
    db.execute(
        "UPDATE income SET title = ?, amount = ?, date = ?, category = ?, account_id = ? WHERE id = ?",
        (
            income.title,
            income.amount,
            income.date,
            income.category,
            income.account_id,
            id,
        ),
    )

    # If account changed, update both old and new account balances
    if old_account_id != income.account_id:
        db.execute(
            "UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (old_amount, date.today(), old_account_id, current_user.id),
        )
        db.execute(
            "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (income.amount, date.today(), income.account_id, current_user.id),
        )
    else:
        # Update the account balance with the difference
        difference = income.amount - old_amount
        db.execute(
            "UPDATE accounts SET balance = balance + ?, last_updated = ? WHERE id = ? AND user_id = ?",
            (difference, date.today(), income.account_id, current_user.id),
        )

    return {"message": "Income updated successfully"}


@router.delete("/{id}/")
async def delete_income(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()

    # Get the income details before deletion and verify ownership through account
    income = db.query(
        "SELECT i.amount, i.account_id FROM income i JOIN accounts a ON i.account_id = a.id WHERE i.id = ? AND a.user_id = ?",
        (id, current_user.id),
    )
    if not income.to_dict(orient="records"):
        raise HTTPException(status_code=404, detail="Income not found")

    amount = income.to_dict(orient="records")[0]["amount"]
    account_id = income.to_dict(orient="records")[0]["account_id"]

    # Delete the income record
    db.execute("DELETE FROM income WHERE id = ?", (id,))

    # Update the account balance
    db.execute(
        "UPDATE accounts SET balance = balance - ?, last_updated = ? WHERE id = ? AND user_id = ?",
        (amount, date.today(), account_id, current_user.id),
    )

    return {"message": "Income deleted successfully"}
