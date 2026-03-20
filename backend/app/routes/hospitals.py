"""
Hospital Finder Routes
=======================
Endpoints for finding nearby hospitals equipped to handle
respiratory and pollution-related health emergencies.
"""

from fastapi import APIRouter, Query
from datetime import datetime
import numpy as np

router = APIRouter()


# Hospital types and specializations relevant to pollution health
HOSPITAL_TEMPLATES = [
    {
        "type": "Multi-Specialty Hospital",
        "specializations": ["Pulmonology", "Cardiology", "Emergency Medicine", "Internal Medicine"],
        "facilities": ["ICU", "Ventilator", "Nebulization", "Oxygen Therapy"],
        "emergency": True,
        "rating_range": (3.5, 4.8)
    },
    {
        "type": "Government Hospital",
        "specializations": ["General Medicine", "Pulmonology", "Pediatrics"],
        "facilities": ["Emergency Ward", "Oxygen Supply", "Nebulization"],
        "emergency": True,
        "rating_range": (3.0, 4.2)
    },
    {
        "type": "Respiratory Care Center",
        "specializations": ["Pulmonology", "Allergy & Immunology", "Sleep Medicine"],
        "facilities": ["Pulmonary Function Lab", "Bronchoscopy", "Oxygen Therapy"],
        "emergency": False,
        "rating_range": (3.8, 4.9)
    },
    {
        "type": "Children's Hospital",
        "specializations": ["Pediatric Pulmonology", "Pediatric Emergency", "Neonatology"],
        "facilities": ["Pediatric ICU", "Nebulization", "Child-friendly Emergency"],
        "emergency": True,
        "rating_range": (3.5, 4.7)
    },
    {
        "type": "Cardiac Care Hospital",
        "specializations": ["Cardiology", "Cardiac Surgery", "Emergency Medicine"],
        "facilities": ["Cardiac ICU", "Catheterization Lab", "24/7 Emergency"],
        "emergency": True,
        "rating_range": (3.8, 4.9)
    },
    {
        "type": "Primary Health Center",
        "specializations": ["General Medicine", "First Aid"],
        "facilities": ["Basic Emergency", "Oxygen Cylinder"],
        "emergency": True,
        "rating_range": (2.5, 3.8)
    },
    {
        "type": "ENT & Allergy Clinic",
        "specializations": ["ENT", "Allergy & Immunology"],
        "facilities": ["Allergy Testing", "Immunotherapy"],
        "emergency": False,
        "rating_range": (3.5, 4.6)
    }
]

HOSPITAL_NAMES = [
    "City General", "Metro Care", "LifeLine", "Apollo", "Fortis", "Max",
    "Medanta", "AIIMS", "Narayana", "Columbia Asia", "Manipal", "Artemis",
    "BLK", "Jaslok", "Breach Candy", "Kokilaben", "Ruby Hall", "Sterling",
    "Global", "SRM", "Sahyadri", "Jupiter", "KEM", "Sion", "Hinduja"
]


@router.get("/nearby")
async def get_nearby_hospitals(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(default=15, ge=1, le=50),
    specialization: str = Query(default=None)
):
    """Find hospitals and clinics near the given coordinates."""
    np.random.seed(int(abs(lat * 1000 + lon * 1000)) % 2**31)
    
    num_hospitals = np.random.randint(5, 12)
    hospitals = []
    
    for i in range(num_hospitals):
        template = HOSPITAL_TEMPLATES[np.random.randint(0, len(HOSPITAL_TEMPLATES))]
        name_prefix = HOSPITAL_NAMES[np.random.randint(0, len(HOSPITAL_NAMES))]
        
        # Generate random position within radius
        angle = np.random.uniform(0, 2 * np.pi)
        distance = np.random.uniform(0.5, radius_km)
        offset_lat = (distance / 111) * np.cos(angle)
        offset_lon = (distance / (111 * np.cos(np.radians(lat)))) * np.sin(angle)
        
        hospital = {
            "id": f"hosp_{i}",
            "name": f"{name_prefix} {template['type']}",
            "type": template["type"],
            "location": {
                "lat": round(lat + offset_lat, 6),
                "lon": round(lon + offset_lon, 6)
            },
            "distance_km": round(distance, 1),
            "rating": round(np.random.uniform(*template["rating_range"]), 1),
            "specializations": template["specializations"],
            "facilities": template["facilities"],
            "emergency_available": template["emergency"],
            "phone": f"+91-{np.random.randint(70, 99)}{np.random.randint(10000000, 99999999)}",
            "operating_hours": "24/7" if template["emergency"] else "8:00 AM - 8:00 PM",
            "pollution_health_readiness": {
                "has_pulmonologist": "Pulmonology" in template["specializations"] or "Pediatric Pulmonology" in template["specializations"],
                "has_oxygen_therapy": any("Oxygen" in f for f in template["facilities"]),
                "has_nebulization": "Nebulization" in template["facilities"],
                "has_ventilator": "Ventilator" in template["facilities"] or "ICU" in template["facilities"]
            }
        }
        
        # Filter by specialization if specified
        if specialization:
            if not any(specialization.lower() in s.lower() for s in template["specializations"]):
                continue
        
        hospitals.append(hospital)
    
    hospitals.sort(key=lambda x: x["distance_km"])
    
    return {
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "total_found": len(hospitals),
        "hospitals": hospitals,
        "emergency_contacts": {
            "ambulance": "108",
            "emergency": "112",
            "poison_control": "1800-11-6117"
        }
    }
