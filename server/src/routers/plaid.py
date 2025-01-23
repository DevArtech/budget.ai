from fastapi import APIRouter
from server.src.databridge.plaid_databridge import PlaidDatabridge

router = APIRouter()

@router.get("/link-token")
async def get_link_token(user_id: str):
    databridge = PlaidDatabridge()
    link_token = await databridge.create_link_token(user_id)
    return {"link_token": link_token}
