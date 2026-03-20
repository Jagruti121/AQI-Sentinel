"""
AQI Prediction Platform - FastAPI Backend
==========================================
Main application entry point with CORS, routing, and startup configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routes import aqi, weather, satellite, ml_predict, chatbot, hospitals

app = FastAPI(
    title="AQI Prediction & Analysis Platform",
    description="Backend API for real-time AQI prediction using satellite data, weather, and ML models",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.onrender.com"], # You'll update this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(aqi.router, prefix="/api/aqi", tags=["AQI"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(satellite.router, prefix="/api/satellite", tags=["Satellite"])
app.include_router(ml_predict.router, prefix="/api/predict", tags=["ML Prediction"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(hospitals.router, prefix="/api/hospitals", tags=["Hospitals"])


@app.get("/")
async def root():
    return {
        "message": "AQI Prediction Platform API",
        "version": "1.0.0",
        "endpoints": {
            "aqi": "/api/aqi",
            "weather": "/api/weather",
            "satellite": "/api/satellite",
            "predict": "/api/predict",
            "chatbot": "/api/chatbot",
            "hospitals": "/api/hospitals"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
