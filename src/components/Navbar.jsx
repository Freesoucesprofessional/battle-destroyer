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
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';

export default function Navbar({ toggleTheme, theme, setIsAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const dark = theme !== 'light';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: FaBolt },
    { path: '/attack',    label: 'Attack',    icon: FaBullseye },
    { path: '/contact',   label: 'Buy Credits', icon: FaGem },
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
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <div className="relative w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center">
                <FaBullseye className="text-red-500" size={16} />
              </div>
            </div>
            <span
              className="tracking-[0.15em] text-base sm:text-lg font-bold text-red-500"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              BATTLE-DESTROYER
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
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
              {dark
                ? <MdWbSunny size={17} />
                : <MdNightlight size={17} />
              }
            </button>

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
          {/* User info */}
          <div
            className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 ${
              dark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center">
              <FaUser className="text-red-400" size={13} />
            </div>
            <div>
              <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                {user.username}
              </p>
              <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                <FaGem size={10} /> {user.credits ?? 0} credits
              </p>
            </div>
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

          {/* Theme toggle mobile */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition ${
              dark
                ? 'text-yellow-400 hover:bg-white/[0.05]'
                : 'text-slate-600 hover:bg-black/[0.04]'
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
        </div>
      )}
    </nav>
  );
}