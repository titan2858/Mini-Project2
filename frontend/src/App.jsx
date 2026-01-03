import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Arena from './pages/Arena';
import Login from './pages/Login';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Rules from './pages/Rules';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Get current route location
  const location = useLocation();
  
  // Check if we are inside the Arena
  const isArena = location.pathname.startsWith('/arena');

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Conditionally render Navbar: Only show if NOT in Arena */}
      {!isArena && <Navbar />}
      
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} 
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rules" element={<Rules />} />
        
        {/* Arena Route */}
        <Route path="/arena/:roomId" element={<Arena />} />
        
        <Route path="*" element={<div className="p-10 text-center text-xl">404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;