import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import {
    FaBolt, FaGem, FaCrown, FaHistory,
    FaSearch, FaSignOutAlt, FaShieldAlt, FaCheckCircle,
    FaExclamationTriangle, FaStar, FaRupeeSign, FaCalendarAlt,
    FaClock, FaChartLine,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight, MdRadar } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Credit cost system (matches ResellerPrices.jsx) ──────────────────────────
// 1 credit = ₹1 wholesale cost to reseller
// Plans deduct credits from reseller balance; reseller sells at fixed customer prices
const PLANS = [
    {
        label: 'Week',
        days: 7,
        credits: 200,       // cost to reseller in credits
        customerPrice: 850, // fixed selling price in ₹
        get profit() { return this.customerPrice - this.credits; },
        get multiplier() { return (this.customerPrice / this.credits).toFixed(2); },
        displayName: 'Weekly Pro (7 days)',
        Icon: FaBolt,
        color: 'text-blue-400',
        bg: 'from-blue-600/10 to-blue-600/5',
        border: 'border-blue-600/20',
        glow: 'rgba(59,130,246,0.25)',
        ringActive: 'ring-blue-500/30 border-blue-500/50',
    },
    {
        label: 'Month',
        days: 30,
        credits: 400,
        customerPrice: 1800,
        get profit() { return this.customerPrice - this.credits; },
        get multiplier() { return (this.customerPrice / this.credits).toFixed(2); },
        displayName: 'Monthly Pro (30 days)',
        Icon: FaGem,
        color: 'text-green-400',
        bg: 'from-green-600/10 to-green-600/5',
        border: 'border-green-600/20',
        glow: 'rgba(16,185,129,0.25)',
        ringActive: 'ring-green-500/30 border-green-500/50',
        popular: true,
    },
    {
        label: 'Season',
        days: 60,
        credits: 800,
        customerPrice: 2500,
        get profit() { return this.customerPrice - this.credits; },
        get multiplier() { return (this.customerPrice / this.credits).toFixed(2); },
        displayName: 'Season Pro (60 days)',
        Icon: FaCrown,
        color: 'text-yellow-400',
        bg: 'from-yellow-600/10 to-yellow-600/5',
        border: 'border-yellow-600/20',
        glow: 'rgba(234,179,8,0.25)',
        ringActive: 'ring-yellow-500/30 border-yellow-500/50',
    },
];

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

// ── Credit balance bar ────────────────────────────────────────────────────────
function CreditBar({ credits, planCredits, dark }) {
    const pct = Math.min(100, (planCredits / Math.max(credits, 1)) * 100);
    return (
        <div className="mt-2">
            <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ${credits >= planCredits ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className={`text-[10px] mt-1 ${credits >= planCredits ? (dark ? 'text-green-500' : 'text-green-600') : (dark ? 'text-red-400' : 'text-red-500')}`}>
                {credits >= planCredits
                    ? `${(credits - planCredits).toLocaleString()} credits remaining after this`
                    : `Need ${(planCredits - credits).toLocaleString()} more credits`}
            </p>
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
    }, [fetchStats]);

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
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.07, delay: 0.1 }
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
        if ((reseller?.credits ?? 0) < selectedPlan.credits) {
            setGiveError(`Insufficient credits. You have ${reseller.credits}, need ${selectedPlan.credits}.`);
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

            // Update reseller with new credit balance from backend
            const updatedReseller = {
                ...reseller,
                credits: data.resellerCreditsLeft,
                totalGiven: (reseller.totalGiven || 0) + selectedPlan.credits
            };
            setReseller(updatedReseller);
            localStorage.setItem('resellerData', JSON.stringify(updatedReseller));

            setFoundUser(prev => ({
                ...prev,
                ...data.user,
                isPro: data.user.isPro,
                subscriptionStatus: data.user.subscription
            }));

            setGiveSuccess(`${selectedPlan.displayName} successfully given to ${foundUser.username}!`);
            toast(`✅ ${selectedPlan.displayName} given to ${foundUser.username}`);

            setHistory(prev => [{
                user: foundUser.username,
                plan: selectedPlan.displayName,
                label: selectedPlan.label,
                days: selectedPlan.days,
                creditsUsed: selectedPlan.credits,
                customerPrice: selectedPlan.customerPrice,
                profit: selectedPlan.profit,
                time: new Date()
            }, ...prev].slice(0, 20));

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

    const formatExpiryDate = (date) => {
        if (!date) return 'No expiry';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'}`;

    // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
                <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                    {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                </button>
                <div ref={loginRef} className={`relative z-10 w-full max-w-md rounded-3xl border p-8 ${dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="" className="relative w-9 h-9 rounded-xl object-contain"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <div>
                            <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Reseller Portal</p>
                        </div>
                    </div>
                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>RESELLER LOGIN</h1>
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

    const availableCredits = reseller?.credits ?? 0;

    // ── MAIN PANEL ────────────────────────────────────────────────────────────
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
                                <img src="/logo512.png" alt="" className="relative w-8 h-8 rounded-xl object-contain"
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                            </div>
                            <div>
                                <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Reseller Portal</p>
                            </div>
                        </div>

                        {/* Desktop stats */}
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-center">
                                <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Credits</p>
                                <p className="text-red-500 font-black text-lg leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{availableCredits.toLocaleString()}</p>
                            </div>
                            <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                            <div className="text-center">
                                <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Distributed</p>
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
                        <p className="text-red-500 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{availableCredits.toLocaleString()}</p>
                    </div>
                    <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Distributed</p>
                        <p className="text-green-400 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{(reseller?.totalGiven ?? 0).toLocaleString()}</p>
                    </div>
                    <div className={`w-px h-8 ${dark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Account</p>
                        <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller?.username}</p>
                    </div>
                    <button onClick={refreshMe} className={`text-xs px-2 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>↻</button>
                </div>

                {/* ── Main Content ── */}
                <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col gap-5">

                        {/* ── Search card ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                    <FaSearch className="text-red-500" size={14} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>FIND USER</h3>
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

                            {/* User result */}
                            {foundUser && (
                                <div className={`mt-4 rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/30 to-red-600/10 border border-red-600/20 flex items-center justify-center font-black text-lg text-red-400 shrink-0"
                                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
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

                        {/* ── Plan Selector — shown after user found ── */}
                        {foundUser && (
                            <div className={`rounded-2xl p-5 border ${cardCls}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <MdRadar className="text-red-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>SELECT PLAN</h3>
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Give Pro subscription to <span className="text-red-400 font-semibold">{foundUser.username}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Credit balance reminder */}
                                <div className={`flex items-center justify-between mb-4 px-3 py-2 rounded-xl border ${dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <FaGem className="text-red-500" size={12} />
                                        <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Your credits</span>
                                    </div>
                                    <span className="text-red-500 font-black text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        {availableCredits.toLocaleString()}
                                    </span>
                                </div>

                                {/* Plan cards */}
                                <div ref={plansRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    {PLANS.map((plan, i) => {
                                        const { Icon, color, bg, border, glow, ringActive, popular } = plan;
                                        const isSelected = selectedPlan?.label === plan.label;
                                        const canAfford = availableCredits >= plan.credits;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => canAfford && setSelectedPlan(isSelected ? null : plan)}
                                                disabled={!canAfford}
                                                className={`plan-card relative rounded-xl p-4 border text-left transition-all active:scale-95
                                                    ${!canAfford
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : isSelected
                                                            ? `bg-gradient-to-br ${bg} ring-2 ${ringActive}`
                                                            : dark
                                                                ? `bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.04]`
                                                                : `bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white`
                                                    }`}
                                                style={{ boxShadow: isSelected ? `0 0 20px ${glow}` : 'none' }}>

                                                {popular && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider whitespace-nowrap">
                                                        POPULAR
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                                        <FaCheckCircle size={10} className="text-white" />
                                                    </span>
                                                )}

                                                {/* Plan icon + name */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-7 h-7 rounded-lg border bg-gradient-to-br ${bg} ${border} flex items-center justify-center`}>
                                                        <Icon className={color} size={13} />
                                                    </div>
                                                    <p className={`font-black text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                        {plan.label.toUpperCase()}
                                                    </p>
                                                </div>

                                                {/* Days */}
                                                <p className={`text-[11px] mb-3 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {plan.days} days Pro access · 30 attacks/day
                                                </p>

                                                {/* Cost / Price / Profit breakdown */}
                                                <div className={`rounded-lg border divide-y text-xs mb-2 ${dark ? 'border-white/[0.07] divide-white/[0.05]' : 'border-slate-200 divide-slate-100'}`}>
                                                    {/* Credit cost */}
                                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-t-lg ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                                                        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>Costs you</span>
                                                        <span className={`font-black ${color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                            {plan.credits} cr
                                                        </span>
                                                    </div>
                                                    {/* Customer price */}
                                                    <div className={`flex items-center justify-between px-2.5 py-1.5 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                                                        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>Sell for</span>
                                                        <span className={`font-bold flex items-center gap-0.5 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                                                            <FaRupeeSign size={9} />{plan.customerPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {/* Profit */}
                                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-b-lg ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                                                        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>Your profit</span>
                                                        <span className="font-black text-green-400 flex items-center gap-0.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                            <FaRupeeSign size={9} />{plan.profit.toLocaleString()}
                                                            <span className={`text-[9px] ml-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>({plan.multiplier}×)</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Affordability indicator */}
                                                {!canAfford && (
                                                    <p className="text-[10px] text-red-400 mt-1">
                                                        Need {(plan.credits - availableCredits).toLocaleString()} more cr
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Credit impact preview when a plan is selected */}
                                {selectedPlan && (
                                    <div className={`rounded-xl p-3 border mb-4 ${dark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Credit deduction preview</span>
                                            <span className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                                                {availableCredits.toLocaleString()} → {(availableCredits - selectedPlan.credits).toLocaleString()} cr
                                            </span>
                                        </div>
                                        <CreditBar credits={availableCredits} planCredits={selectedPlan.credits} dark={dark} />
                                    </div>
                                )}

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
                                    {giveLoading
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <FaCrown size={14} />}
                                    {giveLoading
                                        ? 'PROCESSING...'
                                        : selectedPlan
                                            ? `GIVE ${selectedPlan.label.toUpperCase()} — ${selectedPlan.credits} CR DEDUCTED`
                                            : 'SELECT A PLAN ABOVE'}
                                </button>

                                {selectedPlan && (
                                    <p className={`text-center text-[10px] mt-2 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Customer pays ₹{selectedPlan.customerPrice.toLocaleString()} · Your profit ₹{selectedPlan.profit.toLocaleString()} · {selectedPlan.multiplier}× return
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Account info ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaShieldAlt className="text-red-500" size={14} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>ACCOUNT</h3>
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
                                        <p className="text-red-500 font-black text-xl" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{availableCredits.toLocaleString()}</p>
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

                        {/* ── Credit rate card ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaChartLine className="text-green-400" size={13} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>PLAN COST REFERENCE</h3>
                            </div>
                            <div className="space-y-2">
                                {PLANS.map((plan, i) => {
                                    const { Icon, color } = plan;
                                    const canAfford = availableCredits >= plan.credits;
                                    const plansYouCanSell = Math.floor(availableCredits / plan.credits);
                                    return (
                                        <div key={i} className={`rounded-xl border px-3 py-3 ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={color} size={12} />
                                                    <span className={`font-bold text-xs ${dark ? 'text-white' : 'text-slate-900'}`}
                                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                        {plan.label} · {plan.days}d
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${canAfford
                                                    ? (dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')
                                                    : (dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500')}`}>
                                                    {canAfford ? `Can sell ${plansYouCanSell}` : 'Insufficient credits'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Costs you</p>
                                                    <p className={`text-sm font-black ${color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{plan.credits} cr</p>
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Sell for</p>
                                                    <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                        <FaRupeeSign size={9} />{plan.customerPrice.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Profit</p>
                                                    <p className="text-sm font-black text-green-400 flex items-center justify-center gap-0.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                        <FaRupeeSign size={9} />{plan.profit.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className={`text-[10px] text-center mt-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                1 credit = ₹1 wholesale cost · Sell at fixed customer prices only
                            </p>
                        </div>

                        {/* ── Buy Credits ── */}
                        <div className={`rounded-2xl p-5 border ${cardCls}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <FaStar className="text-yellow-400" size={13} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>BUY CREDITS</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { credits: 5000,  inr: '5,000',  usdt: '55$',  label: 'Starter' },
                                    { credits: 10000, inr: '10,000', usdt: '108$', label: 'Growth', popular: true },
                                    { credits: 20000, inr: '20,000', usdt: '215$', label: 'Elite' },
                                ].map((pkg, i) => (
                                    <div key={i} className={`rounded-xl px-3 py-2.5 border flex items-center justify-between ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'} ${pkg.popular ? (dark ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-red-200 ring-1 ring-red-50') : ''}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-green-400 font-black text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                    {pkg.credits.toLocaleString()} credits
                                                </p>
                                                {pkg.popular && (
                                                    <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">POPULAR</span>
                                                )}
                                            </div>
                                            <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {pkg.label} · Can sell {Math.floor(pkg.credits / 200)} Week / {Math.floor(pkg.credits / 400)} Month / {Math.floor(pkg.credits / 800)} Season
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-xs flex items-center justify-end gap-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}>
                                                <FaRupeeSign size={9} />{pkg.inr}
                                            </p>
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
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>RECENT GIVES</h3>
                            </div>
                            {history.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory className={`mx-auto mb-2 ${dark ? 'text-slate-700' : 'text-slate-300'}`} size={18} />
                                    <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>No activity this session</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {history.map((h, i) => (
                                        <div key={i} className={`rounded-lg px-3 py-2.5 border ${dark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className={`font-semibold text-xs truncate ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{h.user}</p>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{h.plan} · {h.days}d</p>
                                                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        -{h.creditsUsed} cr · profit <span className="text-green-400">₹{h.profit?.toLocaleString()}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                    <p className="text-yellow-400 font-bold text-xs">₹{h.customerPrice?.toLocaleString()}</p>
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