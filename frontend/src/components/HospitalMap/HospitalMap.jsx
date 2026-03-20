// Hospital Map Component — Google Maps display + Overpass API (OpenStreetMap) for hospital data
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { useLocation } from '../../context/LocationContext';
import { FiPhone, FiMapPin, FiAlertCircle, FiNavigation, FiExternalLink, FiClock, FiGlobe } from 'react-icons/fi';
import './HospitalMap.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

// Dark mode map styles
const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ]
};

// Calculate distance between two lat/lng points in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function HospitalMap() {
    const { coordinates, regionName } = useLocation();
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const mapRef = useRef(null);
    const searchTimerRef = useRef(null);
    const cacheRef = useRef({});

    const isPlaceholderKey = !GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: isPlaceholderKey ? '' : GOOGLE_MAPS_API_KEY,
    });

    const center = { lat: coordinates.lat, lng: coordinates.lon };

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // Multiple Overpass API servers for fallback
    const OVERPASS_SERVERS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ];

    // Helper: sleep for ms
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fetch from a single server with retry
    const fetchWithRetry = async (url, body, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: body,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                    console.warn(`Rate limited (429) by ${url}. Retrying in ${waitTime / 1000}s...`);
                    await sleep(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt === maxRetries - 1) throw error;
            }
        }
        throw new Error('Max retries exceeded');
    };

    // Try multiple servers
    const fetchOverpassData = async (query) => {
        const body = `data=${encodeURIComponent(query)}`;

        for (const server of OVERPASS_SERVERS) {
            try {
                console.log(`Trying Overpass server: ${server}`);
                const data = await fetchWithRetry(server, body, 2);
                return data;
            } catch (error) {
                console.warn(`Server ${server} failed:`, error.message);
                continue;
            }
        }
        throw new Error('All Overpass servers are unavailable. Please try again in a minute.');
    };

    // Process raw Overpass elements into hospital objects
    const processResults = (elements, lat, lng) => {
        return elements
            .map((el) => {
                const elLat = el.lat || el.center?.lat;
                const elLon = el.lon || el.center?.lon;
                if (!elLat || !elLon) return null;

                const tags = el.tags || {};
                const name = tags.name || tags['name:en'] || 'Hospital/Clinic';
                const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || '';
                const address = [
                    tags['addr:street'],
                    tags['addr:city'] || tags['addr:suburb'],
                    tags['addr:postcode']
                ].filter(Boolean).join(', ');

                const distance = getDistanceKm(lat, lng, elLat, elLon);

                return {
                    place_id: `osm_${el.type}_${el.id}`,
                    name: name,
                    vicinity: address || `${distance.toFixed(1)} km away`,
                    formatted_phone_number: phone,
                    geometry: {
                        location: { lat: elLat, lng: elLon }
                    },
                    amenity_type: tags.amenity,
                    distance: distance,
                    website: tags.website || '',
                    opening_hours_text: tags.opening_hours || '',
                    emergency: tags.emergency === 'yes',
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);
    };

    // Main search function with caching
    const searchHospitals = async (lat, lng) => {
        // Round coordinates for cache key (same area = same results)
        const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

        // Check cache first
        if (cacheRef.current[cacheKey]) {
            console.log('Using cached hospital results for', cacheKey);
            const cachedResults = cacheRef.current[cacheKey];
            // Recalculate distances from exact position
            const updated = cachedResults.map(h => ({
                ...h,
                distance: getDistanceKm(lat, lng, h.geometry.location.lat, h.geometry.location.lng)
            })).sort((a, b) => a.distance - b.distance);
            setHospitals(updated);
            setSearching(false);
            return;
        }

        setSearching(true);
        setSearchError('');
        setHospitals([]);

        const radiusMeters = 25000;

        const query = `
            [out:json][timeout:25];
            (
                node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
                way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
                node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
                way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
            );
            out center body;
        `;

        try {
            const data = await fetchOverpassData(query);
            console.log("Overpass API returned:", data.elements?.length || 0, "results");

            const results = processResults(data.elements || [], lat, lng);
            cacheRef.current[cacheKey] = results; // Store in cache
            setHospitals(results);
            console.log("Processed hospitals:", results.length);
        } catch (error) {
            console.error("Hospital search error:", error);
            setSearchError(error.message || 'Failed to fetch hospitals. Please try again.');
            setHospitals([]);
        }

        setSearching(false);
    };

    // Debounced search when coordinates change (prevents rapid-fire 429 errors)
    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        searchTimerRef.current = setTimeout(() => {
            searchHospitals(coordinates.lat, coordinates.lon);
        }, 500); // Wait 500ms before firing

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [coordinates]);

    const handleSelectHospital = (hospital) => {
        setSelectedHospital(hospital);
        if (mapRef.current) {
            mapRef.current.panTo(hospital.geometry.location);
            mapRef.current.setZoom(15);
        }
    };

    if (isPlaceholderKey) {
        return (
            <div className="hospital-page">
                <div style={{ padding: '40px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                    <FiAlertCircle size={48} color="#f43f5e" style={{ marginBottom: '16px' }} />
                    <h2 style={{ color: '#f43f5e', marginBottom: '8px' }}>Google Maps API Key Missing</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        The map cannot be loaded. Please add your real Google Maps API key to the <code>VITE_GOOGLE_MAPS_API_KEY</code> variable in your <code>frontend/.env</code> file and restart the server.
                    </p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="hospital-page">
                <div className="hospital-error">
                    <FiAlertCircle size={40} />
                    <h3>Error loading Google Maps</h3>
                    <p>Please check your API key and network connection.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hospital-page">
            <div className="hospital-header">
                <div>
                    <h2>🏥 Nearby Hospitals & Clinics</h2>
                    <p>Real-time search powered by OpenStreetMap near <strong>{regionName}</strong></p>
                </div>
            </div>

            <div className="hospital-content">
                <div className="hospital-map-container">
                    {!isLoaded ? (
                        <div className="loading-container">
                            <div className="loading-spinner" />
                            <p>Loading Map...</p>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={12}
                            options={mapOptions}
                            onLoad={onMapLoad}
                        >
                            {/* User Location Marker */}
                            <MarkerF
                                position={center}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 10,
                                    fillColor: "#06b6d4",
                                    fillOpacity: 1,
                                    strokeWeight: 2,
                                    strokeColor: "#ffffff",
                                }}
                            />

                            <CircleF
                                center={center}
                                radius={25000}
                                options={{
                                    strokeColor: '#06b6d4',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    fillColor: '#06b6d4',
                                    fillOpacity: 0.05,
                                }}
                            />

                            {/* Hospital Markers */}
                            {hospitals.map((hospital) => (
                                <MarkerF
                                    key={hospital.place_id}
                                    position={hospital.geometry.location}
                                    onClick={() => handleSelectHospital(hospital)}
                                    icon={{
                                        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#f43f5e" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'),
                                        scaledSize: new window.google.maps.Size(32, 32),
                                        origin: new window.google.maps.Point(0, 0),
                                        anchor: new window.google.maps.Point(16, 32),
                                    }}
                                />
                            ))}

                            {selectedHospital && (
                                <InfoWindowF
                                    position={selectedHospital.geometry.location}
                                    onCloseClick={() => setSelectedHospital(null)}
                                >
                                    <div className="gm-info-window">
                                        <div className="info-title">{selectedHospital.name}</div>
                                        {selectedHospital.vicinity && <div className="info-address"><FiMapPin size={12} /> {selectedHospital.vicinity}</div>}
                                        {selectedHospital.formatted_phone_number && (
                                            <div className="info-phone">
                                                <FiPhone size={14} />
                                                <a href={`tel:${selectedHospital.formatted_phone_number}`}>{selectedHospital.formatted_phone_number}</a>
                                            </div>
                                        )}
                                        <div className="info-badges">
                                            <span className="info-badge distance"><FiNavigation size={10} /> {selectedHospital.distance?.toFixed(1)} km</span>
                                            {selectedHospital.emergency && <span className="info-badge emergency">🚨 Emergency</span>}
                                            <span className="info-badge type">{selectedHospital.amenity_type === 'clinic' ? 'Clinic' : 'Hospital'}</span>
                                        </div>
                                        <a
                                            className="info-directions"
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.geometry.location.lat},${selectedHospital.geometry.location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FiNavigation size={12} /> Get Directions
                                        </a>
                                    </div>
                                </InfoWindowF>
                            )}
                        </GoogleMap>
                    )}
                </div>

                <div className="hospital-list">
                    <div className="list-header">
                        <span>{hospitals.length} facilities found</span>
                        <div className="emergency-contacts">
                            <span>🚑 Ambulance: <strong>108</strong></span>
                        </div>
                    </div>

                    {searching ? (
                        <div className="loading-container">
                            <div className="loading-spinner" />
                            <p>Searching nearby hospitals...</p>
                        </div>
                    ) : (
                        <div className="hospital-cards">
                            {hospitals.map(hospital => {
                                const isSelected = selectedHospital?.place_id === hospital.place_id;
                                return (
                                    <div
                                        key={hospital.place_id}
                                        className={`hospital-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelectHospital(hospital)}
                                    >
                                        <div className="hospital-card-header">
                                            <h4>{hospital.name}</h4>
                                            <span className="distance-badge">
                                                <FiNavigation size={11} /> {hospital.distance?.toFixed(1)} km
                                            </span>
                                        </div>
                                        {hospital.vicinity && (
                                            <div className="hospital-type">
                                                <FiMapPin size={12} /> {hospital.vicinity}
                                            </div>
                                        )}

                                        {/* Phone row — always visible if phone exists */}
                                        {hospital.formatted_phone_number && (
                                            <div className="hospital-phone-row">
                                                <FiPhone size={15} />
                                                <a href={`tel:${hospital.formatted_phone_number}`}>{hospital.formatted_phone_number}</a>
                                                <span className="phone-label">Tap to call</span>
                                            </div>
                                        )}

                                        {/* Meta badges */}
                                        <div className="hospital-meta">
                                            {hospital.emergency && (
                                                <span className="emergency-badge-tag">🚨 Emergency</span>
                                            )}
                                            <span className="status-open">
                                                {hospital.amenity_type === 'clinic' ? '🏥 Clinic' : '🏥 Hospital'}
                                            </span>
                                        </div>

                                        {/* Expanded details on selection */}
                                        {isSelected && (
                                            <div className="hospital-expanded-details">
                                                {hospital.opening_hours_text && (
                                                    <div className="detail-row">
                                                        <FiClock size={14} />
                                                        <span>{hospital.opening_hours_text}</span>
                                                    </div>
                                                )}
                                                {hospital.website && (
                                                    <div className="detail-row">
                                                        <FiGlobe size={14} />
                                                        <a href={hospital.website} target="_blank" rel="noopener noreferrer">
                                                            {hospital.website.replace(/^https?:\/\//, '').slice(0, 35)}{hospital.website.length > 40 ? '...' : ''}
                                                        </a>
                                                        <FiExternalLink size={11} />
                                                    </div>
                                                )}
                                                <a
                                                    className="directions-btn"
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.geometry.location.lat},${hospital.geometry.location.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FiNavigation size={14} /> Get Directions
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {hospitals.length === 0 && !searching && (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {searchError || 'No hospitals found within 25km.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
