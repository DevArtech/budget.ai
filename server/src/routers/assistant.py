from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, List, Annotated

from ..services.assistant_service import AssistantService
from server.src.models import UserInDB
from server.src.services.authentication_service import AuthenticationService

router = APIRouter(prefix="/assistant", tags=["assistant"])
assistant_service = AssistantService()


@router.post("/chat")
async def chat(
    message: str,
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ],
):
    """
    Chat endpoint that streams the response
    """
    return StreamingResponse(
        assistant_service.chat(current_user, message), media_type="text/event-stream"
    )


@router.get("/history")
async def get_history(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
) -> List[Dict[str, str]]:
    """
    Get chat history
    """
    return assistant_service.get_chat_history(current_user)


@router.post("/clear")
async def clear_history(
    current_user: Annotated[
        UserInDB, Depends(AuthenticationService.get_current_active_user)
    ]
):
    """
    Clear chat history
    """
    assistant_service.clear_history(current_user)
    return {"status": "success"}
