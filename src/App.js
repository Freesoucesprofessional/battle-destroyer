import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Attack    from './pages/Attack';
import Contact   from './pages/Contact';
import Home      from './pages/Home';
import Reseller from './pages/Reseller';
import ResellerPrices from './pages/ResellerPrices';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Apply background color to body
    document.body.style.backgroundColor = theme === 'dark' ? '#0a0a12' : '#f8fafc';
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkAuth = () => setIsAuth(!!localStorage.getItem('token'));
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page — accessible always */}
        <Route path="/"          element={<Home      toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/reseller" element={<Reseller toggleTheme={toggleTheme} theme={theme} />} />
        <Route path="/reseller-prices" element={<ResellerPrices toggleTheme={toggleTheme} theme={theme} />} />

        {/* Auth routes */}
        <Route path="/login"     element={!isAuth ? <Login     toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup"    element={!isAuth ? <Signup    toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/dashboard" />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={isAuth ? <Dashboard toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
        <Route path="/attack"    element={isAuth ? <Attack    toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
        <Route path="/contact"   element={isAuth ? <Contact   toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />

        {/* Catch-all */}
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;