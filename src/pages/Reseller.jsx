import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import {
    FaBolt, FaGem, FaCrown, FaHistory,
    FaSearch, FaSignOutAlt, FaShieldAlt, FaCheckCircle,
    FaExclamationTriangle, FaStar, FaRupeeSign, FaCalendarAlt,
    FaClock,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight, MdRadar } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Plans will be fetched from backend, but we keep a fallback
const DEFAULT_PLANS = [
    { label: 'Week', days: 7, price: 850, displayName: 'Weekly Pro (7 days)' },
    { label: 'Month', days: 30, price: 1800, displayName: 'Monthly Pro (30 days)' },
    { label: 'Season', days: 60, price: 2500, displayName: 'Season Pro (60 days)' },
];

// Icons for different plans
const PLAN_ICONS = {
    Week: FaBolt,
    Month: FaGem,
    Season: FaCrown,
};

const PLAN_COLORS = {
    Week: 'text-blue-400',
    Month: 'text-green-400',
    Season: 'text-yellow-400',
};

const PLAN_GLOWS = {
    Week: 'rgba(59,130,246,0.3)',
    Month: 'rgba(16,185,129,0.3)',
    Season: 'rgba(234,179,8,0.3)',
};

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
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

export default function Reseller({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');
    const [reseller, setReseller] = useState(null);
    const [plans, setPlans] = useState(DEFAULT_PLANS);

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
    const [stats, setStats] = useState(null);

    const loginRef = useRef(null);
    const plansRef = useRef(null);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    // Fetch plans on login
    const fetchPlans = useCallback(async (authToken) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/reseller/plans`, {
                headers: { Authorization: `Bearer ${authToken}` },
                withCredentials: true
            });
            setPlans(data.plans);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            // Keep default plans
        }
    }, []);

    // Fetch reseller stats
    const fetchStats = useCallback(async (authToken) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/reseller/stats`, {
                headers: { Authorization: `Bearer ${authToken}` },
                withCredentials: true
            });
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    useEffect(() => {
        const savedToken = localStorage.getItem('resellerToken');
        const savedReseller = localStorage.getItem('resellerData');
        if (!savedToken || !savedReseller) return;
        try {
            const parsed = JSON.parse(savedReseller);
            const resellerData = parsed?.username ? parsed : parsed?.reseller;
            if (!resellerData?.username) throw new Error('Invalid');
            setToken(savedToken);
            setReseller(resellerData);
            setIsLoggedIn(true);
            fetchPlans(savedToken);
            fetchStats(savedToken);
            
            axios.get(`${API_URL}/api/reseller/me`, {
                headers: { Authorization: `Bearer ${savedToken}` },
                withCredentials: true
            }).then(({ data }) => {
                const fresh = data.reseller ?? data;
                setReseller(fresh);
                localStorage.setItem('resellerData', JSON.stringify(fresh));
            }).catch((err) => {
                if (err.response?.status === 401) {
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
    }, [fetchPlans, fetchStats]);

    useEffect(() => {
        if (!isLoggedIn && loginRef.current) {
            gsap.fromTo(loginRef.current,
                { opacity: 0, y: 40, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn && plansRef.current) {
            const cards = plansRef.current.querySelectorAll('.plan-card');
            gsap.fromTo(cards,
                { opacity: 0, y: 30, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.07, delay: 0.2 }
            );
        }
    }, [isLoggedIn, foundUser]);

    const doLogin = async () => {
        setLoginError('');
        if (!loginForm.username) { setLoginError('Username is required'); return; }
        if (!loginForm.password) { setLoginError('Password is required'); return; }
        setLoginLoading(true);
        try {
            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const { data } = await axios.post(`${API_URL}/api/reseller/login`,
                { username: loginForm.username, password: loginForm.password },
                { withCredentials: true, headers: { 'X-CSRF-Token': csrfRes.data.csrfToken } }
            );
            setToken(data.token);
            setReseller(data.reseller);
            setIsLoggedIn(true);
            localStorage.setItem('resellerToken', data.token);
            localStorage.setItem('resellerData', JSON.stringify(data.reseller));
            await fetchPlans(data.token);
            await fetchStats(data.token);
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
        setPlans(DEFAULT_PLANS);
        setStats(null);
        setLoginForm({ username: '', password: '' });
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

    const giveProSubscription = async () => {
        setGiveError(''); setGiveSuccess('');
        if (!foundUser) { setGiveError('Search for a user first'); return; }
        if (!selectedPlan) { setGiveError('Select a plan to give'); return; }
        if (reseller.credits < selectedPlan.price) {
            setGiveError(`Insufficient credits. You have ${reseller.credits}, need ${selectedPlan.price}.`);
            return;
        }
        setGiveLoading(true);
        try {
            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const { data } = await axios.post(
                `${API_URL}/api/reseller/give-pro`,
                { 
                    userId: foundUser.userId || foundUser.email, 
                    planLabel: selectedPlan.label 
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`, 
                        'X-CSRF-Token': csrfRes.data.csrfToken 
                    }, 
                    withCredentials: true 
                }
            );
            
            // Update reseller credits
            const updatedReseller = { 
                ...reseller, 
                credits: data.resellerCreditsLeft, 
                totalGiven: (reseller.totalGiven || 0) + selectedPlan.price 
            };
            setReseller(updatedReseller);
            localStorage.setItem('resellerData', JSON.stringify(updatedReseller));
            
            // Update found user with new subscription status
            setFoundUser(prev => ({ 
                ...prev, 
                ...data.user,
                isPro: data.user.isPro,
                subscriptionStatus: data.user.subscription
            }));
            
            setGiveSuccess(`${selectedPlan.displayName} successfully given to ${foundUser.username}!`);
            toast(`✅ ${selectedPlan.displayName} given to ${foundUser.username}`);
            
            // Add to history
            setHistory(prev => [{ 
                user: foundUser.username, 
                plan: selectedPlan.displayName, 
                days: selectedPlan.days,
                price: selectedPlan.price,
                time: new Date() 
            }, ...prev].slice(0, 20));
            
            // Refresh stats
            await fetchStats(token);
            setSelectedPlan(null);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to give Pro subscription';
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
            const resellerData = data.reseller ?? data;
            setReseller(resellerData);
            localStorage.setItem('resellerData', JSON.stringify(resellerData));
            await fetchStats(token);
            toast('Account refreshed');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to refresh', 'error');
            if (err.response?.status === 401) logout();
        }
    };

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'}`;

    // Format date nicely
    const formatExpiryDate = (date) => {
        if (!date) return 'No expiry';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // ── LOGIN SCREEN ──
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
                <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                    {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                </button>
                <div ref={loginRef} className={`relative z-10 w-full max-w-md rounded-3xl border p-8 ${dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />
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
                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>RESELLER LOGIN</h1>
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

            <div className="relative z-10 flex flex-col min-h-screen">

                {/* ── Navbar ── */}
                <header className={`sticky top-0 z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

                        {/* Desktop stats in navbar */}
                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Credits</p>
                                    <p className="text-red-500 font-black text-lg leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.credits ?? 0).toLocaleString()}</p>
                                </div>
                                <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className="text-center">
                                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Given</p>
                                    <p className="text-green-400 font-black text-lg leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.totalGiven ?? 0).toLocaleString()}</p>
                                </div>
                                {stats && (
                                    <>
                                        <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                        <div className="text-center">
                                            <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Served</p>
                                            <p className={`font-black text-lg leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>{stats.usersServed || 0}</p>
                                        </div>
                                    </>
                                )}
                                <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className="text-center">
                                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Account</p>
                                    <p className={`font-bold text-sm leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller?.username}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={refreshMe} className={`hidden sm:flex text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all items-center gap-1.5 ${dark ? 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                                ↻ Refresh
                            </button>
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            <button onClick={logout} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-red-600/10 hover:bg-red-600 border border-red-600/25 text-red-400 hover:text-white' : 'bg-red-50 hover:bg-red-600 border border-red-200 text-red-500 hover:text-white'}`}>
                                <FaSignOutAlt size={13} /> <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Mobile stats bar ── */}
                <div className={`md:hidden border-b px-4 py-3 flex items-center justify-between ${dark ? 'border-white/[0.06] bg-surface-900/50' : 'border-slate-200 bg-white/50'}`}>
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Credits</p>
                        <p className="text-red-500 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.credits ?? 0).toLocaleString()}</p>
                    </div>
                    <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Given</p>
                        <p className="text-green-400 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.totalGiven ?? 0).toLocaleString()}</p>
                    </div>
                    <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Account</p>
                        <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller?.username}</p>
                    </div>
                    <button onClick={refreshMe} className={`text-xs px-2 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>↻</button>
                </div>

                {/* ── Main Content — single column ── */}
                <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col gap-5">

                        {/* ── Search card ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                    <FaSearch className="text-red-500" size={14} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>FIND USER</h3>
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
                                    {searchLoading
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <FaSearch size={13} />}
                                    Search
                                </button>
                            </div>

                            {searchError && (
                                <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mt-3">
                                    <FaExclamationTriangle size={13} /> {searchError}
                                </div>
                            )}

                            {/* User result card */}
                            {foundUser && (
                                <div className={`mt-4 rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/30 to-red-600/10 border border-red-600/20 flex items-center justify-center font-black text-lg text-red-400 shrink-0" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {(foundUser.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{foundUser.username}</p>
                                            <p className={`text-xs truncate ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{foundUser.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-lg font-bold whitespace-nowrap ${foundUser.isPro ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : dark ? 'bg-white/5 border border-white/10 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
                                                {foundUser.isPro ? '⭐ Pro Active' : 'Free'}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${dark ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                                💎 {foundUser.credits}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Show subscription info if pro */}
                                    {foundUser.isPro && foundUser.subscriptionStatus && (
                                        <div className={`mt-3 pt-3 border-t ${dark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt size={10} className="text-yellow-400" />
                                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Plan:</span>
                                                    <span className="font-semibold text-yellow-400">{foundUser.subscriptionStatus.plan}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaClock size={10} className="text-yellow-400" />
                                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>
                                                        {foundUser.subscriptionStatus.daysLeft} days left
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-[10px] mt-1 font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                Expires: {formatExpiryDate(foundUser.subscriptionStatus.expiresAt)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <p className={`text-[10px] mt-2 font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        ID: {foundUser.userId || foundUser._id}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── Plan selector — shows after user found ── */}
                        {foundUser && (
                            <div className={`rounded-2xl p-5 border ${cardCls}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <MdRadar className="text-red-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>SELECT PLAN</h3>
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Give Pro subscription to <span className="text-red-400 font-semibold">{foundUser.username}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Plans grid */}
                                <div ref={plansRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    {plans.map((plan, i) => {
                                        const Icon = PLAN_ICONS[plan.label] || FaStar;
                                        const color = PLAN_COLORS[plan.label] || 'text-red-400';
                                        const glow = PLAN_GLOWS[plan.label] || 'rgba(220,38,38,0.3)';
                                        const isSelected = selectedPlan?.label === plan.label;
                                        const canAfford = reseller?.credits >= plan.price;
                                        const isPopular = plan.label === 'Month';
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => canAfford && setSelectedPlan(isSelected ? null : plan)}
                                                disabled={!canAfford}
                                                className={`plan-card relative rounded-xl p-4 border text-left transition-all active:scale-95 ${!canAfford ? 'opacity-40 cursor-not-allowed' :
                                                    isSelected
                                                        ? dark ? `bg-gradient-to-br from-red-600/10 to-red-600/5 border-red-500/50 ring-2 ring-red-500/20` : `bg-gradient-to-br from-red-50 to-white border-red-500/50 ring-2 ring-red-500/20`
                                                        : dark ? `bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]` : `bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white`
                                                    }`}
                                                style={{ boxShadow: isSelected ? `0 0 20px ${glow}` : 'none' }}>
                                                {isPopular && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                                                        POPULAR
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                                        <FaCheckCircle size={10} className="text-white" />
                                                    </span>
                                                )}
                                                <Icon className={`${color} mb-2`} size={20} />
                                                <p className={`font-black text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                    {plan.displayName || plan.label}
                                                </p>
                                                <p className={`text-2xl font-black ${color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                    ₹{plan.price}
                                                </p>
                                                <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {plan.days} days of Pro access
                                                </p>
                                                <p className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    30 attacks/day
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

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

                                <button 
                                    onClick={giveProSubscription} 
                                    disabled={!selectedPlan || giveLoading}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100 ${!selectedPlan
                                        ? dark ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg'}`}
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: selectedPlan ? '0 4px 20px rgba(220,38,38,0.35)' : 'none' }}>
                                    {giveLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaCrown size={14} />}
                                    {giveLoading 
                                        ? 'PROCESSING...' 
                                        : selectedPlan 
                                            ? `GIVE ${selectedPlan.displayName?.toUpperCase() || selectedPlan.label.toUpperCase()} — ₹${selectedPlan.price}`
                                            : 'SELECT A PLAN ABOVE'}
                                </button>
                            </div>
                        )}

                        {/* ── Account info ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaShieldAlt className="text-red-500" size={14} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>ACCOUNT</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: 'Username', value: reseller?.username },
                                    { label: 'Email', value: reseller?.email, mono: true },
                                ].map(row => (
                                    <div key={row.label} className={`rounded-xl px-3 py-2.5 border ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{row.label}</p>
                                        <p className={`font-semibold text-sm truncate ${row.mono ? 'font-mono text-xs' : ''} ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{row.value ?? '—'}</p>
                                    </div>
                                ))}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`rounded-xl px-3 py-2.5 border text-center ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Available</p>
                                        <p className="text-red-500 font-black text-xl" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.credits ?? 0).toLocaleString()}</p>
                                        <p className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>credits</p>
                                    </div>
                                    <div className={`rounded-xl px-3 py-2.5 border text-center ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Distributed</p>
                                        <p className="text-green-400 font-black text-xl" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.totalGiven ?? 0).toLocaleString()}</p>
                                        <p className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>total credits</p>
                                    </div>
                                </div>
                                {stats && (
                                    <div className={`rounded-xl px-3 py-2.5 border text-center ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Users Served</p>
                                        <p className={`font-black text-xl ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stats.usersServed || 0}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Reseller packages (for buying credits) ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaStar className="text-yellow-400" size={13} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>BUY CREDITS</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { credits: 3000,  inr: '5,000',  usdt: '55$' },
                                    { credits: 7000,  inr: '10,000', usdt: '108$' },
                                    { credits: 15000, inr: '15,000', usdt: '160$' },
                                    { credits: 35000, inr: '20,000', usdt: '215$' },
                                ].map((pkg, i) => (
                                    <div key={i} className={`rounded-xl px-3 py-2.5 border flex items-center justify-between ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <div>
                                            <p className="text-green-400 font-black text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{pkg.credits.toLocaleString()} credits</p>
                                            <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Contact admin to purchase</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-xs ${dark ? 'text-white' : 'text-slate-900'}`}><FaRupeeSign size={9} className="inline" />{pkg.inr}</p>
                                            <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{pkg.usdt}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className={`text-center text-[10px] mt-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                Contact admin on Telegram for credit purchases
                            </p>
                        </div>

                        {/* ── Recent activity ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaHistory className="text-red-500" size={13} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>RECENT GIVES</h3>
                            </div>
                            {history.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory className={`mx-auto mb-2 ${dark ? 'text-slate-700' : 'text-slate-300'}`} size={18} />
                                    <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>No activity this session</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {history.map((h, i) => (
                                        <div key={i} className={`rounded-lg px-3 py-2.5 border ${dark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className={`font-semibold text-xs truncate ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{h.user}</p>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{h.plan}</p>
                                                    {h.days && (
                                                        <p className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{h.days} days Pro</p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                    <p className="text-yellow-400 font-bold text-xs">₹{h.price}</p>
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

            <Toast toasts={toasts} />
        </div>
    );
}