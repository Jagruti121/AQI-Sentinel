// Search Bar Component — Location search with autocomplete
import { useState, useRef, useEffect } from 'react';
import { searchLocation } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { FiSearch, FiMapPin, FiX } from 'react-icons/fi';
import './Search.css';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateLocation } = useLocation();
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const handleSearch = (value) => {
        setQuery(value);
        clearTimeout(timeoutRef.current);

        if (value.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            const data = await searchLocation(value);
            setResults(data || []);
            setIsOpen(true);
            setLoading(false);
        }, 300);
    };

    const handleSelect = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        updateLocation(lat, lon);
        setQuery(result.display_name.split(',').slice(0, 2).join(','));
        setIsOpen(false);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className="search-container">
            <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search city, region, or coordinates..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    id="location-search"
                />
                {loading && <div className="search-spinner" />}
                {query && !loading && (
                    <button className="search-clear" onClick={clearSearch}>
                        <FiX />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-dropdown">
                    {results.map((result, idx) => (
                        <button
                            key={idx}
                            className="search-result"
                            onClick={() => handleSelect(result)}
                        >
                            <FiMapPin className="result-icon" />
                            <div className="result-info">
                                <span className="result-name">
                                    {result.display_name.split(',').slice(0, 2).join(',')}
                                </span>
                                <span className="result-detail">
                                    {result.display_name.split(',').slice(2, 4).join(',')}
                                </span>
                            </div>
                            <span className="result-coords">
                                {parseFloat(result.lat).toFixed(2)}°, {parseFloat(result.lon).toFixed(2)}°
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
