from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

from server.src.models import Account, UserInDB
from server.src.services.authentication_service import AuthenticationService
from server.src.databridge.base_databridge import BaseDatabridge

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/")
async def get_accounts(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    db = BaseDatabridge.get_instance()
    result = db.query("SELECT * FROM accounts WHERE user_id = ?", (current_user.id,))
    return result.to_dict(orient="records")


@router.get("/{id}/")
async def get_account(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    result = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, current_user.id)
    )
    return result.to_dict(orient="records")


@router.get("/{id}/transactions/")
async def get_account_transactions(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    account = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, current_user.id)
    ).to_dict(orient="records")
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    expenses = db.query(
        "SELECT *, 'expense' as type FROM expenses WHERE account_id = ?", (id,)
    )
    income = db.query(
        "SELECT *, 'income' as type FROM income WHERE account_id = ?", (id,)
    )

    # Convert both results to records and combine them
    transactions = expenses.to_dict(orient="records") + income.to_dict(orient="records")
    return transactions


@router.post("/")
async def create_account(
    account: Account,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    db.execute(
        "INSERT INTO accounts (name, type, balance, last_updated, user_id) VALUES (?, ?, ?, ?, ?)",
        (
            account.name,
            account.type,
            account.balance,
            account.last_updated,
            current_user.id,
        ),
    )
    return {"message": "Account created successfully"}


@router.put("/{id}/")
async def update_account(
    id: int,
    account: Account,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    existing = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, current_user.id)
    ).to_dict(orient="records")
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")

    db.execute(
        "UPDATE accounts SET name = ?, type = ?, balance = ?, last_updated = ? WHERE id = ? AND user_id = ?",
        (
            account.name,
            account.type,
            account.balance,
            account.last_updated,
            id,
            current_user.id,
        ),
    )
    return {"message": "Account updated successfully"}


@router.delete("/{id}/")
async def delete_account(
    id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    db = BaseDatabridge.get_instance()
    existing = db.query(
        "SELECT * FROM accounts WHERE id = ? AND user_id = ?", (id, current_user.id)
    ).to_dict(orient="records")
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")

    # Start a transaction to ensure all deletes happen atomically
    db.execute("BEGIN TRANSACTION")
    try:
        # Delete all related expenses
        db.execute("DELETE FROM expenses WHERE account_id = ?", (id,))
        
        # Delete all related income
        db.execute("DELETE FROM income WHERE account_id = ?", (id,))
        
        # Delete the account itself
        db.execute(
            "DELETE FROM accounts WHERE id = ? AND user_id = ?", (id, current_user.id)
        )
        
        # Commit the transaction
        db.execute("COMMIT")
    except Exception as e:
        # If anything fails, rollback all changes
        db.execute("ROLLBACK")
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Account and all related transactions deleted successfully"}
