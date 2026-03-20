"""
Satellite Data Routes
======================
Endpoints for Google Earth Engine satellite data integration.
Handles Sentinel-5P TROPOMI and MODIS AOD data.
"""

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import numpy as np
import os

router = APIRouter()

# Google Earth Engine initialization
# NOTE: Set GEE_SERVICE_ACCOUNT_KEY in .env to enable real satellite data
GEE_ENABLED = False
try:
    import ee
    gee_key = os.getenv("GEE_SERVICE_ACCOUNT_KEY")
    if gee_key and os.path.exists(gee_key):
        credentials = ee.ServiceAccountCredentials(
            email=None,
            key_file=gee_key
        )
        ee.Initialize(credentials)
        GEE_ENABLED = True
except Exception:
    pass


@router.get("/tropomi")
async def get_tropomi_data(
    lat: float = Query(...),
    lon: float = Query(...),
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Fetch Sentinel-5P TROPOMI atmospheric data.
    Provides NO2, SO2, and O3 column density measurements.
    """
    
    if GEE_ENABLED:
        try:
            point = ee.Geometry.Point([lon, lat])
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Sentinel-5P NO2
            no2_collection = (ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2')
                .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                .select('tropospheric_NO2_column_number_density')
                .filterBounds(point))
            
            no2_values = no2_collection.getRegion(point, 1000).getInfo()
            
            # Sentinel-5P SO2
            so2_collection = (ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_SO2')
                .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                .select('SO2_column_number_density')
                .filterBounds(point))
            
            so2_values = so2_collection.getRegion(point, 1000).getInfo()
            
            return {
                "source": "Sentinel-5P TROPOMI (Google Earth Engine)",
                "coordinates": {"lat": lat, "lon": lon},
                "no2_data": no2_values,
                "so2_data": so2_values,
                "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
            }
        except Exception as e:
            pass  # Fall through to simulated data
    
    # Simulated TROPOMI data
    np.random.seed(int(abs(lat * 100 + lon * 100)) % 2**31)
    
    data = []
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i)
        month = date.month
        seasonal = 1.5 if month in [11, 12, 1, 2] else 0.8
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "no2_column_density": round(max(0, 5e-5 * seasonal + np.random.normal(0, 1e-5)), 7),
            "so2_column_density": round(max(0, 2e-5 * seasonal + np.random.normal(0, 5e-6)), 7),
            "o3_column_density": round(max(0, 0.12 + np.random.normal(0, 0.01)), 4),
            "unit": "mol/m²"
        })
    
    return {
        "source": "Simulated Sentinel-5P TROPOMI",
        "note": "Connect Google Earth Engine API for real satellite data",
        "coordinates": {"lat": lat, "lon": lon},
        "period": f"Last {days} days",
        "data": data
    }


@router.get("/modis-aod")
async def get_modis_aod(
    lat: float = Query(...),
    lon: float = Query(...),
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Fetch MODIS Aerosol Optical Depth data.
    Tracks smoke, dust, and particulate matter in the atmosphere.
    """
    
    if GEE_ENABLED:
        try:
            point = ee.Geometry.Point([lon, lat])
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            aod_collection = (ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                .select('Optical_Depth_047')
                .filterBounds(point))
            
            aod_values = aod_collection.getRegion(point, 1000).getInfo()
            
            return {
                "source": "MODIS MCD19A2 AOD (Google Earth Engine)",
                "coordinates": {"lat": lat, "lon": lon},
                "data": aod_values
            }
        except Exception:
            pass
    
    # Simulated MODIS AOD data
    np.random.seed(int(abs(lat * 200 + lon * 300)) % 2**31)
    
    data = []
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i)
        month = date.month
        seasonal = 1.4 if month in [10, 11, 12, 1] else 0.9
        
        aod = max(0, 0.3 * seasonal + np.random.normal(0, 0.1))
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "aod_550nm": round(aod, 3),
            "quality": "Good" if aod < 0.5 else "Moderate" if aod < 1.0 else "Poor",
            "dust_flag": aod > 0.8,
            "smoke_flag": aod > 1.0
        })
    
    return {
        "source": "Simulated MODIS AOD",
        "note": "Connect Google Earth Engine API for real satellite data",
        "coordinates": {"lat": lat, "lon": lon},
        "period": f"Last {days} days",
        "statistics": {
            "avg_aod": round(np.mean([d["aod_550nm"] for d in data]), 3),
            "max_aod": round(np.max([d["aod_550nm"] for d in data]), 3),
            "high_aerosol_days": sum(1 for d in data if d["aod_550nm"] > 0.5)
        },
        "data": data
    }


@router.get("/status")
async def get_satellite_status():
    """Check the status of satellite data connections."""
    return {
        "gee_connected": GEE_ENABLED,
        "available_datasets": {
            "sentinel_5p_tropomi": {
                "description": "Atmospheric column analysis - NO2, SO2, O3",
                "status": "live" if GEE_ENABLED else "simulated",
                "collection_id": "COPERNICUS/S5P/OFFL/L3_NO2"
            },
            "modis_aod": {
                "description": "Aerosol Optical Depth - smoke and dust tracking",
                "status": "live" if GEE_ENABLED else "simulated",
                "collection_id": "MODIS/061/MCD19A2_GRANULES"
            }
        },
        "setup_instructions": "Set GEE_SERVICE_ACCOUNT_KEY in .env to enable real satellite data"
    }
