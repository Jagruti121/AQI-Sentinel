// 3D Realistic Interactive Globe Component using react-globe.gl
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import { useLocation } from '../../context/LocationContext';
import './Globe.css';

export default function Globe() {
    const globeRef = useRef();
    const containerRef = useRef();
    const { updateLocation, coordinates, regionName } = useLocation();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [marker, setMarker] = useState(null);

    // High-res texture URLs
    const EARTH_TEXTURE = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    const EARTH_BUMP = '//unpkg.com/three-globe/example/img/earth-topology.png';
    const EARTH_WATER = '//unpkg.com/three-globe/example/img/earth-water.png';
    const NIGHT_TEXTURE = '//unpkg.com/three-globe/example/img/earth-night.jpg';
    const BACKGROUND_STARS = '//unpkg.com/three-globe/example/img/night-sky.png';

    // Handle responsive sizing
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

    // Set initial marker based on context
    useEffect(() => {
        if (coordinates) {
            setMarker({ lat: coordinates.lat, lng: coordinates.lon });
        }
    }, [coordinates]);

    // Handle click on the globe surface
    const handleGlobeClick = useCallback(({ lat, lng }, event) => {
        setMarker({ lat, lng });
        updateLocation(lat, lng);
    }, [updateLocation]);

    // Marker visualization
    const markerData = useMemo(() => {
        if (!marker) return [];
        return [{
            lat: marker.lat,
            lng: marker.lng,
            size: 0.8,
            color: '#f43f5e'
        }];
    }, [marker]);

    // Wait a moment before auto-rotating so it looks natural
    useEffect(() => {
        if (!globeRef.current) return;
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.5;

        // Set initial view to the current marker/location
        if (coordinates) {
            globeRef.current.pointOfView({
                lat: coordinates.lat,
                lng: coordinates.lon,
                altitude: 2
            });
        }
    }, []);

    // Stop auto-rotate on interaction
    const handleInteraction = () => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = false;
        }
    };

    return (
        <div className="globe-container" ref={containerRef}>
            <GlobeGL
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl={EARTH_TEXTURE}
                bumpImageUrl={EARTH_BUMP}
                backgroundImageUrl={BACKGROUND_STARS}
                showAtmosphere={true}
                atmosphereColor="#3b82f6"
                atmosphereAltitude={0.15}
                onGlobeClick={handleGlobeClick}
                onZoom={handleInteraction}
                onGlobeRightClick={handleInteraction}

                // Marker
                ringsData={markerData}
                ringColor={() => '#f43f5e'}
                ringMaxRadius="size"
                ringPropagationSpeed={3}
                ringRepeatPeriod={1000}

                // Tooltip config (GlobeGL built-in)
                labelsData={markerData}
                labelLat="lat"
                labelLng="lng"
                labelText={() => regionName ? `Selected: ${regionName}` : 'Selected Location'}
                labelSize={1.5}
                labelDotRadius={0.5}
                labelColor={() => '#f43f5e'}
                labelResolution={2}
            />

            <div className="globe-overlay-info">
                <div className="globe-hint">
                    <span className="hint-icon">🖱️</span>
                    <span>Click anywhere to select a region</span>
                </div>
                <div className="globe-hint">
                    <span className="hint-icon">🔄</span>
                    <span>Drag to rotate • Scroll to zoom</span>
                </div>
            </div>
        </div>
    );
}
