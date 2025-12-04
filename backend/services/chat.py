import os
import google.generativeai as genai
from openai import AsyncOpenAI

CHAT_PROMPT_TEMPLATE = """
You are an expert tutor helping a student understand a specific lecture slide. 
The student has a question about the current slide.

Context:
- Course Topic: {course_topic}
- Slide Number: {slide_number}
- Current Slide Content: {slide_content}

Student Question: {question}

Instructions:
1. Answer the student's question directly and clearly.
2. Use the slide content as the primary source of truth.
3. If the answer is not in the slide, you can use your general knowledge but mention that it's not explicitly on the slide.
4. Keep the answer concise and helpful.

Output Format:
Markdown.
"""

async def chat_with_slide(question: str, slide_content: str, course_topic: str = "General", slide_number: int = 0):
    prompt = CHAT_PROMPT_TEMPLATE.format(
        course_topic=course_topic,
        slide_number=slide_number,
        slide_content=slide_content,
        question=question
    )

    # Try Google First
    if os.getenv("GOOGLE_API_KEY"):
        try:
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = await model.generate_content_async(prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    for char in chunk.text:
                        yield char
            return
        except Exception as e:
            print(f"Google GenAI failed: {e}")
            pass

    # Try OpenAI
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
