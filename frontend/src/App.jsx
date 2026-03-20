// Main App — Routing and layout structure
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Header from './components/Layout/Header';
import Chatbot from './components/Chatbot/Chatbot';
import Home from './pages/Home';
import Dashboard from './components/Dashboard/Dashboard';
import HospitalMap from './components/HospitalMap/HospitalMap';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AQISimulator from './pages/AQISimulator';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <div className="app-layout">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/hospitals" element={<HospitalMap />} />
                <Route path="/simulator" element={<AQISimulator />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </main>
            <Chatbot />
          </div>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
