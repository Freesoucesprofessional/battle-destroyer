import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaSignOutAlt, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-xl
                    ${t.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {t.type === 'success' ? <FaCheckCircle size={14} /> : <FaExclamationTriangle size={14} />}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');

    // Panel state
    const [stats, setStats] = useState({ total: 0, pro: 0, withCredits: 0, today: 0, activeResellers: 0, totalResellers: 0 });
    const [users, setUsers] = useState([]);
    const [resellers, setResellers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [resellersLoading, setResellersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('users');
    const [toasts, setToasts] = useState([]);

    const loginRef = useRef(null);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    // ── Restore session from localStorage on mount ──
    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (!savedToken) return;

        setToken(savedToken);
        setIsLoggedIn(true);

        // call APIs using savedToken directly
        const init = async () => {
            try {
                const statsRes = await axios.get(`${API_URL}/api/admin/stats`, {
                    headers: { 'x-admin-token': savedToken },
                    withCredentials: true
                });

                const usersRes = await axios.get(`${API_URL}/api/admin/users`, {
                    headers: { 'x-admin-token': savedToken },
                    withCredentials: true
                });

                setStats(statsRes.data);
                setUsers(usersRes.data.users || []);
            } catch (err) {
                console.error(err);
            }
        };

        init();
    }, []);

    // Animate login box
    useEffect(() => {
        if (!isLoggedIn && loginRef.current) {
            setTimeout(() => {
                loginRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [isLoggedIn]);

    const doLogin = async () => {
        setLoginError('');
        if (!adminSecret) { setLoginError('Admin secret is required'); return; }
        setLoginLoading(true);
        try {
            // Get CSRF
            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const csrfToken = csrfRes.data.csrfToken;

            const { data } = await axios.post(`${API_URL}/api/admin/session`,
                { secret: adminSecret },
                { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } }
            );

            setToken(data.token);
            setIsLoggedIn(true);
            setAdminSecret('');

            // ✅ Persist to localStorage
            localStorage.setItem('adminToken', data.token);

            toast('Login successful!');
            loadStats();
            loadUsers();
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed');
            toast(err.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoginLoading(false);
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setToken('');
        setUsers([]);
        setResellers([]);
        setAdminSecret('');

        // ✅ Clear localStorage
        localStorage.removeItem('adminToken');

        toast('Logged out successfully');
    };

    const loadStats = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
                headers: { 'x-admin-token': token },
                withCredentials: true
            });
            setStats(data);
        } catch (err) {
            if (err.response?.status === 401) logout();
        }
    }, [token]);

    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const url = searchQuery
                ? `${API_URL}/api/admin/users?search=${encodeURIComponent(searchQuery)}`
                : `${API_URL}/api/admin/users`;

            const { data } = await axios.get(url, {
                headers: { 'x-admin-token': token },
                withCredentials: true
            });

            setUsers(data.users || []);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load users', 'error');
        } finally {
            setUsersLoading(false);
        }
    }, [token, searchQuery, toast]);

    const loadResellers = async () => {
        setResellersLoading(true);
        try {
            const url = searchQuery
                ? `${API_URL}/api/admin/resellers?search=${encodeURIComponent(searchQuery)}`
                : `${API_URL}/api/admin/resellers`;
            const { data } = await axios.get(url, {
                headers: { 'x-admin-token': token },
                withCredentials: true
            });
            setResellers(data.resellers || []);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load resellers', 'error');
        } finally {
            setResellersLoading(false);
        }
    };

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'}`;

    // ── LOGIN SCREEN ──
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

                {/* Theme toggle */}
                <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                    {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                </button>

                <div ref={loginRef} className={`relative z-10 w-full max-w-md rounded-3xl border p-8 ${dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                    {/* Glow */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />

                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="" className="relative w-9 h-9 rounded-xl object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <div>
                            <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Panel</p>
                        </div>
                    </div>

                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
                        ADMIN LOGIN
                    </h1>
                    <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Sign in with your admin secret</p>

                    {loginError && (
                        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-4">
                            <FaExclamationTriangle size={13} /> {loginError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-[0.1em] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Secret</label>
                            <input
                                type="password"
                                className={inputCls}
                                placeholder="Your ADMIN_SECRET value"
                                value={adminSecret}
                                onChange={e => setAdminSecret(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doLogin()}
                            />
                        </div>
                        <button onClick={doLogin} disabled={loginLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                            {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaLock size={14} />}
                            {loginLoading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
                <Toast toasts={toasts} />
            </div>
        );
    }

    // ── MAIN PANEL ──
    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.3} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                {/* Navbar */}
                <header className={`sticky top-0 z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                                <img src="/logo512.png" alt="" className="relative w-8 h-8 rounded-xl object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                            </div>
                            <div>
                                <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Panel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            <button onClick={logout} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-red-600/10 hover:bg-red-600 border border-red-600/25 text-red-400 hover:text-white' : 'bg-red-50 hover:bg-red-600 border border-red-200 text-red-500 hover:text-white'}`}>
                                <FaSignOutAlt size={13} /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                        {[
                            { label: 'Total Users', value: stats.total, color: 'text-red-500' },
                            { label: 'Pro Users', value: stats.pro, color: 'text-green-400' },
                            { label: 'Have Credits', value: stats.withCredits, color: 'text-blue-400' },
                            { label: 'Today', value: stats.today, color: 'text-yellow-400' },
                            { label: 'Active Resellers', value: stats.activeResellers, color: 'text-purple-400' },
                            { label: 'Total Resellers', value: stats.totalResellers, color: 'text-cyan-400' },
                        ].map(stat => (
                            <div key={stat.label} className={`rounded-2xl p-5 border transition-all ${cardCls}`}>
                                <p className={`text-xs font-semibold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: 'users', label: '👥 Users' },
                            { id: 'resellers', label: '🤝 Resellers' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setCurrentTab(tab.id);
                                    setSearchQuery('');
                                    if (tab.id === 'resellers') loadResellers();
                                    else loadUsers();
                                }}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${currentTab === tab.id
                                    ? 'bg-red-600 text-white'
                                    : dark ? 'bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]'
                                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className={`rounded-2xl p-5 border mb-6 transition-all flex gap-3 ${cardCls}`}>
                        <div className="flex-1 relative">
                            <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} size={14} />
                            <input
                                type="text"
                                placeholder={currentTab === 'users' ? 'Search users...' : 'Search resellers...'}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition ${dark
                                    ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'
                                    }`}
                            />
                        </div>
                        <button
                            onClick={() => currentTab === 'users' ? loadUsers() : loadResellers()}
                            className="px-4 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all"
                        >
                            Search
                        </button>
                    </div>

                    {/* Users Table */}
                    {currentTab === 'users' && (
                        <div className={`rounded-2xl border overflow-hidden transition-all ${cardCls}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={dark ? 'bg-white/[0.02] border-b border-white/[0.06]' : 'bg-slate-50 border-b border-slate-200'}>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Username</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Email</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Credits</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Status</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center">
                                                    <div className="inline-flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className={`px-6 py-8 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map(user => (
                                                <tr key={user._id} className={`border-t ${dark ? 'border-white/[0.06] hover:bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50'} transition`}>
                                                    <td className={`px-6 py-4 font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{user.username}</td>
                                                    <td className={`px-6 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{user.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                                            💎 {user.credits || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${user.isPro ? (dark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600') : (dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                                                            {user.isPro ? '⭐ Pro' : 'Free'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Resellers Table */}
                    {currentTab === 'resellers' && (
                        <div className={`rounded-2xl border overflow-hidden transition-all ${cardCls}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={dark ? 'bg-white/[0.02] border-b border-white/[0.06]' : 'bg-slate-50 border-b border-slate-200'}>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Username</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Email</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Credits</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Given</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Status</th>
                                            <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resellersLoading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center">
                                                    <div className="inline-flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : resellers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className={`px-6 py-8 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    No resellers found
                                                </td>
                                            </tr>
                                        ) : (
                                            resellers.map(reseller => (
                                                <tr key={reseller._id} className={`border-t ${dark ? 'border-white/[0.06] hover:bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50'} transition`}>
                                                    <td className={`px-6 py-4 font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller.username}</td>
                                                    <td className={`px-6 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{reseller.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                                            💎 {reseller.credits || 0}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        💸 {reseller.totalGiven || 0}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${reseller.isBlocked ? (dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : (dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')}`}>
                                                            {reseller.isBlocked ? '🔒 Blocked' : '✅ Active'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        {reseller.lastLogin ? new Date(reseller.lastLogin).toLocaleDateString() : 'Never'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
}