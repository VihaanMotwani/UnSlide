from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.chat import chat_with_slide

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    slide_content: str
    course_topic: str = "General"
    slide_number: int

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        return StreamingResponse(
            chat_with_slide(
                question=request.question,
                slide_content=request.slide_content,
                course_topic=request.course_topic,
                slide_number=request.slide_number
            ),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
                "Connection": "keep-alive"
            }
        )
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")
