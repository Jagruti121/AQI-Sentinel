// Header Component — Navigation bar with auth and search
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import SearchBar from '../Search/SearchBar';
import { FiUser, FiLogOut, FiActivity, FiGlobe, FiBarChart2, FiMessageCircle } from 'react-icons/fi';
import './Header.css';

export default function Header() {
    const { currentUser, logout } = useAuth();
    const { regionName, coordinates } = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <header className="app-header">
            <div className="header-inner">
                <Link to="/" className="header-logo" id="header-logo">
                    <div className="logo-icon">
                        <FiActivity />
                    </div>
                    <div className="logo-text">
                        <span className="logo-title">AQI Sentinel</span>
                        <span className="logo-subtitle">Air Quality Intelligence</span>
                    </div>
                </Link>

                <div className="header-search">
                    <SearchBar />
                </div>

                <nav className="header-nav">
                    <Link to="/" className="nav-link" id="nav-home">
                        <FiGlobe />
                        <span>Globe</span>
                    </Link>
                    <Link to="/dashboard" className="nav-link" id="nav-dashboard">
                        <FiBarChart2 />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/simulator" className="nav-link" id="nav-simulator">
                        <FiActivity />
                        <span>Simulator</span>
                    </Link>

                    {regionName && (
                        <div className="current-region">
                            <span className="region-pin">📍</span>
                            <span className="region-name">{regionName}</span>
                        </div>
                    )}

                    {currentUser ? (
                        <div className="user-menu">
                            <div className="user-avatar">
                                {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <button className="btn btn-ghost" onClick={handleLogout} id="btn-logout">
                                <FiLogOut />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm" id="btn-login">
                            <FiUser />
                            <span>Sign In</span>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
