from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz  # PyMuPDF
import io
import base64

router = APIRouter()

@router.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    
    try:
        contents = await file.read()
        # PyMuPDF expects a stream or bytes
        doc = fitz.open(stream=contents, filetype="pdf")
        
        slides_data = []
        for i, page in enumerate(doc):
            # Extract text blocks with coordinates
            # blocks format: (x0, y0, x1, y1, "lines", block_no, block_type)
            text_blocks = page.get_text("blocks")
            
            elements = []
            full_text = ""
            
            page_width = page.rect.width
            page_height = page.rect.height
            
            for b_idx, block in enumerate(text_blocks):
                # block[4] is the text content
                text_content = block[4].strip()
                if not text_content:
                    continue
                    
                full_text += text_content + "\n\n"
                
                # Normalize coordinates to 0-1000
                x0, y0, x1, y1 = block[0], block[1], block[2], block[3]
                norm_box = [
                    int((y0 / page_height) * 1000),
                    int((x0 / page_width) * 1000),
                    int((y1 / page_height) * 1000),
                    int((x1 / page_width) * 1000)
                ]
                
                elements.append({
                    "id": b_idx,
                    "text": text_content,
                    "box_2d": norm_box
                })

            # Generate image
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_bytes = pix.tobytes("png")
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")

            slides_data.append({
                "slide_number": i + 1, 
                "content": full_text,
                "elements": elements,
                "image": f"data:image/png;base64,{img_base64}"
            })
            
        return {"filename": file.filename, "total_slides": len(slides_data), "slides": slides_data}
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
