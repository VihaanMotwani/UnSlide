import os
import base64
import io
from PIL import Image
import google.generativeai as genai
from openai import AsyncOpenAI
from groq import AsyncGroq

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
   - If this is a content-heavy slide, provide a concise explanation and keep it to-the-point.
2. **Explain, Don't Just Expand**: Focus on defining the specific terms, bullet points, or concepts visible on the slide. Answer the question: "What does this specific line mean?"
3. **Contextualize**: Use the previous/next slide context only to bridge gaps, not to pre-explain future concepts.
4. **Structure**: Use clear headings and bullet points.
5. **Tone**: Direct, clear, and helpful.
6. **Visual Annotations**: 
   - You are provided with a list of **Visual Elements** found on the slide, each with a unique ID and text content.
   - When you explain a concept that corresponds to one of these elements, wrap the specific keywords or phrases in a custom HTML tag: `<mark data-id="ID">text</mark>`, where `ID` is the `id` of the element from the provided list.
   - The text inside the `<mark>` tag should be the relevant words **in your explanation**, NOT necessarily the exact text from the slide element.
   - **CRITICAL**: Do NOT just copy-paste the slide text into the mark tag if it makes the sentence redundant.
   - **CRITICAL**: Do NOT wrap the `<mark>` tags in backticks or code blocks. They must be raw HTML to render correctly.
   - INCORRECT: `The <mark data-id="1">text</mark> is...`
   - CORRECT: The <mark data-id="1">text</mark> is...
   - BAD Example: "The slide mentions <mark data-id="1">Super fast; volatile</mark>." (Redundant/Awkward)
   - GOOD Example: "The slide describes cache as being <mark data-id="1">super fast and volatile</mark>." (Natural flow)
   - **DO NOT** invent new bounding boxes or IDs. Only use the IDs provided in the "Visual Elements" list.
   - Example: "The <mark data-id="5">L1 Cache</mark> is extremely fast..."

Output Format:
Markdown with HTML tags for annotations.

Visual Elements on this Slide:
{elements_list}
"""

async def expand_slide(
    slide_content: str, 
    course_topic: str = "General", 
    slide_number: int = 0, 
    prev_context: str = "", 
    next_context: str = "", 
    slide_image: str = None, 
    elements: list = [],
    api_key: str = None,
    provider: str = None,
    model: str = None
):
    
    # Format elements list for prompt
    elements_str = ""
    for el in elements:
        # Truncate long text for prompt efficiency
        text_preview = (el.text[:50] + '..') if len(el.text) > 50 else el.text
        elements_str += f"- ID {el.id}: \"{text_preview}\"\n"

    prompt = EXPANSION_PROMPT_TEMPLATE.format(
        course_topic=course_topic,
        slide_number=slide_number,
        prev_context=prev_context,
        next_context=next_context,
        slide_content=slide_content,
        elements_list=elements_str
    )

    inputs = [prompt]
    
    # Process image if present
    pil_image = None
    if slide_image:
        try:
            # Remove header if present (e.g., "data:image/png;base64,")
            if "base64," in slide_image:
                slide_image = slide_image.split("base64,")[1]
            
            image_data = base64.b64decode(slide_image)
            pil_image = Image.open(io.BytesIO(image_data))
            inputs.append(pil_image)
        except Exception as e:
            print(f"Error processing image: {e}")

    # --- Helper Functions for Providers ---

    async def call_groq(key, model_name):
        try:
            client = AsyncGroq(api_key=key)
            # Groq supports vision models like llama-3.2-11b-vision-preview
            # If model supports vision and we have an image, send it.
            # Otherwise send text only.
            
            messages = [{"role": "user", "content": prompt}]
            
            if slide_image and "vision" in (model_name or "").lower():
                 messages = [
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{slide_image}"}
                            }
                        ]
                    }
                ]

            stream = await client.chat.completions.create(
                messages=messages,
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
            # Use provided model or fallback list
            models = [model_name] if model_name else [
                'gemini-2.5-flash', 'gemini-2.5-flash-lite', 
                'gemini-1.5-flash', 'gemini-1.5-pro'
            ]
            
            for m in models:
                try:
                    model_instance = genai.GenerativeModel(m)
                    response = await model_instance.generate_content_async(inputs, stream=True)
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
            messages = [{"role": "user", "content": prompt}]
            if slide_image:
                messages = [
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{slide_image}"}
                            }
                        ]
                    }
                ]

            response = await client.chat.completions.create(
                model=model_name or "gpt-4o",
                messages=messages,
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
    
    # Try Groq (Free Tier)
    if os.getenv("GROQ_API_KEY"):
        try:
            async for chunk in call_groq(os.getenv("GROQ_API_KEY"), os.getenv("GROQ_MODEL", "llama3-70b-8192")):
                yield chunk
            return
        except Exception:
            pass # Fallthrough

    # Try Google
    if os.getenv("GOOGLE_API_KEY"):
        try:
            async for chunk in call_gemini(os.getenv("GOOGLE_API_KEY"), None):
                yield chunk
            return
        except Exception:
            pass # Fallthrough

    # Try OpenAI
    if os.getenv("OPENAI_API_KEY"):
        try:
            async for chunk in call_openai(os.getenv("OPENAI_API_KEY"), None):
                yield chunk
            return
        except Exception:
            pass

    raise ValueError("No working API key found or all LLM calls failed.")
