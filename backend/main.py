from fastapi import FastAPI
from routers import ingest, process

app = FastAPI(title="UnSlide API", version="0.1.0")

app.include_router(ingest.router, prefix="/api/v1", tags=["ingestion"])
app.include_router(process.router, prefix="/api/v1", tags=["processing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to UnSlide API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
