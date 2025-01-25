import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Annotated

from server.src.databridge.plaid_databridge import PlaidDatabridge
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.services.plaid_service import PlaidService
from server.src.services.authentication_service import AuthenticationService
from server.src.models import (
    UserInDB,
    PlaidTransactionRequest,
    PublicTokenExchangeRequest,
)

router = APIRouter(prefix="/plaid", tags=["plaid"])


@router.get("/link-token")
async def get_link_token(user_id: str):
    databridge = PlaidDatabridge()
    link_token = databridge.create_link_token(user_id)
    return {"link_token": link_token}


@router.post("/exchange-public-token")
async def exchange_public_token(
    token: PublicTokenExchangeRequest,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    databridge = PlaidDatabridge()
    db = BaseDatabridge.get_instance()
    access_token = databridge.exchange_public_token(token.public_token)
    db.execute(
        "INSERT INTO tokens (user_id, name, key) VALUES (?, ?, ?)",
        (current_user.id, token.name, access_token),
    )

    # Get plaid account id
    account_id = db.query(
        "SELECT id FROM tokens WHERE name = ? AND user_id = ?",
        (token.name, current_user.id),
    ).to_dict(orient="records")[0]["id"]

    # Get account and insert into accounts
    account = PlaidService().get_balance(account_id, current_user)
    db.execute(
        "INSERT INTO accounts (name, type, balance, user_id) VALUES (?, ?, ?, ?)",
        (
            token.name,
            account["type"],
            account["balances"].get("limit", 0),
            current_user.id,
        ),
    )

    # Get account id
    account_id = db.query(
        "SELECT id FROM accounts WHERE name = ? AND user_id = ?",
        (token.name, current_user.id),
    ).to_dict(orient="records")[0]["id"]

    # Get transactions
    transactions = PlaidService().get_transactions(
        PlaidTransactionRequest(start_date="2024-01-01", end_date="2025-01-24"),
        current_user,
    )
    for transaction in transactions[token.name]:
        if transaction.get("category") and len(transaction.get("category")) > 0:
            category = transaction.get("category")[0]
        else:
            category = "Other"

        if transaction["amount"] < 0:
            db.execute(
                "INSERT INTO income (title, amount, date, category, account_id) VALUES (?, ?, ?, ?, ?)",
                (
                    transaction["name"],
                    -float(transaction["amount"]),
                    transaction["date"],
                    category,
                    account_id,
                ),
            )
        else:
            db.execute(
                "INSERT INTO expenses (title, amount, date, category, account_id) VALUES (?, ?, ?, ?, ?)",
                (
                    transaction["name"],
                    float(transaction["amount"]),
                    transaction["date"],
                    category,
                    account_id,
                ),
            )

    return {"message": "Public token has been exchanged and transactions stored"}


@router.post("/transactions")
async def get_transactions(
    transaction_request: PlaidTransactionRequest,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    return {
        "transactions": PlaidService().get_transactions(
            transaction_request, current_user
        )
    }


@router.get("/balance")
async def get_balance(
    account_id: int,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    return {"account": PlaidService().get_balance(account_id, current_user)}
