import os
import google.generativeai as genai
from openai import AsyncOpenAI

EXPANSION_PROMPT_TEMPLATE = """
You are an expert professor and tutor. Your goal is to take a sparse lecture slide and transform it into a comprehensive, engaging, and well-structured textbook chapter.

Context:
- Course Topic: {course_topic}
- Slide Number: {slide_number}
- Previous Slide Context: {prev_context}
- Next Slide Context: {next_context}

Current Slide Content:
{slide_content}

Instructions:
1. **Analyze**: Understand the core concept of this slide. What is the professor trying to convey?
2. **Expand**: Write a detailed explanation. Fill in the gaps. Explain "why" and "how".
3. **Structure**: Use clear headings, bullet points, and bold text.
4. **Tone**: Educational, encouraging, and clear. Avoid jargon unless you define it.
5. **Resources**: At the end, suggest 3 external resources (search queries or types of videos to look for) that would help understand this topic better.

ENSURE that you only talk about the content displayed on the current slide and anything that is strictly necessary from the previous or next slides for context. 
DO NOT explain everything at once; focus on clarity and depth for this specific slide's content.

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
