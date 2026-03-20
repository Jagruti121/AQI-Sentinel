// Signup Component — Firebase Registration
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiUserPlus, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './Auth.css';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        // Check for placeholder API keys before attempting signup
        if (import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key' || !import.meta.env.VITE_FIREBASE_API_KEY) {
            return setError('Firebase API Key is missing. Please add real credentials to frontend/.env');
        }

        setLoading(true);
        try {
            await signup(email, password, name);
            navigate('/');
        } catch (err) {
            setError(err.code === 'auth/email-already-in-use'
                ? 'This email is already registered'
                : err.message);
        }
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
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
            <div className="auth-card glass-card attractive-auth-card">
                <div className="auth-header">
                    <div className="auth-logo pulse-logo">🌍</div>
                    <h1>Create Account</h1>
                    <p>Join AQI Sentinel to monitor real-time air quality</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <FiAlertCircle /> {error}
                    </div>
                )}

                <button 
                    type="button" 
                    className="btn btn-google btn-full shadow-effect" 
                    onClick={handleGoogleSignup} 
                    disabled={loading}
                >
                    <FcGoogle className="google-icon" /> Sign up with Google
                </button>

                <div className="auth-divider">
                    <span>or sign up with email</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group floated-label-group">
                        <label htmlFor="signup-name"><FiUser /> Full Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            className="input-field modern-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group floated-label-group">
                        <label htmlFor="signup-email"><FiMail /> Email Address</label>
                        <input
                            id="signup-email"
                            type="email"
                            className="input-field modern-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group floated-label-group">
                        <label htmlFor="signup-password"><FiLock /> Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            className="input-field modern-input"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group floated-label-group">
                        <label htmlFor="signup-confirm"><FiLock /> Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type="password"
                            className="input-field modern-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full shadow-effect" disabled={loading} id="btn-signup-submit">
                        {loading ? <div className="loading-spinner" style={{ width: 20, height: 20, margin: '0 auto' }} /> : <><FiUserPlus /> Create Account</>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="gradient-link">Sign in safely</Link></p>
                </div>
            </div>
        </div>
    );
}
