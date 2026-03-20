"""
AQI Routes
===========
Endpoints for fetching AQI data, historical trends, and regional comparisons.
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
import numpy as np

from app.utils.aqi_calculator import (
    calculate_overall_aqi,
    get_health_advisory,
    generate_mock_historical_data,
    AQI_CATEGORIES
)

router = APIRouter()


import httpx

@router.get("/current")
async def get_current_aqi(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Get current AQI for given coordinates."""
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                
                pm25 = max(0, round(current.get("pm2_5", 0), 1))
                pm10 = max(0, round(current.get("pm10", 0), 1))
                no2 = max(0, round(current.get("nitrogen_dioxide", 0), 1))
                so2 = max(0, round(current.get("sulphur_dioxide", 0), 1))
                o3 = max(0, round(current.get("ozone", 0), 1))
                co_ug = max(0, current.get("carbon_monoxide", 0))
                co = round(co_ug / 1145.0, 2) # convert approx ug/m3 to ppm
                
                api_aqi = current.get("us_aqi")
                
                pollutants = {"PM2.5": pm25, "PM10": pm10, "NO2": no2, "SO2": so2, "O3": o3}
                aqi_result = calculate_overall_aqi(pollutants)
                
                final_aqi = int(api_aqi) if api_aqi is not None else aqi_result["aqi"]
                
                # Re-determine category if using api_aqi
                category = AQI_CATEGORIES[0]
                for cat in AQI_CATEGORIES:
                    if cat["range"][0] <= final_aqi <= cat["range"][1]:
                        category = cat
                        break
                        
                health = get_health_advisory(final_aqi)
                
                return {
                    "coordinates": {"lat": lat, "lon": lon},
                    "timestamp": datetime.now().isoformat(),
                    "aqi": final_aqi,
                    "category": category,
                    "dominant_pollutant": aqi_result["dominant_pollutant"] or "PM2.5",
                    "pollutants": {
                        "PM2.5": {"value": pm25, "unit": "µg/m³", "sub_aqi": aqi_result["sub_indices"].get("PM2.5", 0)},
                        "PM10": {"value": pm10, "unit": "µg/m³", "sub_aqi": aqi_result["sub_indices"].get("PM10", 0)},
                        "NO2": {"value": no2, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("NO2", 0)},
                        "SO2": {"value": so2, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("SO2", 0)},
                        "O3": {"value": o3, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("O3", 0)},
                        "CO": {"value": co, "unit": "ppm"},
                    },
                    "health_advisory": health
                }
    except Exception as e:
        print(f"Error fetching real AQI: {e}")
        pass
        
    # Fallback to Mock Data if API fails
    np.random.seed(int(abs(lat * 1000 + lon * 100 + datetime.now().hour)) % 2**31)
    
    pm25 = round(max(1, 25 + abs(lat - 28.6) * 5 + np.random.normal(0, 15)), 1)
    pm10 = round(max(2, 45 + abs(lat - 28.6) * 8 + np.random.normal(0, 20)), 1)
    no2 = round(max(1, 30 + abs(lon - 77.2) * 3 + np.random.normal(0, 10)), 1)
    so2 = round(max(0.5, 12 + np.random.normal(0, 5)), 1)
    o3 = round(max(5, 45 + np.random.normal(0, 15)), 1)
    co = round(max(0.1, 0.8 + np.random.normal(0, 0.3)), 2)
    
    pollutants = {"PM2.5": pm25, "PM10": pm10, "NO2": no2, "SO2": so2, "O3": o3}
    aqi_result = calculate_overall_aqi(pollutants)
    health = get_health_advisory(aqi_result["aqi"])
    
    return {
        "coordinates": {"lat": lat, "lon": lon},
        "timestamp": datetime.now().isoformat(),
        "aqi": aqi_result["aqi"],
        "category": aqi_result["category"],
        "dominant_pollutant": aqi_result["dominant_pollutant"],
        "pollutants": {
            "PM2.5": {"value": pm25, "unit": "µg/m³", "sub_aqi": aqi_result["sub_indices"].get("PM2.5", 0)},
            "PM10": {"value": pm10, "unit": "µg/m³", "sub_aqi": aqi_result["sub_indices"].get("PM10", 0)},
            "NO2": {"value": no2, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("NO2", 0)},
            "SO2": {"value": so2, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("SO2", 0)},
            "O3": {"value": o3, "unit": "ppb", "sub_aqi": aqi_result["sub_indices"].get("O3", 0)},
            "CO": {"value": co, "unit": "ppm"},
        },
        "health_advisory": health
    }


@router.get("/historical")
async def get_historical_aqi(
    lat: float = Query(...),
    lon: float = Query(...),
    days: int = Query(default=365, ge=7, le=365)
):
    """Get historical AQI data for trend analysis."""
    data = generate_mock_historical_data(lat, lon, days)
    
    # Calculate statistics
    aqi_values = [d["aqi"] for d in data]
    
    return {
        "coordinates": {"lat": lat, "lon": lon},
        "period": f"Last {days} days",
        "statistics": {
            "average_aqi": round(np.mean(aqi_values), 1),
            "max_aqi": int(np.max(aqi_values)),
            "min_aqi": int(np.min(aqi_values)),
            "std_dev": round(np.std(aqi_values), 1),
            "days_good": sum(1 for v in aqi_values if v <= 50),
            "days_moderate": sum(1 for v in aqi_values if 51 <= v <= 100),
            "days_unhealthy_sg": sum(1 for v in aqi_values if 101 <= v <= 150),
            "days_unhealthy": sum(1 for v in aqi_values if 151 <= v <= 200),
            "days_very_unhealthy": sum(1 for v in aqi_values if 201 <= v <= 300),
            "days_hazardous": sum(1 for v in aqi_values if v > 300),
        },
        "data": data
    }


@router.get("/compare")
async def compare_regions(
    regions: str = Query(..., description="Comma separated lat,lon pairs. Ex: 28.6,77.2;19.0,72.8")
):
    """Compare AQI across multiple regions."""
    region_pairs = regions.split(";")
    results = []
    
    for pair in region_pairs[:10]:  # Max 10 regions
        try:
            lat, lon = map(float, pair.split(","))
            data = generate_mock_historical_data(lat, lon, 30)
            aqi_values = [d["aqi"] for d in data]
            
            results.append({
                "coordinates": {"lat": lat, "lon": lon},
                "avg_aqi": round(np.mean(aqi_values), 1),
                "max_aqi": int(np.max(aqi_values)),
                "min_aqi": int(np.min(aqi_values)),
                "trend_data": data[-30:],
                "current_aqi": data[-1]["aqi"]
            })
        except (ValueError, IndexError):
            continue
    
    return {"regions": results, "comparison_period": "Last 30 days"}


@router.get("/hazards")
async def get_hazard_sources(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(default=50)
):
    """Get nearby pollution hazard sources (industries, power plants, etc.)."""
    np.random.seed(int(abs(lat * 100 + lon * 100)) % 2**31)
    
    hazard_types = [
        {"type": "Chemical Industry", "icon": "🏭", "impact": "High", "pollutants": ["SO2", "NO2", "VOCs"]},
        {"type": "Thermal Power Plant", "icon": "⚡", "impact": "Very High", "pollutants": ["PM2.5", "PM10", "SO2", "NO2"]},
        {"type": "Cement Factory", "icon": "🏗️", "impact": "High", "pollutants": ["PM10", "PM2.5"]},
        {"type": "Steel Plant", "icon": "🔩", "impact": "Very High", "pollutants": ["PM2.5", "PM10", "CO", "SO2"]},
        {"type": "Waste Burning Site", "icon": "🔥", "impact": "Moderate", "pollutants": ["PM2.5", "CO", "Dioxins"]},
        {"type": "Oil Refinery", "icon": "🛢️", "impact": "High", "pollutants": ["SO2", "NO2", "VOCs", "Benzene"]},
        {"type": "Brick Kiln", "icon": "🧱", "impact": "Moderate", "pollutants": ["PM2.5", "PM10", "SO2"]},
        {"type": "Vehicle Emission Hotspot", "icon": "🚗", "impact": "Moderate", "pollutants": ["NO2", "CO", "PM2.5"]},
    ]
    
    num_hazards = np.random.randint(3, 8)
    hazards = []
    
    for i in range(num_hazards):
        hazard = hazard_types[np.random.randint(0, len(hazard_types))]
        offset_lat = np.random.uniform(-radius_km / 111, radius_km / 111)
        offset_lon = np.random.uniform(-radius_km / 111, radius_km / 111)
        
        hazards.append({
            **hazard,
            "name": f"{hazard['type']} Unit-{i + 1}",
            "location": {
                "lat": round(lat + offset_lat, 4),
                "lon": round(lon + offset_lon, 4)
            },
            "distance_km": round(np.sqrt(offset_lat**2 + offset_lon**2) * 111, 1),
            "contribution_percentage": round(np.random.uniform(5, 25), 1)
        })
    
    hazards.sort(key=lambda x: x["distance_km"])
    
    return {
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "hazards": hazards,
        "total_industrial_contribution": round(sum(h["contribution_percentage"] for h in hazards), 1)
    }
    
    hazards.sort(key=lambda x: x["distance_km"])
    
    return {
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "hazards": hazards,
        "total_industrial_contribution": round(sum(h["contribution_percentage"] for h in hazards), 1)
    }
