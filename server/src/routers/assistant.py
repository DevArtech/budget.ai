from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, List
from ..services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["assistant"])
assistant_service = AssistantService()

@router.post("/chat")
async def chat(message: str):
    """
    Chat endpoint that streams the response
    """
    return StreamingResponse(
        assistant_service.chat(message),
        media_type="text/event-stream"
    )

@router.get("/history")
def get_history() -> List[Dict[str, str]]:
    """
    Get chat history
    """
    return assistant_service.get_chat_history()

@router.post("/clear")
def clear_history():
    """
    Clear chat history
    """
    assistant_service.clear_history()
    return {"status": "success"}
