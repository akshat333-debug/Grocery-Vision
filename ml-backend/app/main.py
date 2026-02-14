"""
Grocery Vision — FastAPI Backend
Local ML-powered grocery detection and freshness analysis.

Architecture:
  - YOLOv8 for grocery detection (runs locally, no API)
  - OpenCV for freshness analysis (runs locally, no API)
  - Gemini API for text-only enrichment (optional, minimal tokens)
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes import router, init_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    print("🚀 Grocery Vision ML Backend starting...")
    print(f"📡 Gemini API key: {'Available' if os.getenv('GOOGLE_API_KEY') else 'Not set (text enrichment disabled)'}")

    # Load models (YOLOv8 + OpenCV analyzers)
    init_models()

    print("✅ All models loaded successfully")
    print("=" * 50)
    print("🍎 Grocery Vision is ready!")
    print("   🔬 YOLOv8 — Local grocery detection")
    print("   🎨 OpenCV — Local freshness analysis")
    print("   💬 Gemini — Text-only enrichment (optional)")
    print("=" * 50)

    yield

    print("👋 Grocery Vision shutting down...")


app = FastAPI(
    title="Grocery Vision API",
    description="AI-powered grocery detection and freshness analysis using local ML models",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "version": "2.0.0",
        "engine": "Local ML (YOLOv8 + OpenCV)",
        "api_enrichment": "Gemini text-only (optional)",
    }
