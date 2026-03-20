// Location Context — Global state for selected geographic coordinates
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { reverseGeocode } from '../services/api';

const LocationContext = createContext();

export function useLocation() {
    return useContext(LocationContext);
}

export function LocationProvider({ children }) {
    const [coordinates, setCoordinates] = useState({ lat: 28.6139, lon: 77.209 }); // Default: Delhi
    const [regionName, setRegionName] = useState('New Delhi, India');
    const [loading, setLoading] = useState(false);
    const [locationInitialized, setLocationInitialized] = useState(false);

    const updateLocation = useCallback(async (lat, lon) => {
        setLoading(true);
        setCoordinates({ lat, lon });

        try {
            const geo = await reverseGeocode(lat, lon);
            if (geo && geo.address) {
                const city = geo.address.city || geo.address.town || geo.address.village || geo.address.municipality || geo.address.county;
                const country = geo.address.country;
                if (city && country) {
                    setRegionName(`${city}, ${country}`);
                } else if (geo.display_name) {
                    const parts = geo.display_name.split(', ');
                    setRegionName(parts.length > 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : geo.display_name);
                } else {
                    setRegionName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
                }
            } else if (geo && geo.display_name) {
                const parts = geo.display_name.split(', ');
                const shortName = parts.length > 2
                    ? `${parts[0]}, ${parts[parts.length - 1]}`
                    : geo.display_name;
                setRegionName(shortName);
            } else {
                setRegionName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
            }
        } catch {
            setRegionName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        if (!locationInitialized && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateLocation(position.coords.latitude, position.coords.longitude);
                    setLocationInitialized(true);
                },
                (error) => {
                    console.warn("Geolocation denied or failed. Using default location.", error);
                    setLocationInitialized(true);
                }
            );
        } else if (!navigator.geolocation) {
            setLocationInitialized(true);
        }
    }, [locationInitialized, updateLocation]);

    return (
        <LocationContext.Provider value={{
            coordinates,
            regionName,
            loading,
            updateLocation,
            setRegionName
        }}>
            {children}
        </LocationContext.Provider>
    );
}
