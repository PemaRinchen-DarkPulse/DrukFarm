import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import LandingPage from './pages/landinPage/LandingPage';
import Login from './pages/userAuth/Login';
import Signup from './pages/userAuth/Signup';
import Footer from './components/foooter/Footer'
import './App.css'; // Import global styles

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  // Conditionally render Navbar based on the path
  const showNavbar = !['/login', '/signup'].includes(location.pathname);

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      <div className="content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
