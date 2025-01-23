import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser

from server.src.settings import settings

class PlaidDatabridge:
    def __init__(self):
        self.config = plaid.Configuration(
            host=plaid.Environment.Sandbox if settings.plaid_environment == "sandbox" else plaid.Environment.Production,
            api_key={
                'clientId': settings.plaid_client_id,
                'secret': settings.plaid_client_secret,
            }
        )
        self.api_client = plaid.ApiClient(self.config)
        self.client = plaid_api.PlaidApi(self.api_client)

    async def create_link_token(self, user_id: str) -> str:
        """
        Create a link token for initializing Plaid Link
        
        Args:
            user_id: The ID of the user to create the link token for
            
        Returns:
            str: The link token to be used on the client side
        """
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id=user_id
            ),
            client_name="Budget.AI",
            products=[Products("balance")],  # List of Plaid products you want to use
            country_codes=[CountryCode("US")],  # List of supported country codes
            language="en",  # Language for the Link interface
        )
        
        response = await self.client.link_token_create(request)
        return response["link_token"]

