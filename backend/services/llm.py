import os
import google.generativeai as genai
from openai import AsyncOpenAI

EXPANSION_PROMPT_TEMPLATE = """
You are an expert tutor helping a student understand a specific lecture slide. Your goal is to explain exactly what is on the slide, defining terms and providing necessary context without overwhelming the student.

Context:
- Course Topic: {course_topic}
- Slide Number: {slide_number}
- Previous Slide Context: {prev_context}
- Next Slide Context: {next_context}

Current Slide Content:
{slide_content}

Instructions:
1. **Assess Density**: 
   - If this is a **Title Slide** or **Agenda**, keep the output VERY brief (2-3 sentences) just to set the stage.
   - If this is a content-heavy slide, provide a detailed explanation.
2. **Explain, Don't Just Expand**: Focus on defining the specific terms, bullet points, or concepts visible on the slide. Answer the question: "What does this specific line mean?"
3. **Contextualize**: Use the previous/next slide context only to bridge gaps, not to pre-explain future concepts.
4. **Structure**: Use clear headings and bullet points.
5. **Tone**: Direct, clear, and helpful.

Output Format:
Markdown.
"""

async def expand_slide(slide_content: str, course_topic: str = "General", slide_number: int = 0, prev_context: str = "", next_context: str = ""):
    prompt = EXPANSION_PROMPT_TEMPLATE.format(
        course_topic=course_topic,
        slide_number=slide_number,
        prev_context=prev_context,
        next_context=next_context,
        slide_content=slide_content
    )

    # Try Google First
    if os.getenv("GOOGLE_API_KEY"):
        try:
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            # Try 1.5 Pro
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = await model.generate_content_async(prompt, stream=True)
                async for chunk in response:
                    if chunk.text:
                        # Yield smaller chunks for smoother streaming
                        for char in chunk.text:
                            yield char
                return
            except Exception:
                # Try 1.5 Flash (often available where Pro isn't)
                try:
                    model = genai.GenerativeModel('gemini-2.5-flash-lite')
                    response = await model.generate_content_async(prompt, stream=True)
                    async for chunk in response:
                        if chunk.text:
                            for char in chunk.text:
                                yield char
                    return
                except Exception:
                     # Try Gemini Pro (older)
                    model = genai.GenerativeModel('gemini-2.5-pro')
                    response = await model.generate_content_async(prompt, stream=True)
                    async for chunk in response:
                        if chunk.text:
                            for char in chunk.text:
                                yield char
                    return
        except Exception as e:
            print(f"Google GenAI failed: {e}")
            # Fall through to OpenAI if Google fails completely
            pass

    # Try OpenAI (either as primary or fallback)
    if os.getenv("OPENAI_API_KEY"):
        try:
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            return
        except Exception as e:
             print(f"OpenAI failed: {e}")
             raise e
    
    raise ValueError("No working API key found or all LLM calls failed.")
