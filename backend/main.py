from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest, process
from dotenv import load_dotenv
import os

load_dotenv()

# Debug: Check API Keys
if os.getenv("OPENAI_API_KEY"):
    print("✅ OPENAI_API_KEY found")
else:
    print("❌ OPENAI_API_KEY not found")

if os.getenv("GOOGLE_API_KEY"):
    print("✅ GOOGLE_API_KEY found")
else:
    print("❌ GOOGLE_API_KEY not found")

app = FastAPI(title="UnSlide API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/v1", tags=["ingestion"])
app.include_router(process.router, prefix="/api/v1", tags=["processing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to UnSlide API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
