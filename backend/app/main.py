from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

from app.database import engine, get_db
from app.models import Base
from app.routers import suppliers, compliance, insights

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Supplier Compliance Monitor API",
    description="API for tracking supplier compliance with contract terms",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
app.include_router(compliance.router, prefix="/suppliers", tags=["compliance"])
app.include_router(insights.router, prefix="/suppliers", tags=["insights"])

@app.get("/")
async def root():
    """Root endpoint providing API information"""
    return {
        "message": "Supplier Compliance Monitor & Insights Dashboard API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
