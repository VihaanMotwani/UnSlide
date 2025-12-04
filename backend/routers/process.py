from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.llm import expand_slide

router = APIRouter()

class ExpandRequest(BaseModel):
    slide_content: str
    course_topic: str = "General"
    slide_number: int
    prev_context: str = ""
    next_context: str = ""

@router.post("/expand")
async def expand_slide_endpoint(request: ExpandRequest):
    try:
        return StreamingResponse(
            expand_slide(
                slide_content=request.slide_content,
                course_topic=request.course_topic,
                slide_number=request.slide_number,
                prev_context=request.prev_context,
                next_context=request.next_context
            ),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
                "Connection": "keep-alive"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error expanding slide: {e}")
        raise HTTPException(status_code=500, detail=f"Error expanding slide: {str(e)}")
