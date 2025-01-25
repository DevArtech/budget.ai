import plaid
from datetime import datetime
from plaid.api import plaid_api
from typing import List
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.transaction import Transaction
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest

from server.src.settings import settings
from server.src.models import PlaidTransactionRequest


class PlaidDatabridge:
    def __init__(self):
        self.config = plaid.Configuration(
            host=(
                plaid.Environment.Sandbox
                if settings.plaid_environment == "sandbox"
                else plaid.Environment.Production
            ),
            api_key={
                "clientId": settings.plaid_client_id,
                "secret": settings.plaid_client_secret,
            },
        )
        self.api_client = plaid.ApiClient(self.config)
        self.client = plaid_api.PlaidApi(self.api_client)

    def create_link_token(self, user_id: str) -> str:
        """
        Create a link token for initializing Plaid Link

        Args:
            user_id: The ID of the user to create the link token for

        Returns:
            str: The link token to be used on the client side
        """
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
            client_name="Budget.AI",
            products=[
                Products("transactions")
            ],  # List of Plaid products you want to use
            country_codes=[CountryCode("US")],  # List of supported country codes
            language="en",  # Language for the Link interface
        )

        response = self.client.link_token_create(request)
        return response["link_token"]

    def exchange_public_token(self, public_token: str) -> str:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self.client.item_public_token_exchange(request)
        return response["access_token"]

    def get_balance(self, token: str):
        request = AccountsBalanceGetRequest(access_token=token)
        response = self.client.accounts_balance_get(request)
        return response["accounts"]

    def get_transactions(
        self, token: str, transaction_request: PlaidTransactionRequest
    ) -> List[Transaction]:
        request = TransactionsGetRequest(
            access_token=token,
            start_date=datetime.strptime(
                transaction_request.start_date, "%Y-%m-%d"
            ).date(),
            end_date=datetime.strptime(transaction_request.end_date, "%Y-%m-%d").date(),
        )
        response = self.client.transactions_get(request)
        return response["transactions"]
