import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Attack from './pages/Attack';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const token = () => localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token() ? "/dashboard" : "/login"} />} />
        <Route path="/login"     element={<Login     toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/signup"    element={<Signup    toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/dashboard" element={token() ? <Dashboard toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/login" />} />
        <Route path="/attack"    element={token() ? <Attack    toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/login" />} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;