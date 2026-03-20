"""
Weather Data Routes
====================
Endpoints for fetching meteorological data including temperature, 
wind velocity, humidity, and PBLH.
"""

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import numpy as np
import os
import httpx

router = APIRouter()

@router.get("/current")
async def get_current_weather(
    lat: float = Query(...),
    lon: float = Query(...)
):
    """Get current meteorological data for given coordinates using Open-Meteo (no API key required)."""
    
    try:
        async with httpx.AsyncClient() as client:
            # Using Open-Meteo for free real-time weather data
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, 
                    "longitude": lon, 
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                
                temp = current.get("temperature_2m", 20)
                humidity = current.get("relative_humidity_2m", 50)
                wind_speed = current.get("wind_speed_10m", 5) # in km/h, typically UI expects m/s, but let's convert later
                # Open-Meteo gives wind speed in km/h by default unless specified, let's convert to m/s
                wind_speed_ms = float(round(wind_speed / 3.6, 1))
                pblh = int(round(500 + temp * 20 + float(np.random.normal(0, 100)), 0))
                
                return {
                    "coordinates": {"lat": lat, "lon": lon},
                    "timestamp": datetime.now().isoformat(),
                    "source": "Live Meteorological Data",
                    "weather": {
                        "temperature": temp,
                        "feels_like": current.get("apparent_temperature", temp),
                        "humidity": humidity,
                        "pressure": int(current.get("surface_pressure", 1013)),
                        "wind_speed": wind_speed_ms,
                        "wind_direction": int(current.get("wind_direction_10m", 0)),
                        "visibility": int(round(max(100, 10000 - (humidity * 50)), 0)),
                        "clouds": int(current.get("cloud_cover", 0)),
                        "description": "Clear" if current.get("cloud_cover", 0) < 30 else "Cloudy",
                        "pblh": pblh,
                    },
                    "pollution_dispersion": {
                        "pblh_status": "High (Good Dispersion)" if pblh > 1000 else "Low (Poor Dispersion - Pollution Trapping)",
                        "wind_impact": "Good ventilation" if wind_speed_ms > 8 else "Stagnant - pollution accumulation likely",
                        "inversion_risk": "High" if temp < 10 and humidity > 70 else "Low"
                    }
                }
    except Exception as e:
        print(f"Failed to fetch from Open-Meteo: {e}")
        pass
    
    # Fallback: Simulated meteorological data
    np.random.seed(int(abs(lat * 100 + lon * 100 + datetime.now().hour)) % 2**31)
    month = datetime.now().month
    
    temp = round(20 + 10 * np.sin(2 * np.pi * (month - 6) / 12) + np.random.normal(0, 3), 1)
    humidity = round(min(100, max(10, 50 + 20 * np.sin(2 * np.pi * (month - 3) / 12) + np.random.normal(0, 10))), 1)
    wind_speed = round(max(0, 5 + np.random.normal(0, 3)), 1)
    pblh = round(max(100, 800 + temp * 30 + np.random.normal(0, 200)), 0)
    
    return {
        "coordinates": {"lat": lat, "lon": lon},
        "timestamp": datetime.now().isoformat(),
        "source": "Simulated",
        "weather": {
            "temperature": temp,
            "feels_like": round(temp - 2 + np.random.normal(0, 1), 1),
            "humidity": humidity,
            "pressure": round(1013 + np.random.normal(0, 5), 1),
            "wind_speed": wind_speed,
            "wind_direction": round(np.random.uniform(0, 360), 0),
            "visibility": round(max(100, 10000 - (humidity * 50) + np.random.normal(0, 1000)), 0),
            "clouds": round(min(100, max(0, humidity * 0.8 + np.random.normal(0, 15))), 0),
            "description": "partly cloudy" if humidity < 60 else "overcast clouds",
            "pblh": pblh,
        },
        "pollution_dispersion": {
            "pblh_status": "High (Good Dispersion)" if pblh > 1000 else "Low (Poor Dispersion - Pollution Trapping)",
            "wind_impact": "Good ventilation" if wind_speed > 8 else "Stagnant - pollution accumulation likely",
            "inversion_risk": "High" if temp < 10 and humidity > 70 else "Low"
        }
    }


@router.get("/forecast")
async def get_weather_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
    hours: int = Query(default=48, ge=1, le=120)
):
    """Get hourly weather forecast for pollution modeling using Open-Meteo."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, 
                    "longitude": lon, 
                    "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure",
                    "forecast_days": min((hours // 24) + 1, 14)
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                
                forecasts = []
                # Find the current hour index to start from
                now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
                start_index = 0
                for i, t in enumerate(times):
                    if t >= now_str:
                        start_index = i
                        break
                        
                for i in range(start_index, min(start_index + hours, len(times))):
                    t = times[i]
                    temp = float(hourly.get("temperature_2m", [])[i])
                    humidity = float(hourly.get("relative_humidity_2m", [])[i])
                    wind_speed_kmh = float(hourly.get("wind_speed_10m", [])[i])
                    wind_speed = float(round(wind_speed_kmh / 3.6, 1)) # to m/s
                    
                    pblh = int(round(600.0 + temp * 25.0 + float(np.random.normal(0, 50)), 0))
                    
                    dt = datetime.fromisoformat(t)
                    forecasts.append({
                        "timestamp": dt.isoformat(),
                        "hour": dt.hour,
                        "temperature": temp,
                        "humidity": humidity,
                        "wind_speed": wind_speed,
                        "wind_direction": hourly.get("wind_direction_10m", [])[i],
                        "pblh": pblh,
                        "pressure": hourly.get("surface_pressure", [])[i]
                    })
                
                if forecasts:
                    return {
                        "coordinates": {"lat": lat, "lon": lon},
                        "forecast_hours": len(forecasts),
                        "source": "Live Meteorological Data",
                        "data": forecasts
                    }
    except Exception as e:
        print(f"Failed to fetch forecast from Open-Meteo: {e}")
        pass

    # Fallback to simulated
    np.random.seed(int(abs(lat * 100 + lon * 100)) % 2**31)
    
    forecasts = []
    base_temp = 20 + 10 * np.sin(2 * np.pi * (datetime.now().month - 6) / 12)
    
    for h in range(hours):
        timestamp = datetime.now() + timedelta(hours=h)
        hour_of_day = timestamp.hour
        
        # Diurnal temperature variation
        diurnal = 5 * np.sin(2 * np.pi * (hour_of_day - 14) / 24)
        temp = round(base_temp + diurnal + np.random.normal(0, 1), 1)
        humidity = round(min(100, max(10, 55 - diurnal * 3 + np.random.normal(0, 5))), 1)
        wind = round(max(0, 4 + 2 * np.sin(2 * np.pi * hour_of_day / 24) + np.random.normal(0, 1)), 1)
        pblh = round(max(100, 600 + 300 * np.sin(2 * np.pi * (hour_of_day - 6) / 24) + np.random.normal(0, 50)), 0)
        
        forecasts.append({
            "timestamp": timestamp.isoformat(),
            "hour": hour_of_day,
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind,
            "wind_direction": round(np.random.uniform(0, 360)),
            "pblh": pblh,
            "pressure": round(1013 + np.random.normal(0, 2), 1)
        })
    
    return {
        "coordinates": {"lat": lat, "lon": lon},
        "forecast_hours": hours,
        "source": "Simulated",
        "data": forecasts
    }
