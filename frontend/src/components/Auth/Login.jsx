// Login Component — Firebase Authentication with Video Background
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiWind } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key' || !import.meta.env.VITE_FIREBASE_API_KEY) {
            return setError('Firebase API Key is missing. Please add real credentials to frontend/.env');
        }

        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.code === 'auth/invalid-credential'
                ? 'Invalid email or password'
                : err.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        if (import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key' || !import.meta.env.VITE_FIREBASE_API_KEY) {
            return setError('Firebase API Key is missing. Please add real credentials to frontend/.env');
        }

        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Video Background */}
            <div className="auth-video-bg">
                <video autoPlay muted loop playsInline className="auth-video">
                    <source src="https://cdn.pixabay.com/video/2020/07/30/45375-445039301_large.mp4" type="video/mp4" />
                </video>
                <div className="auth-video-overlay" />
            </div>

            {/* Animated Particles */}
            <div className="auth-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="auth-particle" style={{
                        '--x': `${Math.random() * 100}%`,
                        '--y': `${Math.random() * 100}%`,
                        '--size': `${2 + Math.random() * 4}px`,
                        '--duration': `${15 + Math.random() * 20}s`,
                        '--delay': `${Math.random() * 10}s`,
                        '--opacity': `${0.2 + Math.random() * 0.4}`,
                    }} />
                ))}
            </div>

            {/* Floating AQI Indicators */}
            <div className="auth-floating-indicators">
                <div className="floating-aqi-badge good" style={{ '--float-delay': '0s' }}>
                    <FiWind /> AQI 42
                </div>
                <div className="floating-aqi-badge moderate" style={{ '--float-delay': '2s' }}>
                    <FiWind /> AQI 98
                </div>
                <div className="floating-aqi-badge unhealthy" style={{ '--float-delay': '4s' }}>
                    <FiWind /> AQI 156
                </div>
            </div>

            <div className="auth-card glass-card attractive-auth-card">
                {/* Glow accents */}
                <div className="auth-card-glow" />

                <div className="auth-header">
                    <div className="auth-logo-container">
                        <div className="auth-logo-ring">
                            <div className="auth-logo pulse-logo">🌍</div>
                        </div>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to monitor air quality worldwide</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <FiAlertCircle /> {error}
                    </div>
                )}

                <button
                    type="button"
                    className="btn btn-google btn-full shadow-effect"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <FcGoogle className="google-icon" /> Continue with Google
                </button>

                <div className="auth-divider">
                    <span>or sign in with email</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group floated-label-group">
                        <label htmlFor="login-email"><FiMail /> Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="input-field modern-input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group floated-label-group">
                        <label htmlFor="login-password"><FiLock /> Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="input-field modern-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full shadow-effect" disabled={loading} id="btn-login-submit">
                        {loading ? <div className="loading-spinner" style={{ width: 20, height: 20, margin: '0 auto' }} /> : <><FiLogIn /> Sign In</>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup" className="gradient-link">Create one for free</Link></p>
                </div>
            </div>
        </div>
    );
}
