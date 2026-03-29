import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBolt, FaBullseye, FaSignOutAlt, FaGem, FaUser, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar({ toggleTheme, theme }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: FaBolt },
        { path: '/attack', label: 'Attack', icon: FaBullseye },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${theme === 'dark'
                ? 'bg-gray-950/90 border-gray-800'
                : 'bg-white/90 border-gray-200'
            }`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2.5 group">
                        <img
                            src="/logo512.png"
                            alt="Battle Destroyer Logo"
                            className="w-8 h-8 rounded-lg object-contain group-hover:scale-110 transition-transform"
                        />
                        <span className="font-black text-red-500 tracking-widest text-sm sm:text-base hidden xs:block">
                            BATTLE-DESTROYER
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link key={link.path} to={link.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.path)
                                        ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                                        : theme === 'dark'
                                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}>
                                <link.icon size={16} />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Theme toggle */}
                        <button onClick={toggleTheme}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${theme === 'dark'
                                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        {/* User info - desktop */}
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <FaGem className="text-red-400" size={14} />
                            <span className="text-red-400 font-bold">{user.credits ?? 0}</span>
                            <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>|</span>
                            <span className={`font-medium text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {user.username}
                            </span>
                        </div>

                        {/* Logout - desktop */}
                        <button onClick={logout}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white text-sm font-medium transition-all">
                            <FaSignOutAlt size={14} />
                            Logout
                        </button>

                        {/* Mobile menu button */}
                        <button onClick={() => setMenuOpen(!menuOpen)}
                            className={`md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                                }`}>
                            {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className={`md:hidden border-t px-4 py-3 space-y-1 ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
                    }`}>
                    {/* User info mobile */}
                    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                        }`}>
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                            <FaUser className="text-sm text-red-500" />
                        </div>
                        <div>
                            <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                            <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                                <FaGem size={12} /> {user.credits ?? 0} credits
                            </p>
                        </div>
                    </div>

                    {navLinks.map(link => (
                        <Link key={link.path} to={link.path}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                                    ? 'bg-red-600/20 text-red-400'
                                    : theme === 'dark'
                                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`}>
                            <link.icon size={16} />
                            {link.label}
                        </Link>
                    ))}

                    <button onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-600/10 transition mt-1">
                        <FaSignOutAlt size={16} />
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}