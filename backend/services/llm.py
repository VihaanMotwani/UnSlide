from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
import os

def get_llm():
    if os.getenv("GOOGLE_API_KEY"):
        return ChatGoogleGenerativeAI(model="gemini-1.5-pro")
    elif os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model="gpt-4o")
    else:
        raise ValueError("No API key found. Please set GOOGLE_API_KEY or OPENAI_API_KEY.")

EXPANSION_PROMPT = ChatPromptTemplate.from_template("""
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

Output Format:
Markdown.
""")

async def expand_slide(slide_content: str, course_topic: str = "General", slide_number: int = 0, prev_context: str = "", next_context: str = ""):
    llm = get_llm()
    chain = EXPANSION_PROMPT | llm
    
    response = await chain.ainvoke({
        "slide_content": slide_content,
        "course_topic": course_topic,
        "slide_number": slide_number,
        "prev_context": prev_context,
        "next_context": next_context
    })
    
    return response.content
