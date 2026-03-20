// Dashboard Component — AQI data visualization with charts and pollutant breakdown
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '../../context/LocationContext';
import { fetchCurrentAQI, fetchHistoricalAQI, fetchAQIForecast, fetchCurrentWeather, fetchHazardSources } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { FiWind, FiDroplet, FiThermometer, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

// AQI color helper
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
    if (aqi <= 150) return 'USG';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

// Mock data generator for when backend is not available
function generateMockData(lat, lon) {
    const seed = Math.abs(lat * 100 + lon * 10);
    const rng = (min, max) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
    const baseAqi = Math.round(40 + Math.abs(lat - 28) * 3 + Math.abs(lon - 77) * 2 + rng(0, 40));

    return {
        aqi: baseAqi,
        category: { label: getAQILabel(baseAqi), color: getAQIColor(baseAqi) },
        dominant_pollutant: 'PM2.5',
        pollutants: {
            'PM2.5': { value: +(baseAqi * 0.15 + rng(0, 10)).toFixed(1), unit: 'µg/m³', sub_aqi: Math.round(baseAqi * 0.9) },
            'PM10': { value: +(baseAqi * 0.35 + rng(0, 15)).toFixed(1), unit: 'µg/m³', sub_aqi: Math.round(baseAqi * 0.7) },
            'NO2': { value: +(baseAqi * 0.25 + rng(0, 8)).toFixed(1), unit: 'ppb', sub_aqi: Math.round(baseAqi * 0.5) },
            'SO2': { value: +(baseAqi * 0.12 + rng(0, 5)).toFixed(1), unit: 'ppb', sub_aqi: Math.round(baseAqi * 0.3) },
            'O3': { value: +(45 + rng(0, 20)).toFixed(1), unit: 'ppb', sub_aqi: Math.round(40 + rng(0, 20)) },
            'CO': { value: +(0.5 + rng(0, 0.5)).toFixed(2), unit: 'ppm' },
        },
        health_advisory: {
            level: getAQILabel(baseAqi),
            recommended_actions: ['Monitor air quality', 'Limit outdoor activities if sensitive', 'Keep doors closed'],
            medical_supplies: ['N95 mask'],
            doctors_to_consult: ['Pulmonologist']
        }
    };
}

function generateMockForecast() {
    const predictions = [];
    let aqi = 70 + Math.random() * 60;
    for (let h = 0; h < 48; h++) {
        const hour = (new Date().getHours() + h) % 24;
        const diurnal = 15 * Math.sin(2 * Math.PI * (hour - 8) / 24);
        aqi += (Math.random() - 0.5) * 8;
        aqi = Math.max(15, Math.min(350, aqi + diurnal * 0.3));
        predictions.push({
            hour_ahead: h + 1,
            predicted_aqi: Math.round(aqi),
            timestamp: new Date(Date.now() + h * 3600000).toISOString(),
            confidence: +(0.95 - h * 0.008).toFixed(3),
            prediction_interval: { lower: Math.round(aqi - 15 - h * 0.5), upper: Math.round(aqi + 15 + h * 0.5) }
        });
    }
    return {
        summary: { aqi_24h_forecast: predictions[23]?.predicted_aqi, aqi_48h_forecast: predictions[47]?.predicted_aqi, trend: 'stable' },
        hourly_predictions: predictions,
        evaluation_metrics: { r2_score: 0.87, rmse: 12.4, accuracy_grade: 'A', miss_factor: 12.4 }
    };
}

function generateMockHistory() {
    const data = [];
    let aqi = 80;
    for (let i = 30; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        aqi += (Math.random() - 0.48) * 15;
        aqi = Math.max(20, Math.min(300, aqi));
        data.push({
            date: date.toISOString().split('T')[0],
            aqi: Math.round(aqi),
            pm25: +(aqi * 0.15 + Math.random() * 8).toFixed(1),
            pm10: +(aqi * 0.35 + Math.random() * 12).toFixed(1),
            no2: +(aqi * 0.2 + Math.random() * 6).toFixed(1),
        });
    }
    return { data, statistics: { average_aqi: Math.round(data.reduce((s, d) => s + d.aqi, 0) / data.length) } };
}

export default function Dashboard() {
    const { coordinates, regionName } = useLocation();
    const [currentData, setCurrentData] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [history, setHistory] = useState(null);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const loadData = useCallback(async () => {
        setLoading(true);
        const { lat, lon } = coordinates;

        // Try API first, fallback to mock
        const [aqiData, forecastData, historyData, weatherData] = await Promise.all([
            fetchCurrentAQI(lat, lon),
            fetchAQIForecast(lat, lon, 48),
            fetchHistoricalAQI(lat, lon, 30),
            fetchCurrentWeather(lat, lon),
        ]);

        setCurrentData(aqiData || generateMockData(lat, lon));
        setForecast(forecastData || generateMockForecast());
        setHistory(historyData || generateMockHistory());
        setWeather(weatherData);
        setLoading(false);
    }, [coordinates]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading AQI data for {regionName}...</p>
            </div>
        );
    }

    const aqi = currentData?.aqi || 0;
    const aqiColor = getAQIColor(aqi);
    const pollutants = currentData?.pollutants || {};
    const forecastPredictions = forecast?.hourly_predictions || [];
    const historyData = history?.data || [];
    const metrics = forecast?.evaluation_metrics || {};

    // Radar chart data
    const radarData = Object.entries(pollutants).filter(([_, v]) => v.sub_aqi).map(([name, val]) => ({
        pollutant: name,
        value: val.sub_aqi,
        fullMark: 300
    }));

    return (
        <div className="dashboard">
            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                {['overview', 'forecast', 'trends', 'pollutants', 'advisory'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Region Header */}
            <div className="dashboard-header">
                <div className="region-info">
                    <h2>📍 {regionName}</h2>
                    <p className="coords">
                        {coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E
                    </p>
                </div>
                <div className="aqi-hero" style={{ '--aqi-color': aqiColor }}>
                    <div className="aqi-number" style={{ color: aqiColor }}>{aqi}</div>
                    <div className="aqi-label" style={{ backgroundColor: aqiColor + '20', color: aqiColor }}>
                        {currentData?.category?.label || getAQILabel(aqi)}
                    </div>
                    <div className="aqi-dominant">
                        Dominant: <strong>{currentData?.dominant_pollutant || 'PM2.5'}</strong>
                    </div>
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="dashboard-grid">
                    {/* Quick Stats */}
                    <div className="glass-card animate-fadeInUp">
                        <h3 className="card-title">📊 Quick Stats</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="label">Current AQI</span>
                                <span className="value" style={{ color: aqiColor }}>{aqi}</span>
                                <span className="sub-text">{getAQILabel(aqi)}</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">24h Forecast</span>
                                <span className="value" style={{ color: getAQIColor(forecast?.summary?.aqi_24h_forecast || aqi) }}>
                                    {forecast?.summary?.aqi_24h_forecast || '—'}
                                </span>
                                <span className="sub-text">
                                    {forecast?.summary?.trend === 'improving' ? '↓ Improving' : forecast?.summary?.trend === 'worsening' ? '↑ Worsening' : '→ Stable'}
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="label">48h Forecast</span>
                                <span className="value" style={{ color: getAQIColor(forecast?.summary?.aqi_48h_forecast || aqi) }}>
                                    {forecast?.summary?.aqi_48h_forecast || '—'}
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="label">Model Accuracy</span>
                                <span className="value" style={{ color: 'var(--accent-emerald)' }}>
                                    {metrics.accuracy_grade || 'A'}
                                </span>
                                <span className="sub-text">R² = {metrics.r2_score || 0.87}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pollutant Breakdown */}
                    <div className="glass-card animate-fadeInUp stagger-2">
                        <h3 className="card-title">🔬 Pollutant Breakdown</h3>
                        <div className="pollutant-list">
                            {Object.entries(pollutants).map(([name, data]) => (
                                <div key={name} className="pollutant-row">
                                    <div className="pollutant-info">
                                        <span className="pollutant-name">{name}</span>
                                        <span className="pollutant-value">{data.value} {data.unit}</span>
                                    </div>
                                    <div className="pollutant-bar-bg">
                                        <div
                                            className="pollutant-bar"
                                            style={{
                                                width: `${Math.min(100, (data.sub_aqi || data.value * 2) / 3)}%`,
                                                background: getAQIColor(data.sub_aqi || 50)
                                            }}
                                        />
                                    </div>
                                    {data.sub_aqi && (
                                        <span className="pollutant-aqi" style={{ color: getAQIColor(data.sub_aqi) }}>
                                            {data.sub_aqi}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather Card */}
                    {weather && (
                        <div className="glass-card animate-fadeInUp stagger-3">
                            <h3 className="card-title">🌤️ Weather Conditions</h3>
                            <div className="weather-grid">
                                <div className="weather-item">
                                    <FiThermometer className="weather-icon" style={{ color: 'var(--accent-amber)' }} />
                                    <span className="weather-label">Temperature</span>
                                    <span className="weather-value">{weather.weather?.temperature || '—'}°C</span>
                                </div>
                                <div className="weather-item">
                                    <FiDroplet className="weather-icon" style={{ color: 'var(--accent-blue)' }} />
                                    <span className="weather-label">Humidity</span>
                                    <span className="weather-value">{weather.weather?.humidity || '—'}%</span>
                                </div>
                                <div className="weather-item">
                                    <FiWind className="weather-icon" style={{ color: 'var(--accent-cyan)' }} />
                                    <span className="weather-label">Wind Speed</span>
                                    <span className="weather-value">{weather.weather?.wind_speed || '—'} m/s</span>
                                </div>
                                <div className="weather-item">
                                    <FiAlertTriangle className="weather-icon" style={{ color: 'var(--accent-purple)' }} />
                                    <span className="weather-label">PBLH</span>
                                    <span className="weather-value">{weather.weather?.pblh || '—'} m</span>
                                </div>
                            </div>
                            {weather.pollution_dispersion && (
                                <div className="dispersion-info">
                                    <span className="dispersion-badge" data-status={weather.pollution_dispersion?.pblh_status?.includes('Good') ? 'good' : 'bad'}>
                                        {weather.pollution_dispersion?.pblh_status}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}


                </div>
            )}

            {/* Forecast Tab */}
            {activeTab === 'forecast' && (
                <div className="dashboard-grid">
                    <div className="glass-card full-width animate-fadeInUp">
                        <h3 className="card-title">📈 48-Hour AQI Forecast</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={forecastPredictions.filter((_, i) => i % 2 === 0)}>
                                    <defs>
                                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis
                                        dataKey="hour_ahead"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickFormatter={(v) => `+${v}h`}
                                    />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1a2235',
                                            border: '1px solid rgba(6,182,212,0.3)',
                                            borderRadius: '8px',
                                            color: '#f1f5f9'
                                        }}
                                        formatter={(value, name) => {
                                            if (name === 'predicted_aqi') return [value, 'Predicted AQI'];
                                            return [value, name];
                                        }}
                                        labelFormatter={(v) => `+${v} hours`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="prediction_interval.upper"
                                        stroke="none"
                                        fill="rgba(6,182,212,0.08)"
                                        name="Upper Bound"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="prediction_interval.lower"
                                        stroke="none"
                                        fill="var(--bg-primary)"
                                        name="Lower Bound"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted_aqi"
                                        stroke="#06b6d4"
                                        strokeWidth={2.5}
                                        dot={false}
                                        name="Predicted AQI"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Model Metrics */}
                    <div className="glass-card animate-fadeInUp stagger-2">
                        <h3 className="card-title">🤖 Model Performance</h3>
                        <div className="metrics-grid">
                            <div className="metric-item">
                                <span className="metric-label">Accuracy Grade</span>
                                <span className="metric-value grade">{metrics.accuracy_grade || 'A'}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">R² Score</span>
                                <span className="metric-value">{metrics.r2_score || 0.87}</span>
                                <div className="metric-bar">
                                    <div className="metric-fill" style={{ width: `${(metrics.r2_score || 0.87) * 100}%` }} />
                                </div>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Miss Factor (RMSE)</span>
                                <span className="metric-value">{metrics.rmse || 12.4} AQI units</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Algorithms</span>
                                <span className="metric-tags">
                                    <span className="tag">Random Forest</span>
                                    <span className="tag">XGBoost</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Forecast Summary */}
                    <div className="glass-card animate-fadeInUp stagger-3">
                        <h3 className="card-title">📋 Forecast Summary</h3>
                        <div className="forecast-summary">
                            <div className="forecast-item">
                                <span className="forecast-time">+24 Hours</span>
                                <FiArrowRight />
                                <span className="forecast-aqi" style={{ color: getAQIColor(forecast?.summary?.aqi_24h_forecast || aqi) }}>
                                    AQI {forecast?.summary?.aqi_24h_forecast || '—'}
                                </span>
                            </div>
                            <div className="forecast-item highlight">
                                <span className="forecast-time">+48 Hours</span>
                                <FiArrowRight />
                                <span className="forecast-aqi" style={{ color: getAQIColor(forecast?.summary?.aqi_48h_forecast || aqi) }}>
                                    AQI {forecast?.summary?.aqi_48h_forecast || '—'}
                                </span>
                            </div>
                            <div className="forecast-trend">
                                {forecast?.summary?.trend === 'improving' ? (
                                    <><FiTrendingDown style={{ color: 'var(--accent-emerald)' }} /> <span style={{ color: 'var(--accent-emerald)' }}>Improving Trend</span></>
                                ) : forecast?.summary?.trend === 'worsening' ? (
                                    <><FiTrendingUp style={{ color: 'var(--accent-rose)' }} /> <span style={{ color: 'var(--accent-rose)' }}>Worsening Trend</span></>
                                ) : (
                                    <><FiArrowRight style={{ color: 'var(--accent-amber)' }} /> <span style={{ color: 'var(--accent-amber)' }}>Stable</span></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
                <div className="dashboard-grid">
                    <div className="glass-card full-width animate-fadeInUp">
                        <h3 className="card-title">📉 30-Day AQI Trend</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={v => v.slice(5)} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a2235', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#f1f5f9' }}
                                    />
                                    <Area type="monotone" dataKey="aqi" stroke="#8b5cf6" fill="url(#histGrad)" strokeWidth={2} />
                                    {/* Threshold lines */}
                                    <Line type="monotone" dataKey={() => 100} stroke="#ffff00" strokeDasharray="5 5" dot={false} name="Moderate" />
                                    <Line type="monotone" dataKey={() => 200} stroke="#ff0000" strokeDasharray="5 5" dot={false} name="Unhealthy" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card animate-fadeInUp stagger-2">
                        <h3 className="card-title">📊 Pollutant Trends</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={historyData.slice(-14)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={v => v.slice(5)} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', color: '#f1f5f9' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="pm25" stroke="#06b6d4" strokeWidth={2} dot={false} name="PM2.5" />
                                    <Line type="monotone" dataKey="pm10" stroke="#f59e0b" strokeWidth={2} dot={false} name="PM10" />
                                    <Line type="monotone" dataKey="no2" stroke="#f43f5e" strokeWidth={2} dot={false} name="NO2" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="glass-card animate-fadeInUp stagger-3">
                        <h3 className="card-title">📈 Period Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="label">Average AQI</span>
                                <span className="value">{history?.statistics?.average_aqi || '—'}</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">Peak AQI</span>
                                <span className="value" style={{ color: 'var(--accent-rose)' }}>{Math.max(...historyData.map(d => d.aqi))}</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">Lowest AQI</span>
                                <span className="value" style={{ color: 'var(--accent-emerald)' }}>{Math.min(...historyData.map(d => d.aqi))}</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">Good Days</span>
                                <span className="value" style={{ color: '#00e400' }}>{historyData.filter(d => d.aqi <= 50).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pollutants Tab */}
            {activeTab === 'pollutants' && (
                <div className="dashboard-grid">
                    <div className="glass-card animate-fadeInUp">
                        <h3 className="card-title">🎯 Pollutant Radar</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={320}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(148,163,184,0.15)" />
                                    <PolarAngleAxis dataKey="pollutant" stroke="#94a3b8" fontSize={12} />
                                    <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                                    <Radar name="Sub-AQI" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card animate-fadeInUp stagger-2">
                        <h3 className="card-title">🧪 Detailed Readings</h3>
                        <div className="detail-table">
                            <div className="table-header">
                                <span>Pollutant</span>
                                <span>Value</span>
                                <span>Sub-AQI</span>
                                <span>Status</span>
                            </div>
                            {Object.entries(pollutants).map(([name, data]) => (
                                <div key={name} className="table-row">
                                    <span className="cell-name">{name}</span>
                                    <span className="cell-value">{data.value} {data.unit}</span>
                                    <span className="cell-aqi" style={{ color: getAQIColor(data.sub_aqi || 50) }}>
                                        {data.sub_aqi || '—'}
                                    </span>
                                    <span className="cell-status">
                                        <span className="status-dot" style={{ background: getAQIColor(data.sub_aqi || 50) }} />
                                        {getAQILabel(data.sub_aqi || 50)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bar chart of pollutant comparison */}
                    <div className="glass-card full-width animate-fadeInUp stagger-3">
                        <h3 className="card-title">📊 Sub-AQI Comparison</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={radarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey="pollutant" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', color: '#f1f5f9' }} />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Sub-AQI" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Advisory Tab */}
            {activeTab === 'advisory' && (
                <div className="dashboard-grid">
                    {/* Current Advisory */}
                    <div className="glass-card full-width animate-fadeInUp">
                        <h3 className="card-title">🏥 Current Health Advisory</h3>
                        <div className="advisory-content">
                            <div className="advisory-level" style={{ color: aqiColor }}>
                                {currentData?.health_advisory?.level || 'Moderate'}
                            </div>
                            <ul className="advisory-actions">
                                {(currentData?.health_advisory?.recommended_actions || []).map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                            {currentData?.health_advisory?.doctors_to_consult?.length > 0 && (
                                <div className="advisory-doctors">
                                    <strong>Consult:</strong> {currentData.health_advisory.doctors_to_consult.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Emergency First Aid (Before Ambulance) */}
                    <div className="glass-card full-width animate-fadeInUp stagger-2">
                        <h3 className="card-title">🚑 Emergency First Aid (Before Ambulance arrives)</h3>
                        <div className="first-aid-grid">
                            <div className="first-aid-item">
                                <h4>Asthma Attack</h4>
                                <ul>
                                    <li>Sit the person upright and loosen tight clothing.</li>
                                    <li>Help them use their inhaler immediately using a spacer if available.</li>
                                    <li>Encourage slow, calm breaths. Do not lay the person down.</li>
                                    <li>If there is no improvement after 5-10 minutes, call an ambulance.</li>
                                </ul>
                            </div>
                            <div className="first-aid-item">
                                <h4>Heart Attack</h4>
                                <ul>
                                    <li>Have the person sit down, rest, and try to keep calm. Loosen tight clothing.</li>
                                    <li>Ask if they take any chest pain medication (like nitroglycerin) and help them take it.</li>
                                    <li>Call emergency services immediately.</li>
                                    <li>If they become unconscious and unresponsive, begin CPR immediately.</li>
                                </ul>
                            </div>
                            <div className="first-aid-item">
                                <h4>Stroke</h4>
                                <ul>
                                    <li>Think <strong>F.A.S.T.</strong> - Face drooping, Arm weakness, Speech difficulty, Time to call emergency.</li>
                                    <li>Call emergency services immediately and note the time the symptoms started.</li>
                                    <li>Keep the person safe and at rest. Do not give them anything to eat or drink.</li>
                                    <li>If they are unconscious, place them in the recovery position.</li>
                                </ul>
                            </div>
                            <div className="first-aid-item">
                                <h4>Severe Allergic Reaction & Respiratory Distress</h4>
                                <ul>
                                    <li>Ask if they have an epinephrine auto-injector (EpiPen) and help them use it.</li>
                                    <li>Call emergency services immediately, even if they used the EpiPen.</li>
                                    <li>Have the person lie down flat. Do not let them stand or walk.</li>
                                    <li>If breathing becomes difficult, loosen clothing and elevate their legs.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
