import { useState, useRef, useEffect, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import { FiAlertTriangle, FiInfo, FiActivity } from 'react-icons/fi';
import './AQISimulator.css';

// Reuse AQI logic
function getAQIColor(aqi) {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
}

function getAQIImpacts(aqi) {
    if (aqi <= 50) return {
        biological: [
            "Normal breathing volume. Minimal to no health implications.",
            "Lungs process oxygen with maximum efficiency.",
            "Perfect conditions for intense cardiovascular exercise."
        ],
        environmental: [
            "Clear, vibrant blue skies.",
            "Maximum visibility spanning dozens of miles.",
            "Vegetation photosynthesizes unhindered."
        ],
        headline: "PRISTINE & SAFE"
    };
    if (aqi <= 100) return {
        biological: [
            "Minor upper airway irritation for hypersensitive individuals.",
            "Slight reduction in lung capacity during intense workouts.",
            "Asthmatics might notice a slight increase in symptoms."
        ],
        environmental: [
            "A very faint haze might appear on the distant horizon.",
            "Some volatile organic compounds accumulate, slightly dulling colors."
        ],
        headline: "MODERATE OUTLOOK"
    };
    if (aqi <= 150) return {
        biological: [
            "Airborne particulate matter begins settling deep inside the lungs.",
            "Inflammation triggers coughing, throat irritation, and shortness of breath.",
            "Elderly and children face increased risk of respiratory infections."
        ],
        environmental: [
            "Noticeable gray or brownish smog obscures distant objects.",
            "Sunlight takes on an unnatural tint.",
            "Stagnant air traps pollutants near ground level."
        ],
        headline: "HEALTH CONCERN TRIGGERED"
    };
    if (aqi <= 200) return {
        biological: [
            "Toxic fine particles (PM2.5) enter the bloodstream through the lungs.",
            "Heart rate elevates as the cardiovascular system struggles for oxygen.",
            "Immediate, severe flare-ups for asthma and COPD patients.",
            "Healthy adults experience tightness in the chest and fatigue."
        ],
        environmental: [
            "Thick, visible smog blankets the area.",
            "Strong, acrid chemical smell in the air.",
            "Plant life begins experiencing cellular stress from ozone exposure."
        ],
        headline: "UNHEALTHY – DANGER ZONE"
    };
    if (aqi <= 300) return {
        biological: [
            "Systemic inflammation. Heart attack and stroke risks spike significantly.",
            "Lungs sustain acute microscopic damage continuously.",
            "Coughing fits, burning eyes, and severe shortness of breath in the general public.",
            "Emergency rooms begin filling with respiratory distress victims."
        ],
        environmental: [
            "The sky turns a sickly yellow, brown, or gray.",
            "Visibility drops drastically to just a few miles.",
            "Particulate matter coats surfaces and windows."
        ],
        headline: "SEVERE HEALTH ALERT"
    };
    return {
        biological: [
            "CRITICAL: Extreme, life-threatening cardiovascular stress.",
            "Every breath introduces heavy loads of carcinogenic compounds.",
            "Prolonged exposure can lead to permanent lung scarring or cardiovascular failure.",
            "High spike in premature mortality rates across all demographics."
        ],
        environmental: [
            "Total atmospheric saturation. The sun appears as a dim red disk or vanishes entirely.",
            "Air smells foul, heavy, and metallic.",
            "Visibility falls to mere yards. Complete hazardous lockdown required."
        ],
        headline: "APOCALYPTIC HAZARD LEVEL"
    };
}

export default function AQISimulator() {
    const [aqi, setAqi] = useState(0);
    const globeRef = useRef();
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const EARTH_TEXTURE = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    const BACKGROUND_TEX = '//unpkg.com/three-globe/example/img/night-sky.png';

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (!globeRef.current) return;
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.5;
    }, []);

    const aqiColor = getAQIColor(aqi);
    const impacts = getAQIImpacts(aqi);

    // Dynamic Atmosphere color based on AQI
    // Blend from nice blue to deep red/brown/purple based on AQI to simulate pollution
    const atmosphereColor = (aqi <= 50) ? '#3b82f6' : aqiColor;
    const atmosphereAltitude = Math.min(0.25, 0.15 + (aqi / 1000));

    return (
        <div className={`aqi-simulator-page ${aqi > 400 ? 'glitch-state' : aqi > 300 ? 'emergency-state' : ''}`}>
            <div className="simulator-header">
                <h2>🌍 Global AQI Impact Simulator</h2>
                <p>Use the meter below to simulate what happens to the environment and human health at various Air Quality Index levels.</p>
            </div>

            <div className="simulator-content">
                <div className="globe-panel" ref={containerRef}>
                    <GlobeGL
                        ref={globeRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        globeImageUrl={EARTH_TEXTURE}
                        backgroundImageUrl={BACKGROUND_TEX}
                        showAtmosphere={true}
                        atmosphereColor={atmosphereColor}
                        atmosphereAltitude={atmosphereAltitude}
                    />
                    <div className="globe-overlay" style={{ borderColor: aqiColor, boxShadow: `0 0 20px ${aqiColor}40` }}>
                        <div className="globe-status">
                            <span>Simulated AQI</span>
                            <span className="globe-aqi-num" style={{ color: aqiColor }}>{aqi}</span>
                        </div>
                    </div>
                </div>

                <div className="controls-panel glass-card">
                    <div className="slider-section">
                        <h3><span role="img" aria-label="meter">🌡️</span> AQI Meter</h3>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                value={aqi}
                                onChange={(e) => setAqi(Number(e.target.value))}
                                className="aqi-slider"
                                style={{
                                    background: `linear-gradient(to right, #00e400, #ffff00, #ff7e00, #ff0000, #8f3f97, #7e0023)`
                                }}
                            />
                            <div className="slider-labels">
                                <span>0</span>
                                <span>100</span>
                                <span>200</span>
                                <span>300</span>
                                <span>400</span>
                                <span>500</span>
                            </div>
                        </div>
                        <div className="slider-value-display">
                            Current Simulator Value: <strong style={{ color: aqiColor, fontSize: '1.5rem', marginLeft: '8px' }}>{aqi}</strong>
                        </div>
                    </div>

                    <div className="impacts-section">
                        <div className="impact-headline" style={{ color: aqiColor, borderColor: aqiColor }}>
                            {impacts.headline}
                        </div>
                        
                        <div className="impact-split">
                            <div className="impact-col">
                                <h3><span role="img" aria-label="lungs">🫁</span> Biological Impact</h3>
                                <ul className="impacts-list">
                                    {impacts.biological.map((text, idx) => (
                                        <li key={`bio-${idx}`} className="impact-item animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="impact-col">
                                <h3><span role="img" aria-label="city">🏙️</span> Environmental Impact</h3>
                                <ul className="impacts-list">
                                    {impacts.environmental.map((text, idx) => (
                                        <li key={`env-${idx}`} className="impact-item animate-fadeInUp" style={{ animationDelay: `${(idx + 3) * 0.1}s` }}>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="warning-box" style={{ background: `${aqiColor}15`, borderLeft: `6px solid ${aqiColor}` }}>
                        <FiAlertTriangle className="warning-icon" style={{ color: aqiColor }} />
                        <div className="warning-text">
                            {aqi > 400 ? "EVACUATION LEVEL: Total ambient toxicity. Unsurvivable long-term." :
                             aqi > 300 ? "WARNING: Extreme hazard. Seek sealed shelter immediately." : 
                             aqi > 200 ? "DANGER: High risk of cardiovascular events and respiratory failure." :
                             aqi > 150 ? "CAUTION: Vulnerable groups at risk of hospitalization." :
                             "Air quality is manageable."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
