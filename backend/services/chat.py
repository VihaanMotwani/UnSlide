import os
import google.generativeai as genai
from openai import AsyncOpenAI
from groq import AsyncGroq

from typing import List, Dict

CHAT_PROMPT_TEMPLATE = """
You are an expert tutor helping a student understand a specific lecture slide. 
The student has a question about the current slide.

Context:
- Course Topic: {course_topic}
- Slide Number: {slide_number}
- Current Slide Content: {slide_content}

Chat History:
{history}

Student Question: {question}

Instructions:
1. Answer the student's question directly and clearly.
2. Use the slide content as the primary source of truth.
3. If the answer is not in the slide, you can use your general knowledge.
4. Keep the answer concise and helpful.
5. Answer should be pretty brief/ to-the-point unless user asks for more detail, or to elaborate.

Output Format: 
Markdown.
"""

async def chat_with_slide(
    question: str, 
    slide_content: str, 
    course_topic: str = "General", 
    slide_number: int = 0, 
    history: List[Dict[str, str]] = [],
    api_key: str = None,
    provider: str = None,
    model: str = None
):
    # Format history
    history_text = ""
    for msg in history:
        role = "Student" if msg.get("role") == "user" else "Tutor"
        history_text += f"{role}: {msg.get('content')}\n"

    prompt = CHAT_PROMPT_TEMPLATE.format(
        course_topic=course_topic,
        slide_number=slide_number,
        slide_content=slide_content,
        history=history_text,
        question=question
    )

    # --- Helper Functions ---

    async def call_groq(key, model_name):
        try:
            client = AsyncGroq(api_key=key)
            stream = await client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model_name or "llama3-70b-8192",
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Groq failed: {e}")
            raise e

    async def call_gemini(key, model_name):
        try:
            genai.configure(api_key=key)
            models = [model_name] if model_name else [
                'gemini-2.5-flash', 'gemini-2.5-flash-lite', 
                'gemini-1.5-flash', 'gemini-1.5-pro'
            ]
            for m in models:
                try:
                    model_instance = genai.GenerativeModel(m)
                    response = await model_instance.generate_content_async(prompt, stream=True)
                    async for chunk in response:
                        if chunk.text:
                            for char in chunk.text:
                                yield char
                    return
                except Exception as e:
                    print(f"Google GenAI model {m} failed: {e}")
                    if m == models[-1]: raise e
                    continue
        except Exception as e:
            print(f"Google GenAI failed: {e}")
            raise e

    async def call_openai(key, model_name):
        try:
            client = AsyncOpenAI(api_key=key)
            response = await client.chat.completions.create(
                model=model_name or "gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
             print(f"OpenAI failed: {e}")
             raise e

    # --- Selection Logic ---

    # 1. User Provided Key
    if api_key and provider:
        if provider.lower() == "groq":
            async for chunk in call_groq(api_key, model): yield chunk
            return
        elif provider.lower() == "gemini":
            async for chunk in call_gemini(api_key, model): yield chunk
            return
        elif provider.lower() == "openai":
            async for chunk in call_openai(api_key, model): yield chunk
            return

    # 2. Server Defaults (Groq -> Google -> OpenAI)
    
    if os.getenv("GROQ_API_KEY"):
        try:
            async for chunk in call_groq(os.getenv("GROQ_API_KEY"), os.getenv("GROQ_MODEL", "llama3-70b-8192")):
                yield chunk
            return
        except Exception: pass

    if os.getenv("GOOGLE_API_KEY"):
        try:
            async for chunk in call_gemini(os.getenv("GOOGLE_API_KEY"), None):
                yield chunk
            return
        except Exception: pass

    if os.getenv("OPENAI_API_KEY"):
        try:
            async for chunk in call_openai(os.getenv("OPENAI_API_KEY"), None):
                yield chunk
            return
        except Exception: pass
    
    raise ValueError("No working API key found or all LLM calls failed.")
