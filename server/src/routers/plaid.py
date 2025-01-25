import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Annotated

from server.src.databridge.plaid_databridge import PlaidDatabridge
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.services.authentication_service import AuthenticationService
from server.src.models import UserInDB, PlaidTransactionRequest, PublicTokenExchangeRequest

router = APIRouter(prefix="/plaid", tags=["plaid"])

@router.get("/link-token")
async def get_link_token(user_id: str):
    databridge = PlaidDatabridge()
    link_token = databridge.create_link_token(user_id)
    return {"link_token": link_token}

@router.post("/exchange-public-token")
async def exchange_public_token(token: PublicTokenExchangeRequest, current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]):
    databridge = PlaidDatabridge()
    db = BaseDatabridge.get_instance()
    access_token = databridge.exchange_public_token(token.public_token)
    db.execute("INSERT INTO tokens (user_id, name, key) VALUES (?, ?, ?)", (current_user.id, token.name, access_token))
    return {"Public token has been exchanged"}

@router.post("/transactions")
async def get_transactions(transaction_request: PlaidTransactionRequest, current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]):

    databridge = PlaidDatabridge()
    db = BaseDatabridge.get_instance()
    tokens = db.query("SELECT name, key FROM tokens WHERE user_id = ?", (current_user.id,)).to_dict(orient="records")
    transactions = {}
    for row in tokens:
        transactions[row["name"]] = [transaction.to_dict() for transaction in databridge.get_transactions(row["key"], transaction_request)]
    return {"transactions": transactions}

@router.get("/balance")
async def get_balance(account_id: int, current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]):
    databridge = PlaidDatabridge()
    db = BaseDatabridge.get_instance()
    tokens = db.query("SELECT name, key FROM tokens WHERE user_id = ? AND id = ?", (current_user.id, account_id)).to_dict(orient="records")[0]
    return {"account": databridge.get_balances(tokens["key"])[0].to_dict()}

