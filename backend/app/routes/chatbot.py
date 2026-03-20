"""
AI Chatbot Routes
==================
Context-aware AI assistant that provides health advisories based on 
current/predicted AQI for the selected region, powered by Gemini AI.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import os
import google.generativeai as genai

from app.utils.aqi_calculator import get_health_advisory

router = APIRouter()

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("AIzaSyBCnilmU3teVuEAiZnEnA4MVpcW1WvSbtg")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class ChatMessage(BaseModel):
    message: str
    lat: float
    lon: float
    current_aqi: Optional[int] = None
    region_name: Optional[str] = None

# Fallback basic responses if API key is missing or fails
def generate_fallback_response(message: str, aqi: int, region: str) -> str:
    """Generate a context-aware fallback response."""
    health = get_health_advisory(aqi)
    return f"""**📍 Region:** {region}
**🌡️ Current AQI:** {aqi} — **{health['level']}**

I am currently running in offline fallback mode. Please configure the **Gemini API Key**.

**Health Implications:**
{health['health_implications']}

**Recommended Actions:**
{chr(10).join('- ' + a for a in health['recommended_actions'])}
"""

@router.post("/message")
async def chat_message(msg: ChatMessage):
    """Process a chat message and return context-aware health advisory from Gemini."""
    aqi = msg.current_aqi or 100
    region = msg.region_name or f"({msg.lat:.2f}, {msg.lon:.2f})"
    health = get_health_advisory(aqi)

    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key':
        response_text = generate_fallback_response(msg.message, aqi, region)
    else:
        try:
            # Construct a comprehensive prompt for Gemini
            system_prompt = f"""
            You are 'AQI Sentinel', an expert environmental health assistant and pulmonologist AI.
            The user is located in {region} with coordinates ({msg.lat}, {msg.lon}).
            The current Air Quality Index (AQI) there is {aqi}, which is classified as '{health['level']}'.
            
            Based on this AQI, the general health implications are: {health['health_implications']}
            The standard recommended actions are: {', '.join(health['recommended_actions'])}
            
            Respond directly to the user's message providing highly accurate, medical-grade, and practical advice.
            Current user message: "{msg.message}"
            
            Format your response in Markdown, using bold text for emphasis and bullet points for lists. 
            Do not repeat the standard actions verbatim unless relevant. Give specific, tailored advice.
            Include emojis where appropriate. Keep it concise but comprehensive.
            """
            
            model = genai.GenerativeModel('gemini-1.5-pro') # Or pro-latest / flash depending on setup
            response = model.generate_content(system_prompt)
            response_text = response.text
            
        except Exception as e:
            print(f"Gemini API Error: {e}")
            response_text = generate_fallback_response(msg.message, aqi, region)
    
    return {
        "response": response_text,
        "context": {
            "region": region,
            "coordinates": {"lat": msg.lat, "lon": msg.lon},
            "aqi": aqi,
            "timestamp": datetime.now().isoformat(),
            "provider": "gemini" if GEMINI_API_KEY else "fallback"
        }
    }


@router.get("/quick-advisory")
async def quick_advisory(
    aqi: int = Query(..., ge=0, le=500)
):
    """Get quick health advisory for a given AQI value."""
    health = get_health_advisory(aqi)
    return {
        "aqi": aqi,
        "advisory": health,
        "timestamp": datetime.now().isoformat()
    }
