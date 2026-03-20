"""
AQI Data Processing Utilities
===============================
Helper functions for AQI calculation, breakpoints, and data transformation.
"""

import numpy as np
from datetime import datetime, timedelta


# US EPA AQI Breakpoints
AQI_BREAKPOINTS = {
    "PM2.5": [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ],
    "PM10": [
        (0, 54, 0, 50),
        (55, 154, 51, 100),
        (155, 254, 101, 150),
        (255, 354, 151, 200),
        (355, 424, 201, 300),
        (425, 504, 301, 400),
        (505, 604, 401, 500),
    ],
    "NO2": [
        (0, 53, 0, 50),
        (54, 100, 51, 100),
        (101, 360, 101, 150),
        (361, 649, 151, 200),
        (650, 1249, 201, 300),
        (1250, 1649, 301, 400),
        (1650, 2049, 401, 500),
    ],
    "SO2": [
        (0, 35, 0, 50),
        (36, 75, 51, 100),
        (76, 185, 101, 150),
        (186, 304, 151, 200),
        (305, 604, 201, 300),
        (605, 804, 301, 400),
        (805, 1004, 401, 500),
    ],
    "O3": [
        (0, 54, 0, 50),
        (55, 70, 51, 100),
        (71, 85, 101, 150),
        (86, 105, 151, 200),
        (106, 200, 201, 300),
    ],
}


AQI_CATEGORIES = [
    {"range": [0, 50], "label": "Good", "color": "#00e400", "emoji": "🟢"},
    {"range": [51, 100], "label": "Moderate", "color": "#ffff00", "emoji": "🟡"},
    {"range": [101, 150], "label": "Unhealthy for Sensitive Groups", "color": "#ff7e00", "emoji": "🟠"},
    {"range": [151, 200], "label": "Unhealthy", "color": "#ff0000", "emoji": "🔴"},
    {"range": [201, 300], "label": "Very Unhealthy", "color": "#8f3f97", "emoji": "🟣"},
    {"range": [301, 500], "label": "Hazardous", "color": "#7e0023", "emoji": "⚫"},
]


def calculate_aqi_for_pollutant(concentration: float, pollutant: str) -> int:
    """Calculate AQI for a single pollutant using EPA breakpoints."""
    breakpoints = AQI_BREAKPOINTS.get(pollutant)
    if not breakpoints:
        return 0
    
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            aqi = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return round(aqi)
    
    return 500  # Beyond scale


def calculate_overall_aqi(pollutant_values: dict) -> dict:
    """Calculate overall AQI from individual pollutant concentrations."""
    sub_indices = {}
    for pollutant, concentration in pollutant_values.items():
        if pollutant in AQI_BREAKPOINTS and concentration is not None:
            sub_indices[pollutant] = calculate_aqi_for_pollutant(concentration, pollutant)
    
    if not sub_indices:
        return {"aqi": 0, "dominant_pollutant": None, "category": AQI_CATEGORIES[0], "sub_indices": {}}
    
    overall_aqi = max(sub_indices.values())
    dominant = max(sub_indices, key=sub_indices.get)
    
    category = AQI_CATEGORIES[0]
    for cat in AQI_CATEGORIES:
        if cat["range"][0] <= overall_aqi <= cat["range"][1]:
            category = cat
            break
    
    return {
        "aqi": overall_aqi,
        "dominant_pollutant": dominant,
        "category": category,
        "sub_indices": sub_indices
    }


def get_health_advisory(aqi: int) -> dict:
    """Get health advisory based on AQI level."""
    if aqi <= 50:
        return {
            "level": "Good",
            "health_implications": "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            "cautionary_statement": "None.",
            "recommended_actions": ["Enjoy outdoor activities", "No precautions needed"],
            "vulnerable_groups": [],
            "medical_supplies": [],
            "doctors_to_consult": []
        }
    elif aqi <= 100:
        return {
            "level": "Moderate",
            "health_implications": "Air quality is acceptable; however, there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.",
            "cautionary_statement": "Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.",
            "recommended_actions": [
                "Sensitive individuals should reduce prolonged outdoor exertion",
                "Keep windows closed during high pollution hours",
                "Use air quality monitoring apps"
            ],
            "vulnerable_groups": ["People with respiratory diseases", "Children", "Elderly"],
            "medical_supplies": ["N95 mask (optional)"],
            "doctors_to_consult": ["General Physician"]
        }
    elif aqi <= 150:
        return {
            "level": "Unhealthy for Sensitive Groups",
            "health_implications": "Members of sensitive groups may experience health effects. The general public is not likely to be affected.",
            "cautionary_statement": "People with heart or lung disease, older adults, and children should reduce prolonged or heavy exertion.",
            "recommended_actions": [
                "Wear N95/KN95 masks outdoors",
                "Use HEPA air purifiers indoors",
                "Avoid outdoor exercise during peak hours",
                "Keep rescue inhalers handy if asthmatic"
            ],
            "vulnerable_groups": ["Asthmatics", "COPD patients", "Children", "Elderly", "Heart disease patients"],
            "medical_supplies": ["N95/KN95 masks", "HEPA air purifier", "Rescue inhaler (if prescribed)", "Saline nasal spray"],
            "doctors_to_consult": ["Pulmonologist", "General Physician"]
        }
    elif aqi <= 200:
        return {
            "level": "Unhealthy",
            "health_implications": "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
            "cautionary_statement": "Everyone should reduce prolonged or heavy exertion. Sensitive groups should avoid all outdoor exertion.",
            "recommended_actions": [
                "Wear N95/KN95 masks at all times outdoors",
                "Run HEPA air purifiers continuously indoors",
                "Avoid all outdoor exercise",
                "Keep all windows and doors sealed",
                "Stay hydrated and monitor symptoms",
                "Seek medical attention if experiencing breathing difficulties"
            ],
            "vulnerable_groups": ["Everyone", "Especially: Asthmatics, Children, Elderly, Pregnant women, Heart patients"],
            "medical_supplies": ["N95/KN95 masks (multiple)", "HEPA air purifier", "Portable oxygen concentrator", "Bronchodilator inhaler", "Anti-allergy medication", "Eye drops"],
            "doctors_to_consult": ["Pulmonologist", "Cardiologist", "Allergist/Immunologist"]
        }
    elif aqi <= 300:
        return {
            "level": "Very Unhealthy",
            "health_implications": "Health alert: everyone may experience more serious health effects.",
            "cautionary_statement": "Everyone should avoid all outdoor exertion. Sensitive groups should remain indoors.",
            "recommended_actions": [
                "Stay indoors with air purification running",
                "Seal all windows and doors",
                "Wear N95 mask even indoors if no purifier available",
                "Monitor oxygen saturation levels",
                "Prepare emergency medical supplies",
                "Consider temporary relocation if possible"
            ],
            "vulnerable_groups": ["Everyone at serious risk"],
            "medical_supplies": ["N95/KN95 masks", "HEPA air purifier", "Pulse oximeter", "Portable oxygen concentrator", "Nebulizer with prescribed medication", "Emergency inhaler", "Antihistamines"],
            "doctors_to_consult": ["Pulmonologist (urgent)", "Cardiologist", "Emergency Medicine Specialist", "Allergist/Immunologist"]
        }
    else:
        return {
            "level": "Hazardous",
            "health_implications": "Health warnings of emergency conditions. The entire population is more likely to be affected.",
            "cautionary_statement": "Everyone should avoid all outdoor exertion. Stay indoors and reduce activity levels.",
            "recommended_actions": [
                "EMERGENCY: Stay indoors at all times",
                "Run all available air purification systems",
                "Seal home completely",
                "Monitor breathing and heart rate continuously",
                "Call emergency services if symptoms worsen",
                "Evacuate to cleaner air region if medically possible",
                "Keep emergency supplies ready"
            ],
            "vulnerable_groups": ["Entire population at extreme risk"],
            "medical_supplies": ["N95/P100 respirator masks", "Industrial-grade HEPA purifier", "Pulse oximeter", "Portable oxygen supply", "Nebulizer", "Emergency medical kit", "Prescribed bronchodilators", "Corticosteroids (if prescribed)"],
            "doctors_to_consult": ["Emergency Medicine Specialist (immediate)", "Pulmonologist (urgent)", "Cardiologist (urgent)", "Toxicologist", "Critical Care Specialist"]
        }


def generate_mock_historical_data(lat: float, lon: float, days: int = 365) -> list:
    """Generate realistic mock historical AQI data for demonstration."""
    np.random.seed(int(abs(lat * 100 + lon * 10)) % 2**31)
    
    base_aqi = 50 + abs(lat) * 0.5 + abs(lon) * 0.3
    data = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i)
        
        # Seasonal variation (winter = higher AQI)
        month = date.month
        seasonal_factor = 1.0
        if month in [11, 12, 1, 2]:
            seasonal_factor = 1.8
        elif month in [3, 4, 9, 10]:
            seasonal_factor = 1.2
        elif month in [5, 6, 7, 8]:
            seasonal_factor = 0.8
        
        # Daily noise
        noise = np.random.normal(0, 20)
        
        aqi = max(10, min(500, base_aqi * seasonal_factor + noise))
        
        pm25 = aqi * 0.15 + np.random.normal(0, 5)
        pm10 = aqi * 0.35 + np.random.normal(0, 10)
        no2 = aqi * 0.25 + np.random.normal(0, 8)
        so2 = aqi * 0.12 + np.random.normal(0, 3)
        o3 = max(5, 60 - aqi * 0.1 + np.random.normal(0, 10))
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "aqi": round(aqi),
            "pm25": round(max(0, pm25), 1),
            "pm10": round(max(0, pm10), 1),
            "no2": round(max(0, no2), 1),
            "so2": round(max(0, so2), 1),
            "o3": round(max(0, o3), 1),
            "temperature": round(20 + 10 * np.sin(2 * np.pi * (month - 6) / 12) + np.random.normal(0, 3), 1),
            "humidity": round(50 + 20 * np.sin(2 * np.pi * (month - 3) / 12) + np.random.normal(0, 10), 1),
            "wind_speed": round(max(0, 5 + np.random.normal(0, 3)), 1),
        })
    
    return data
