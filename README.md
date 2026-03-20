# 🌍 AQI Sentinel — Air Quality Intelligence Platform

A full-stack web application for predicting and analyzing the Air Quality Index (AQI) using satellite data, meteorological intelligence, and machine learning.

![AQI Sentinel](https://img.shields.io/badge/AQI-Sentinel-06b6d4?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)
![Three.js](https://img.shields.io/badge/Three.js-3D_Globe-black?style=for-the-badge&logo=three.js)

## 🚀 Features

### 🌐 Interactive 3D Globe
- Fully rotatable Three.js Earth with procedural textures
- Click-to-select coordinates for any region
- Location search with autocomplete

### 📊 Real-time AQI Dashboard
- Current AQI with pollutant breakdown (PM2.5, PM10, NO₂, SO₂, O₃)
- 30-day historical trend analysis
- Weather conditions with PBLH dispersion analysis
- Health advisory system

### 🤖 ML-Powered 48-Hour Forecast
- Random Forest + XGBoost ensemble model
- Hourly AQI predictions with confidence intervals
- Model accuracy tracking (R², RMSE)
- Feature importance analysis

### 🛰️ Satellite Data Integration
- Sentinel-5P TROPOMI (NO₂, SO₂, O₃ column density)
- MODIS Aerosol Optical Depth (smoke & dust tracking)
- Google Earth Engine API integration

### 💬 AI Health Chatbot
- Context-aware health advisory based on current AQI
- Mask recommendations, doctor referrals
- Exercise guidelines during poor air quality
- Child safety protocols

### 🏥 Hospital Finder
- Leaflet map with nearby hospitals
- Filter by emergency, pulmonology
- Pollution health readiness indicators
- Emergency contact numbers

### 🔐 Firebase Authentication
- Email/Password login and registration
- Protected routes and user profiles

## 📁 Project Structure

```
aqi/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── Globe/       # 3D Earth (Three.js)
│       │   ├── Dashboard/   # Charts (Recharts)
│       │   ├── Chatbot/     # AI Health Assistant
│       │   ├── HospitalMap/ # Leaflet hospital map
│       │   ├── Auth/        # Login/Signup
│       │   ├── Search/      # Location search
│       │   └── Layout/      # Header
│       ├── context/         # Auth + Location
│       ├── services/        # API + Firebase
│       └── pages/           # Home
│
└── backend/           # Python FastAPI
    └── app/
        ├── routes/    # API endpoints
        ├── services/  # GEE, ML, Weather
        └── utils/     # AQI calculator
```

## 🛠️ Setup Instructions

### Frontend

```bash
cd frontend
cp .env.example .env   # Configure Firebase keys
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Configure API keys
uvicorn app.main:app --reload
```

## 🔑 API Keys Required

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| Firebase | `VITE_FIREBASE_*` | Authentication |
| OpenWeatherMap | `OPENWEATHER_API_KEY` | Weather data |
| Google Earth Engine | `GEE_SERVICE_ACCOUNT_KEY` | Satellite imagery |

> **Note:** The application works without API keys using simulated data for demonstration purposes.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/aqi/current` | GET | Current AQI for coordinates |
| `/api/aqi/historical` | GET | Historical AQI trends |
| `/api/aqi/compare` | GET | Multi-region comparison |
| `/api/aqi/hazards` | GET | Nearby pollution sources |
| `/api/weather/current` | GET | Current weather data |
| `/api/predict/forecast` | GET | 48-hour AQI prediction |
| `/api/chatbot/message` | POST | Health advisory chat |
| `/api/hospitals/nearby` | GET | Nearby hospital finder |
| `/api/satellite/tropomi` | GET | Sentinel-5P data |
| `/api/satellite/modis-aod` | GET | MODIS AOD data |

## 🧪 Tech Stack

- **Frontend:** React 19, Three.js, Recharts, Leaflet, React Router
- **Backend:** Python FastAPI, NumPy, Pandas, Scikit-learn, XGBoost
- **Auth:** Firebase Authentication
- **Data:** Google Earth Engine, OpenWeatherMap, CPCB
- **ML:** Random Forest + XGBoost Ensemble

## 📝 License

MIT License
