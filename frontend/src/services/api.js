// API Service — Centralized backend communication layer
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`API call failed for ${endpoint}, using fallback data:`, error.message);
        return null;
    }
}

// AQI Endpoints
export const fetchCurrentAQI = (lat, lon) =>
    fetchAPI(`/aqi/current?lat=${lat}&lon=${lon}`);

export const fetchHistoricalAQI = (lat, lon, days = 365) =>
    fetchAPI(`/aqi/historical?lat=${lat}&lon=${lon}&days=${days}`);

export const fetchCompareRegions = (regions) =>
    fetchAPI(`/aqi/compare?regions=${regions}`);

export const fetchHazardSources = (lat, lon, radius = 50) =>
    fetchAPI(`/aqi/hazards?lat=${lat}&lon=${lon}&radius_km=${radius}`);

// Weather Endpoints
export const fetchCurrentWeather = (lat, lon) =>
    fetchAPI(`/weather/current?lat=${lat}&lon=${lon}`);

export const fetchWeatherForecast = (lat, lon, hours = 48) =>
    fetchAPI(`/weather/forecast?lat=${lat}&lon=${lon}&hours=${hours}`);

// Satellite Endpoints
export const fetchTropomiData = (lat, lon, days = 30) =>
    fetchAPI(`/satellite/tropomi?lat=${lat}&lon=${lon}&days=${days}`);

export const fetchModisAOD = (lat, lon, days = 30) =>
    fetchAPI(`/satellite/modis-aod?lat=${lat}&lon=${lon}&days=${days}`);

// ML Prediction Endpoints
export const fetchAQIForecast = (lat, lon, hours = 48) =>
    fetchAPI(`/predict/forecast?lat=${lat}&lon=${lon}&hours=${hours}`);

export const fetchModelStatus = () =>
    fetchAPI(`/predict/model-status`);

// Chatbot Endpoints
export const sendChatMessage = (message, lat, lon, currentAqi, regionName) =>
    fetchAPI(`/chatbot/message`, {
        method: 'POST',
        body: JSON.stringify({
            message,
            lat,
            lon,
            current_aqi: currentAqi,
            region_name: regionName,
        }),
    });

// Hospital Endpoints
export const fetchNearbyHospitals = (lat, lon, radius = 15) =>
    fetchAPI(`/hospitals/nearby?lat=${lat}&lon=${lon}&radius_km=${radius}`);

// Geocoding (using Nominatim - free, no API key)
export const searchLocation = async (query) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        return await response.json();
    } catch {
        return [];
    }
};

export const reverseGeocode = async (lat, lon) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        return await response.json();
    } catch {
        return null;
    }
};
