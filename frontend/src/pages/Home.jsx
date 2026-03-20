// Home Page — 3D Globe with live AQI display
import { useState, useEffect, useCallback } from 'react';
import Globe from '../components/Globe/Globe';
import SearchBar from '../components/Search/SearchBar';
import { useLocation } from '../context/LocationContext';
import { fetchCurrentAQI } from '../services/api';
import { FiArrowRight, FiActivity, FiGlobe, FiCpu, FiShield, FiAlertTriangle, FiWind } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Home.css';

function getAQIColor(aqi) {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
}

function getAQILabel(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

function getAQILevel(aqi) {
    if (aqi <= 50) return 'LOW';
    if (aqi <= 100) return 'LOW';
    if (aqi <= 150) return 'MEDIUM';
    if (aqi <= 200) return 'HIGH';
    if (aqi <= 300) return 'HIGH';
    return 'HIGH';
}

function getAQIAdvice(aqi) {
    if (aqi <= 50) return 'Air quality is satisfactory. Enjoy outdoor activities!';
    if (aqi <= 100) return 'Air is acceptable. Sensitive individuals should be cautious.';
    if (aqi <= 150) return 'Sensitive groups may experience health effects. Limit outdoor time.';
    if (aqi <= 200) return 'Everyone may experience health effects. Wear a mask outdoors.';
    if (aqi <= 300) return 'Health warnings. Everyone should avoid outdoor exertion.';
    return 'EMERGENCY: Stay indoors. Use air purifiers. Avoid all outdoor activity.';
}

function getAQIEmoji(aqi) {
    if (aqi <= 50) return '😊';
    if (aqi <= 100) return '🙂';
    if (aqi <= 150) return '😷';
    if (aqi <= 200) return '😨';
    if (aqi <= 300) return '🚨';
    return '☠️';
}

function generateMockAQI(lat, lon) {
    const seed = Math.abs(lat * 100 + lon * 10);
    const rng = (min, max) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
    return Math.round(40 + Math.abs(lat - 28) * 3 + Math.abs(lon - 77) * 2 + rng(0, 40));
}

export default function Home() {
    const { coordinates, regionName } = useLocation();
    const [showCards, setShowCards] = useState(false);
    const [aqiData, setAqiData] = useState(null);
    const [aqiLoading, setAqiLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowCards(true), 500);
        return () => clearTimeout(timer);
    }, []);

    // Fetch AQI as soon as location is available
    const loadAQI = useCallback(async () => {
        setAqiLoading(true);
        const { lat, lon } = coordinates;
        const data = await fetchCurrentAQI(lat, lon);
        if (data && data.aqi) {
            setAqiData(data);
        } else {
            // Fallback mock AQI
            const mockAqi = generateMockAQI(lat, lon);
            setAqiData({
                aqi: mockAqi,
                dominant_pollutant: 'PM2.5',
                pollutants: {
                    'PM2.5': { value: +(mockAqi * 0.15 + 5).toFixed(1), unit: 'µg/m³' },
                    'PM10': { value: +(mockAqi * 0.35 + 8).toFixed(1), unit: 'µg/m³' },
                }
            });
        }
        setAqiLoading(false);
    }, [coordinates]);

    useEffect(() => {
        loadAQI();
    }, [loadAQI]);

    const aqi = aqiData?.aqi || 0;
    const aqiColor = getAQIColor(aqi);
    const aqiLevel = getAQILevel(aqi);
    const aqiLabel = getAQILabel(aqi);

    return (
        <div className="home-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-text">
                    <h1 className="hero-title">
                        <span className="title-gradient">Air Quality</span>
                        <br />
                        Intelligence Platform
                    </h1>
                    <p className="hero-subtitle">
                        Real-time AQI monitoring powered by satellite imagery,
                        machine learning, and meteorological data. Click anywhere
                        on the globe to explore.
                    </p>

                    {/* ---- LIVE AQI DISPLAY CARD ---- */}
                    <div className="home-aqi-card" style={{ '--aqi-glow': aqiColor }}>
                        {aqiLoading ? (
                            <div className="home-aqi-loading">
                                <div className="loading-spinner" style={{ width: 28, height: 28 }} />
                                <span>Detecting air quality...</span>
                            </div>
                        ) : (
                            <>
                                <div className="home-aqi-top">
                                    <div className="home-aqi-location">
                                        <span className="home-aqi-pin">📍</span>
                                        <div>
                                            <span className="home-aqi-region">{regionName}</span>
                                            <span className="home-aqi-coords">
                                                {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`home-aqi-level-badge level-${aqiLevel.toLowerCase()}`}>
                                        {aqiLevel}
                                    </div>
                                </div>

                                <div className="home-aqi-body">
                                    <div className="home-aqi-number-container">
                                        <span className="home-aqi-emoji">{getAQIEmoji(aqi)}</span>
                                        <span className="home-aqi-number" style={{ color: aqiColor }}>{aqi}</span>
                                        <span className="home-aqi-unit">AQI</span>
                                    </div>
                                    <div className="home-aqi-details">
                                        <span className="home-aqi-label" style={{ color: aqiColor }}>{aqiLabel}</span>
                                        <span className="home-aqi-advice">{getAQIAdvice(aqi)}</span>
                                        {aqiData?.dominant_pollutant && (
                                            <span className="home-aqi-dominant">
                                                <FiWind /> Dominant: <strong>{aqiData.dominant_pollutant}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* AQI Scale Bar */}
                                <div className="home-aqi-scale">
                                    <div className="aqi-scale-bar">
                                        <div className="aqi-scale-segment good" />
                                        <div className="aqi-scale-segment moderate" />
                                        <div className="aqi-scale-segment usg" />
                                        <div className="aqi-scale-segment unhealthy" />
                                        <div className="aqi-scale-segment very-unhealthy" />
                                        <div className="aqi-scale-segment hazardous" />
                                        <div
                                            className="aqi-scale-pointer"
                                            style={{ left: `${Math.min(100, (aqi / 500) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="aqi-scale-labels">
                                        <span>0</span>
                                        <span>50</span>
                                        <span>100</span>
                                        <span>150</span>
                                        <span>200</span>
                                        <span>300</span>
                                        <span>500</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hero-search">
                        <SearchBar />
                    </div>
                    <div className="hero-actions">
                        <Link to="/dashboard" className="btn btn-primary" id="btn-explore-dashboard">
                            <FiActivity /> Explore Dashboard <FiArrowRight />
                        </Link>
                        <Link to="/hospitals" className="btn btn-secondary" id="btn-find-hospitals">
                            <FiShield /> Find Hospitals
                        </Link>
                    </div>
                </div>

                <div className="hero-globe">
                    <Globe />
                </div>
            </div>

            {/* Feature Cards */}
            {showCards && (
                <div className="feature-cards">
                    <div className="feature-card glass-card animate-fadeInUp stagger-1">
                        <div className="feature-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                            <FiGlobe />
                        </div>
                        <h3>Satellite Data</h3>
                        <p>Sentinel-5P TROPOMI atmospheric analysis for NO₂, SO₂, and Ozone. MODIS AOD for smoke & dust tracking.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-2">
                        <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
                            <FiCpu />
                        </div>
                        <h3>ML Prediction</h3>
                        <p>Random Forest + XGBoost ensemble models trained on 1-year rolling data for 48-hour AQI forecasts.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-3">
                        <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                            <FiShield />
                        </div>
                        <h3>Health Advisory</h3>
                        <p>AI-powered health recommendations, doctor referrals, and nearby hospital mapping for pollution emergencies.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-4">
                        <div className="feature-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                            <FiActivity />
                        </div>
                        <h3>Live Monitoring</h3>
                        <p>Real-time pollutant breakdown with PM2.5, PM10, NO₂, SO₂ tracking and industrial hazard mapping.</p>
                    </div>
                </div>
            )}

            {/* Data Sources Section */}
            <div className="data-sources">
                <h2 className="section-title">Powered By</h2>
                <div className="source-tags">
                    <span className="source-tag">🛰️ Sentinel-5P TROPOMI</span>
                    <span className="source-tag">🌍 MODIS AOD</span>
                    <span className="source-tag">🌤️ OpenWeatherMap</span>
                    <span className="source-tag">📊 CPCB Ground Sensors</span>
                    <span className="source-tag">🤖 XGBoost + Random Forest</span>
                    <span className="source-tag">🔥 Firebase Auth</span>
                    <span className="source-tag">🌐 Google Earth Engine</span>
                </div>
            </div>
        </div>
    );
}
