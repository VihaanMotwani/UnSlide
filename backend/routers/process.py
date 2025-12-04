from fastapi import APIRouter, HTTPException
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
        expanded_text = await expand_slide(
            slide_content=request.slide_content,
            course_topic=request.course_topic,
            slide_number=request.slide_number,
            prev_context=request.prev_context,
            next_context=request.next_context
        )
        return {"expanded_content": expanded_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error expanding slide: {str(e)}")
