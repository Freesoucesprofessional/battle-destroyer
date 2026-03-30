import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaBolt,
  FaBullseye,
  FaSignOutAlt,
  FaGem,
  FaUser,
  FaBars,
  FaTimes,
  FaCircle,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Navbar({ toggleTheme, theme, setIsAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [liveUsers, setLiveUsers] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const dark = theme !== 'light';

  // Determine if user is logged in
  const isLoggedIn = !!(localStorage.getItem('token') && user.username);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Fetch live users from backend — polls every 30s
  useEffect(() => {
    const fetchLiveUsers = async () => {
      try {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/stats/live-users`, { headers });
        if (res.ok) {
          const data = await res.json();
          // Support different response shapes: { liveUsers }, { activeUsers }, { count }
          const count = data.liveUsers ?? data.activeUsers ?? data.count ?? null;
          setLiveUsers(count);
        }
      } catch {
        // Silently fail — badge simply won't show if endpoint missing
      }
    };

    fetchLiveUsers();
    const interval = setInterval(fetchLiveUsers, 30_000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard',  label: 'Dashboard',   icon: FaBolt },
    { path: '/attack',     label: 'Attack',       icon: FaBullseye },
    { path: '/contact',    label: 'Buy Credits',  icon: FaGem },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || dark
          ? dark
            ? 'bg-surface-900/90 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-white/90 backdrop-blur-xl border-b border-black/[0.08] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <img
                src="/logo512.png"
                alt="Battle Destroyer Logo"
                className="relative w-9 h-9 rounded-xl object-contain"
                style={{ filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.55))' }}
              />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span
                className="tracking-[0.15em] text-base sm:text-lg font-bold text-red-500"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                BATTLE-DESTROYER
              </span>
              {/* Live users badge — only when data is available */}
              {liveUsers !== null && (
                <span className="flex items-center gap-1">
                  <FaCircle className="text-green-500 animate-pulse" size={6} />
                  <span className={`text-[10px] font-semibold tracking-wide ${dark ? 'text-green-400' : 'text-green-600'}`}>
                    {liveUsers} online now
                  </span>
                </span>
              )}
            </div>
          </Link>

          {/* ── Desktop Nav (only when logged in) ── */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.path)
                      ? 'text-red-400'
                      : dark
                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'
                  }`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {isActive(link.path) && (
                    <span className="absolute inset-0 rounded-xl bg-red-600/10 border border-red-600/20" />
                  )}
                  <link.icon size={14} className={isActive(link.path) ? 'text-red-500' : ''} />
                  <span className="relative">{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* ── Right Side ── */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                dark
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] text-yellow-400'
                  : 'bg-black/[0.05] hover:bg-black/[0.08] text-slate-600'
              }`}
            >
              {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
            </button>

            {isLoggedIn ? (
              <>
                {/* User chip — desktop only */}
                <div
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${
                    dark
                      ? 'bg-white/[0.04] border-white/[0.08]'
                      : 'bg-black/[0.03] border-black/[0.08]'
                  }`}
                >
                  <FaGem className="text-red-400" size={13} />
                  <span className="text-red-400 font-bold tabular-nums">{user.credits ?? 0}</span>
                  <span className={`${dark ? 'text-white/20' : 'text-black/20'}`}>|</span>
                  <span className={`font-medium text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {user.username}
                  </span>
                </div>

                {/* Logout — desktop */}
                <button
                  onClick={logout}
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    dark
                      ? 'bg-red-600/10 hover:bg-red-600 border border-red-600/25 text-red-400 hover:text-white'
                      : 'bg-red-50 hover:bg-red-600 border border-red-200 text-red-500 hover:text-white'
                  }`}
                >
                  <FaSignOutAlt size={13} />
                  Logout
                </button>
              </>
            ) : (
              /* ── LOGIN button (not logged in, desktop) ── */
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                style={{
                  boxShadow: '0 4px 18px rgba(220,38,38,0.4)',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                <FaUser size={12} />
                LOGIN
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition ${
                dark ? 'bg-white/[0.06] text-white' : 'bg-black/[0.05] text-slate-900'
              }`}
            >
              {menuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 space-y-1 backdrop-blur-xl ${
            dark
              ? 'bg-surface-900/95 border-white/[0.06]'
              : 'bg-white/95 border-black/[0.07]'
          }`}
        >
          {isLoggedIn ? (
            <>
              {/* User info row */}
              <div
                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 ${
                  dark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center overflow-hidden">
                  <img src="/logo512.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {user.username}
                  </p>
                  <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                    <FaGem size={10} /> {user.credits ?? 0} credits
                  </p>
                </div>
                {/* Live users — mobile */}
                {liveUsers !== null && (
                  <div className="flex items-center gap-1">
                    <FaCircle className="text-green-500 animate-pulse" size={7} />
                    <span className={`text-[10px] font-semibold ${dark ? 'text-green-400' : 'text-green-600'}`}>
                      {liveUsers} online
                    </span>
                  </div>
                )}
              </div>

              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-red-600/10 text-red-400 border border-red-600/20'
                      : dark
                        ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                        : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-900'
                  }`}
                >
                  <link.icon size={14} />
                  {link.label}
                </Link>
              ))}

              <button
                onClick={toggleTheme}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition ${
                  dark ? 'text-yellow-400 hover:bg-white/[0.05]' : 'text-slate-600 hover:bg-black/[0.04]'
                }`}
              >
                {dark ? <MdWbSunny size={14} /> : <MdNightlight size={14} />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>

              <button
                onClick={logout}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 w-full transition ${
                  dark ? 'hover:bg-red-600/10' : 'hover:bg-red-50'
                }`}
              >
                <FaSignOutAlt size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition ${
                  dark ? 'text-yellow-400 hover:bg-white/[0.05]' : 'text-slate-600 hover:bg-black/[0.04]'
                }`}
              >
                {dark ? <MdWbSunny size={14} /> : <MdNightlight size={14} />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 w-full transition"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}
              >
                <FaUser size={13} />
                LOGIN
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}