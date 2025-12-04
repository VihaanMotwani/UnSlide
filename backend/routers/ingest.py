from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
import io

router = APIRouter()

@router.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        slides_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            slides_text.append({"slide_number": i + 1, "content": text})
            
        return {"filename": file.filename, "total_slides": len(slides_text), "slides": slides_text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
