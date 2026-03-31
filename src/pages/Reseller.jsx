import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import {
    FaBolt, FaGem, FaFire, FaCrown, FaUsers, FaHistory,
    FaSearch, FaSignOutAlt, FaShieldAlt, FaCheckCircle,
    FaExclamationTriangle, FaStar, FaRupeeSign,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight, MdRadar } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PLANS = [
    { credits: 50, label: 'Starter', icon: FaBolt, color: 'text-blue-400', bg: 'from-blue-600/10 to-blue-600/5', border: 'border-blue-600/20', glow: 'rgba(59,130,246,0.3)' },
    { credits: 150, label: 'Basic', icon: FaGem, color: 'text-green-400', bg: 'from-green-600/10 to-green-600/5', border: 'border-green-600/20', glow: 'rgba(16,185,129,0.3)' },
    { credits: 250, label: 'Standard', icon: FaFire, color: 'text-orange-400', bg: 'from-orange-600/10 to-orange-600/5', border: 'border-orange-600/20', glow: 'rgba(249,115,22,0.3)', popular: true },
    { credits: 333, label: 'Advanced', icon: FaFire, color: 'text-red-400', bg: 'from-red-600/10 to-red-600/5', border: 'border-red-600/20', glow: 'rgba(239,68,68,0.3)' },
    { credits: 400, label: 'Pro', icon: FaCrown, color: 'text-yellow-400', bg: 'from-yellow-600/10 to-yellow-600/5', border: 'border-yellow-600/20', glow: 'rgba(234,179,8,0.3)' },
    { credits: 500, label: 'Elite', icon: FaCrown, color: 'text-purple-400', bg: 'from-purple-600/10 to-purple-600/5', border: 'border-purple-600/20', glow: 'rgba(168,85,247,0.3)' },
];

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-xl animate-slide-in
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

export default function Reseller({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');
    const [reseller, setReseller] = useState(null);

    // Panel state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [giveLoading, setGiveLoading] = useState(false);
    const [giveSuccess, setGiveSuccess] = useState('');
    const [giveError, setGiveError] = useState('');
    const [history, setHistory] = useState([]);
    const [toasts, setToasts] = useState([]);

    const loginRef = useRef(null);
    const panelRef = useRef(null);
    const plansRef = useRef(null);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    // ── Restore session from localStorage on mount ──
    useEffect(() => {
        const savedToken = localStorage.getItem('resellerToken');
        const savedReseller = localStorage.getItem('resellerData');
        if (!savedToken || !savedReseller) return;
        try {
            const parsed = JSON.parse(savedReseller);
            const resellerData = parsed?.username ? parsed : parsed?.reseller;
            if (!resellerData?.username) throw new Error('Invalid');
            // Show UI immediately with cached data
            setToken(savedToken);
            setReseller(resellerData);
            setIsLoggedIn(true);
            // ✅ Then silently re-verify token in background
            axios.get(`${API_URL}/api/reseller/me`, {
                headers: { Authorization: `Bearer ${savedToken}` },
                withCredentials: true
            }).then(({ data }) => {
                const fresh = data.reseller ?? data;
                setReseller(fresh);
                localStorage.setItem('resellerData', JSON.stringify(fresh));
            }).catch((err) => {
                if (err.response?.status === 401) {
                    // Token expired — log out cleanly
                    localStorage.removeItem('resellerToken');
                    localStorage.removeItem('resellerData');
                    setIsLoggedIn(false);
                    setToken('');
                    setReseller(null);
                }
            });
        } catch {
            localStorage.removeItem('resellerToken');
            localStorage.removeItem('resellerData');
        }
    }, []);

    // Animate login box
    useEffect(() => {
        if (!isLoggedIn && loginRef.current) {
            gsap.fromTo(loginRef.current,
                { opacity: 0, y: 40, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
    }, [isLoggedIn]);

    // Animate plan cards
    useEffect(() => {
        if (isLoggedIn && plansRef.current) {
            const cards = plansRef.current.querySelectorAll('.plan-card');
            gsap.fromTo(cards,
                { opacity: 0, y: 30, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.07, delay: 0.2 }
            );
        }
    }, [isLoggedIn]);

    const doLogin = async () => {
        setLoginError('');
        if (!loginForm.username) { setLoginError('Username is required'); return; }
        if (!loginForm.password) { setLoginError('Password is required'); return; }
        setLoginLoading(true);
        try {
            // Get CSRF
            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const csrfToken = csrfRes.data.csrfToken;

            const { data } = await axios.post(`${API_URL}/api/reseller/login`,
                { username: loginForm.username, password: loginForm.password },
                { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } }
            );
            setToken(data.token);
            setReseller(data.reseller);
            setIsLoggedIn(true);

            // ✅ Persist to localStorage
            localStorage.setItem('resellerToken', data.token);
            localStorage.setItem('resellerData', JSON.stringify(data.reseller));

            toast('Login successful!');
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
        setReseller(null);
        setFoundUser(null);
        setHistory([]);
        setLoginForm({ username: '', password: '' });

        // ✅ Clear localStorage
        localStorage.removeItem('resellerToken');
        localStorage.removeItem('resellerData');

        toast('Logged out successfully');
    };

    const searchUser = async () => {
        setSearchError(''); setFoundUser(null); setSelectedPlan(null);
        setGiveSuccess(''); setGiveError('');
        if (searchQuery.trim().length < 3) { setSearchError('Enter at least 3 characters'); return; }
        setSearchLoading(true);
        try {
            const { data } = await axios.get(
                `${API_URL}/api/reseller/search-user?query=${encodeURIComponent(searchQuery)}`,
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            setFoundUser(data);
        } catch (err) {
            setSearchError(err.response?.data?.message || 'User not found');
            toast(err.response?.data?.message || 'User not found', 'error');
        } finally {
            setSearchLoading(false);
        }
    };

    const giveCredits = async () => {
        setGiveError(''); setGiveSuccess('');
        if (!foundUser) { setGiveError('Search for a user first'); return; }
        if (!selectedPlan) { setGiveError('Select a plan to give'); return; }
        if (reseller.credits < selectedPlan.credits) {
            setGiveError(`Insufficient credits. You have ${reseller.credits}, need ${selectedPlan.credits}.`);
            return;
        }
        setGiveLoading(true);
        try {

            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const csrfToken = csrfRes.data.csrfToken;

            const { data } = await axios.post(
                `${API_URL}/api/reseller/give-credits`,
                { userId: foundUser.userId || foundUser.email, planLabel: selectedPlan.label },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-CSRF-Token': csrfToken
                    },
                    withCredentials: true
                }
            );

            const updatedReseller = { ...reseller, credits: data.resellerCreditsLeft, totalGiven: (reseller.totalGiven || 0) + selectedPlan.credits };
            setReseller(updatedReseller);

            // ✅ Update localStorage with new credits
            localStorage.setItem('resellerData', JSON.stringify(updatedReseller));

            setFoundUser(prev => ({ ...prev, credits: data.userNewCredits, isPro: true }));
            setGiveSuccess(`✅ ${selectedPlan.label} plan (${selectedPlan.credits} credits) sent to ${foundUser.username}!`);
            toast(`Sent ${selectedPlan.credits} credits to ${foundUser.username}`);
            setHistory(prev => [{ user: foundUser.username, plan: selectedPlan.label, credits: selectedPlan.credits, time: new Date() }, ...prev].slice(0, 20));
            setSelectedPlan(null);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to give credits';
            setGiveError(msg);
            toast(msg, 'error');
        } finally {
            setGiveLoading(false);
        }
    };

    const refreshMe = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/reseller/me`,
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            // ✅ Handle both { reseller: {...} } and flat {...} responses
            const resellerData = data.reseller ?? data;
            setReseller(resellerData);
            localStorage.setItem('resellerData', JSON.stringify(resellerData));
            toast('Account refreshed');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to refresh account';
            toast(msg, 'error');
            if (err.response?.status === 401) logout();
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
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Reseller Portal</p>
                        </div>
                    </div>

                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
                        RESELLER LOGIN
                    </h1>
                    <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Sign in with your reseller credentials</p>

                    {loginError && (
                        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-4">
                            <FaExclamationTriangle size={13} /> {loginError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-[0.1em] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Username or Email</label>
                            <input className={inputCls} placeholder="your_username" value={loginForm.username}
                                onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-[0.1em] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Password</label>
                            <input type="password" className={inputCls} placeholder="••••••••" value={loginForm.password}
                                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                        </div>
                        <button onClick={doLogin} disabled={loginLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                            {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaShieldAlt size={14} />}
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
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Reseller Portal</p>
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

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8" ref={panelRef}>

                    {/* Welcome / Stats bar */}
                    <div className={`rounded-2xl p-5 border mb-6 transition-all ${cardCls}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-[0.12em] mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Welcome back</p>
                                <h2 className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{reseller?.username} 👋</h2>
                            </div>
                            <div className="flex gap-6 flex-wrap">
                                {[
                                    { label: 'Credits Left', value: reseller?.credits ?? 0, color: 'text-red-500', icon: FaGem },
                                    { label: 'Total Given', value: reseller?.totalGiven ?? 0, color: 'text-green-400', icon: FaUsers },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <p className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{s.value.toLocaleString()}</p>
                                        <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                                    </div>
                                ))}
                                <button onClick={refreshMe} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                                    ↻ Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Left: Search + Plan Select ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Search */}
                            <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                        <FaSearch className="text-red-500" size={15} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>FIND USER</h3>
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Search by User ID or email</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input className={inputCls} placeholder="User ID or email…" value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchUser()} />
                                    <button onClick={searchUser} disabled={searchLoading}
                                        className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 shrink-0"
                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        {searchLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSearch size={13} />}
                                        Search
                                    </button>
                                </div>

                                {searchError && (
                                    <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mt-3">
                                        <FaExclamationTriangle size={13} /> {searchError}
                                    </div>
                                )}

                                {/* User card */}
                                {foundUser && (
                                    <div className={`mt-4 rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600/30 to-red-600/10 border border-red-600/20 flex items-center justify-center font-black text-lg text-red-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                {(foundUser.username || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{foundUser.username}</p>
                                                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{foundUser.email}</p>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-lg font-bold ${foundUser.isPro ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : dark ? 'bg-white/5 border border-white/10 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
                                                    {foundUser.isPro ? '⭐ Pro' : 'Free'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
                                                <FaGem className="text-red-400" size={11} />
                                                <span className={dark ? 'text-slate-300' : 'text-slate-600'}>{foundUser.credits} credits</span>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono ${dark ? 'bg-white/5 border border-white/10 text-slate-500' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                ID: {foundUser.userId || foundUser._id}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Plan selector */}
                            {foundUser && (
                                <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                            <MdRadar className="text-red-500" size={18} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>SELECT PLAN</h3>
                                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Choose a plan to give to {foundUser.username}</p>
                                        </div>
                                    </div>

                                    <div ref={plansRef} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                                        {PLANS.map((plan, i) => {
                                            const Icon = plan.icon;
                                            const isSelected = selectedPlan?.label === plan.label;
                                            const canAfford = reseller?.credits >= plan.credits;
                                            return (
                                                <button key={i}
                                                    onClick={() => canAfford && setSelectedPlan(isSelected ? null : plan)}
                                                    disabled={!canAfford}
                                                    className={`plan-card relative rounded-xl p-4 border text-left transition-all active:scale-95 ${!canAfford ? 'opacity-40 cursor-not-allowed' :
                                                        isSelected
                                                            ? dark ? `bg-gradient-to-br ${plan.bg} border-red-500/50 ring-2 ring-red-500/20` : `bg-gradient-to-br ${plan.bg} ${plan.border} ring-2 ring-red-500/20`
                                                            : dark ? `bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-gradient-to-br hover:${plan.bg}` : `bg-slate-50 border-slate-200 hover:border-slate-300`
                                                        }`}
                                                    style={{ boxShadow: isSelected ? `0 0 20px ${plan.glow}` : 'none' }}
                                                >
                                                    {plan.popular && (
                                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">HOT</span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                                            <FaCheckCircle size={10} className="text-white" />
                                                        </span>
                                                    )}
                                                    <Icon className={`${plan.color} mb-2`} size={16} />
                                                    <p className={`font-black text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{plan.label}</p>
                                                    <p className={`text-lg font-black ${plan.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{plan.credits}</p>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>credits</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Give button */}
                                    {giveSuccess && (
                                        <div className="flex items-center gap-2 rounded-xl p-3 border border-green-500/25 bg-green-500/8 text-green-400 text-sm mb-3">
                                            <FaCheckCircle size={13} /> {giveSuccess}
                                        </div>
                                    )}
                                    {giveError && (
                                        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-3">
                                            <FaExclamationTriangle size={13} /> {giveError}
                                        </div>
                                    )}

                                    <button onClick={giveCredits} disabled={!selectedPlan || giveLoading}
                                        className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wider transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:active:scale-100 ${!selectedPlan ? dark ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-500 text-white'
                                            }`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif", boxShadow: selectedPlan ? '0 4px 20px rgba(220,38,38,0.35)' : 'none' }}>
                                        {giveLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaGem size={15} />}
                                        {giveLoading ? 'PROCESSING...' : selectedPlan ? `GIVE ${selectedPlan.label} PLAN (${selectedPlan.credits} CREDITS)` : 'SELECT A PLAN'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Right: Info + History ── */}
                        <div className="space-y-6">
                            {/* Account info */}
                            <div className={`rounded-2xl p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <FaShieldAlt className="text-red-500" size={15} />
                                    <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>ACCOUNT INFO</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Username', value: reseller?.username },
                                        { label: 'Email', value: reseller?.email, small: true },
                                        { label: 'Credits Available', value: reseller?.credits?.toLocaleString(), highlight: true },
                                        { label: 'Total Distributed', value: (reseller?.totalGiven || 0).toLocaleString(), accent: true },
                                    ].map(row => (
                                        <div key={row.label} className={`rounded-xl p-3 border ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{row.label}</p>
                                            <p className={`font-bold ${row.small ? 'text-xs' : 'text-sm'} ${row.highlight ? 'text-red-500 text-xl' : row.accent ? 'text-green-400 text-xl' : dark ? 'text-white' : 'text-slate-900'}`}
                                                style={row.highlight || row.accent ? { fontFamily: "'Rajdhani', sans-serif" } : {}}>
                                                {row.value ?? '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reseller price list */}
                            <div className={`rounded-2xl p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <FaStar className="text-yellow-400" size={14} />
                                    <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>RESELLER PACKAGES</h3>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { credits: 3000, inr: '5K', usdt: '55$' },
                                        { credits: 7000, inr: '10K', usdt: '108$' },
                                        { credits: 15000, inr: '15K', usdt: '160$' },
                                        { credits: 35000, inr: '20K', usdt: '215$' },
                                    ].map((pkg, i) => (
                                        <div key={i} className={`rounded-xl p-3 border flex items-center justify-between ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                            <div>
                                                <p className="text-green-400 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{pkg.credits.toLocaleString()} credits</p>
                                                <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Contact admin to purchase</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}><FaRupeeSign size={11} className="inline" />{pkg.inr}</p>
                                                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{pkg.usdt} USDT</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* History */}
                            <div className={`rounded-2xl p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <FaHistory className="text-red-500" size={14} />
                                    <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>RECENT ACTIVITY</h3>
                                </div>
                                {history.length === 0 ? (
                                    <div className="text-center py-6">
                                        <FaHistory className={`mx-auto mb-2 ${dark ? 'text-slate-700' : 'text-slate-300'}`} size={20} />
                                        <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>No activity this session</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto thin-scroll">
                                        {history.map((h, i) => (
                                            <div key={i} className={`rounded-lg px-3 py-2.5 border ${dark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`font-semibold text-xs ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{h.user}</p>
                                                        <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{h.plan} plan</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-green-400 font-bold text-xs">+{h.credits}</p>
                                                        <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                            {new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
}