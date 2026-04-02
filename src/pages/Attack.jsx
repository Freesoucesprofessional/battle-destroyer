import React, { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaExclamationTriangle, FaCheckCircle, FaTrash, FaHistory,
    FaGem, FaBullseye, FaBan, FaLock, FaRocket, FaShieldAlt, FaUsers, FaCrown, FaWrench, FaCalendarAlt, FaFire
} from 'react-icons/fa';
import { MdRadar } from 'react-icons/md';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';

/* ─────────────────────────────────────────────────────────────
   Inline TurnstileWidget (replaces the separate import)
───────────────────────────────────────────────────────────── */
const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef(null);
    const widgetId     = useRef(null);
    const [ready, setReady]     = useState(false);
    const [clicked, setClicked] = useState(false);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef  = useRef(onError);
    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
    useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.reset(widgetId.current); } catch {}
            }
            setClicked(false);
            widgetId.current = null;
        },
        execute() {}
    }), []);

    useEffect(() => {
        if (window.turnstile) { setReady(true); return; }
        const iv = setInterval(() => {
            if (window.turnstile) { setReady(true); clearInterval(iv); }
        }, 100);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (!clicked || !ready || !containerRef.current || widgetId.current !== null) return;
        const t = setTimeout(() => {
            try {
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey:            process.env.REACT_APP_TURNSTILE_SITE_KEY,
                    theme:              'dark',
                    retry:              'auto',
                    callback:           (token) => onVerifyRef.current?.(token),
                    'expired-callback': ()      => onExpireRef.current?.(),
                    'error-callback':   ()      => onErrorRef.current?.(),
                });
            } catch (e) { console.warn('Turnstile render error:', e); }
        }, 200);
        return () => {
            clearTimeout(t);
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.remove(widgetId.current); } catch {}
                widgetId.current = null;
            }
        };
    }, [clicked, ready]);

    return (
        <div className="my-0">
            {!clicked ? (
                <button
                    type="button"
                    onClick={() => setClicked(true)}
                    className="w-full cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-xl
                               border-2 border-dashed border-slate-700 bg-white/[0.02]
                               hover:border-red-500/50 hover:bg-red-500/[0.04] hover:text-red-400
                               text-slate-400 transition-all duration-200 select-none group"
                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}
                >
                    <span className="w-5 h-5 rounded border-2 border-slate-600 group-hover:border-red-500/60
                                     flex items-center justify-center shrink-0 transition-colors">
                        <span className="w-2 h-2 rounded-sm bg-transparent" />
                    </span>
                    <FaShieldAlt size={13} className="text-red-500/50 shrink-0" />
                    <span className="text-sm font-bold tracking-widest">VERIFY — I'M NOT A BOT</span>
                    <span className="ml-auto flex items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
                        <img
                            src="https://challenges.cloudflare.com/turnstile/e/favicon.ico"
                            alt="cf"
                            className="w-3.5 h-3.5"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-[10px] font-semibold tracking-wider text-slate-500">CLOUDFLARE</span>
                    </span>
                </button>
            ) : (
                <div>
                    {!ready && (
                        <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                            <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin shrink-0" />
                            <span className="text-slate-500 text-xs font-semibold tracking-wider"
                                  style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                LOADING CAPTCHA...
                            </span>
                        </div>
                    )}
                    <div ref={containerRef} />
                </div>
            )}
        </div>
    );
});

/* ─────────────────────────────────────────────────────────────
   CaptchaSection
───────────────────────────────────────────────────────────── */
function CaptchaSection({ dark, captchaReady, turnstileRef, handleVerify, resetCaptcha, issuedAt, TOKEN_MAX_AGE_MS }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!captchaReady || !issuedAt) {
            clearInterval(timerRef.current);
            setTimeLeft(0);
            return;
        }
        const tick = () => {
            const remaining = Math.max(0, Math.floor((TOKEN_MAX_AGE_MS - (Date.now() - issuedAt)) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) { clearInterval(timerRef.current); resetCaptcha(); }
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [captchaReady, issuedAt, TOKEN_MAX_AGE_MS, resetCaptcha]);

    if (captchaReady) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const pct  = Math.round((timeLeft / (TOKEN_MAX_AGE_MS / 1000)) * 100);
        const expiring = timeLeft < 60;

        return (
            <div>
                <div className={`w-full py-3 px-4 rounded-xl border flex items-center gap-2.5 ${
                    dark ? 'border-green-500/30 bg-green-500/[0.06]' : 'border-green-400/40 bg-green-50'
                }`}>
                    <FaCheckCircle className="text-green-500 shrink-0" size={14} />
                    <span className="text-green-500 text-sm font-bold tracking-widest"
                          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        VERIFIED — READY TO LAUNCH
                    </span>
                    <span className={`ml-auto text-xs font-bold tabular-nums ${expiring ? 'text-red-400' : 'text-amber-400'}`}
                          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {mins}:{String(secs).padStart(2, '0')}
                    </span>
                </div>
                <div className={`h-0.5 rounded-full mt-1.5 overflow-hidden ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: expiring ? '#ef4444' : '#f59e0b' }}
                    />
                </div>
                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Token valid · auto-resets on expiry
                </p>
            </div>
        );
    }

    return (
        <TurnstileWidget
            ref={turnstileRef}
            onVerify={handleVerify}
            onExpire={resetCaptcha}
            onError={resetCaptcha}
        />
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Attack page
───────────────────────────────────────────────────────────── */
export default function Attack({ toggleTheme, theme, setIsAuth }) {
    const [user, setUser]                   = useState(null);
    const [form, setForm]                   = useState({ ip: '', port: '', duration: '' });
    const [errors, setErrors]               = useState({});
    const [launching, setLaunching]         = useState(false);
    const [launched, setLaunched]           = useState(false);
    const [launchError, setLaunchError]     = useState('');
    const [attackStatus, setAttackStatus]   = useState(null);
    const [attackCompleted, setAttackCompleted] = useState(false);
    const [timeLeft, setTimeLeft]           = useState(0);
    const [attackHistory, setAttackHistory] = useState([]);
    const [captchaReady, setCaptchaReady]   = useState(false);
    const [cooldown, setCooldown]           = useState(0);
    const [stats, setStats]                 = useState({ totalAttacks: 0, totalUsers: 0 });

    const cooldownTimerRef   = useRef(null);
    const captchaTokenRef    = useRef('');
    const captchaIssuedRef   = useRef(null);
    const expiryTimerRef     = useRef(null);
    const turnstileRef       = useRef(null);
    const countdownRef       = useRef(null);
    const statusPollRef      = useRef(null);
    const runningHistoryIdRef = useRef(null);

    const TOKEN_MAX_AGE_MS = 270_000;
    const MAINTENANCE = true;
    const navigate = useNavigate();
    const dark = theme !== 'light';
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Check if user is Pro and subscription is active
    const isProActive = user?.subscription?.type === 'pro' && user?.subscription?.expiresAt && new Date(user.subscription.expiresAt) > new Date();
    
    const daysLeft = isProActive && user?.subscription?.expiresAt 
        ? Math.ceil((new Date(user.subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;
    
    // Check if user can attack - Pro always can (unlimited), Free needs credits
    const canAttack = isProActive ? true : (user?.credits || 0) > 0;

    /* ── History helpers ── */
    useEffect(() => {
        const saved = localStorage.getItem('attackHistory');
        if (saved) { try { setAttackHistory(JSON.parse(saved)); } catch {} }
    }, []);

    useEffect(() => () => clearInterval(cooldownTimerRef.current), []);

    const saveAttackHistory = useCallback((h) => {
        localStorage.setItem('attackHistory', JSON.stringify(h));
        setAttackHistory(h);
    }, []);

    const addToHistory = useCallback((attack) => {
        const id = Date.now();
        runningHistoryIdRef.current = id;
        const entry = { id, ...attack, status: 'running', timestamp: new Date().toISOString(), completedAt: null };
        setAttackHistory(prev => {
            const updated = [entry, ...prev].slice(0, 30);
            localStorage.setItem('attackHistory', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const markRunningComplete = useCallback(() => {
        const rid = runningHistoryIdRef.current;
        setAttackHistory(prev => {
            const updated = prev.map(a => a.id === rid
                ? { ...a, status: 'completed', completedAt: new Date().toISOString() }
                : a);
            localStorage.setItem('attackHistory', JSON.stringify(updated));
            return updated;
        });
        runningHistoryIdRef.current = null;
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm('Clear all attack history? This cannot be undone.')) saveAttackHistory([]);
    }, [saveAttackHistory]);

    /* ── Countdown + polling ── */
    const startCountdown = useCallback((startedAt, duration) => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const tick = () => {
            const elapsed   = (Date.now() - new Date(startedAt).getTime()) / 1000;
            const remaining = Math.max(0, Math.floor(duration - elapsed));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(countdownRef.current);
                setAttackStatus(null);
                setAttackCompleted(true);
                markRunningComplete();
                setTimeout(() => setAttackCompleted(false), 5000);
            }
        };
        tick();
        countdownRef.current = setInterval(tick, 1000);
    }, [markRunningComplete]);

    const startStatusPolling = useCallback(() => {
        if (statusPollRef.current) clearInterval(statusPollRef.current);
        statusPollRef.current = setInterval(async () => {
            try {
                const token    = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.data?.status === 'completed') {
                    clearInterval(statusPollRef.current);
                    clearInterval(countdownRef.current);
                    setAttackStatus(null);
                    setTimeLeft(0);
                    setAttackCompleted(true);
                    markRunningComplete();
                    setTimeout(() => setAttackCompleted(false), 5000);
                }
            } catch {}
        }, 10000);
    }, [API_URL, markRunningComplete]);

    const checkAttackStatus = useCallback(async () => {
        try {
            const token    = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data;
            if (data?.status === 'running') {
                setAttackStatus(data);
                startCountdown(data.startedAt, data.duration);
                startStatusPolling();
            }
        } catch {}
    }, [API_URL, startCountdown, startStatusPolling]);

    /* ── Bootstrap - Fetch user with subscription data ── */
    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/api/panel/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { 
                setUser(r.data); 
                localStorage.setItem('user', JSON.stringify(r.data));
            })
            .catch(() => { localStorage.clear(); navigate('/login'); });
        checkAttackStatus();
        
        // Refresh user data every minute to update remaining attacks/credits
        const interval = setInterval(() => {
            if (token) {
                axios.get(`${API_URL}/api/panel/me`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => { setUser(r.data); })
                    .catch(() => {});
            }
        }, 60000);
        
        return () => { 
            clearInterval(countdownRef.current); 
            clearInterval(statusPollRef.current);
            clearInterval(interval);
        };
    }, [navigate, API_URL, checkAttackStatus]);

    useEffect(() => () => {
        clearTimeout(expiryTimerRef.current);
        clearInterval(countdownRef.current);
        clearInterval(statusPollRef.current);
    }, []);

    useEffect(() => {
        axios.get(`${API_URL}/api/panel/stats`)
            .then(r => setStats(r.data))
            .catch(() => {});
    }, [API_URL]);

    /* ── Captcha ── */
    const resetCaptcha = useCallback(() => {
        captchaTokenRef.current  = '';
        captchaIssuedRef.current = null;
        setCaptchaReady(false);
        clearTimeout(expiryTimerRef.current);
        turnstileRef.current?.reset();
    }, []);

    const handleVerify = useCallback((token) => {
        captchaTokenRef.current  = token;
        captchaIssuedRef.current = Date.now();
        setCaptchaReady(true);
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(resetCaptcha, TOKEN_MAX_AGE_MS);
    }, [resetCaptcha]);

    /* ── Form ── */
    const handle = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setLaunchError('');
    };

    const BLOCKED_PORTS = new Set([8700, 20000, 443, 17500, 9031, 20002, 20001]);

    const validate = () => {
        const errs = {};
        const MAX  = isProActive ? 300 : 60;
        if (!form.ip)
            errs.ip = 'IP address is required';
        else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.ip))
            errs.ip = 'Enter a valid IP address';

        const port = parseInt(form.port);
        if (!form.port)
            errs.port = 'Port is required';
        else if (isNaN(port) || port < 1 || port > 65535)
            errs.port = 'Port must be 1–65535';
        else if (BLOCKED_PORTS.has(port))
            errs.port = `Port ${port} is blocked`;

        const dur = parseInt(form.duration);
        if (!form.duration)
            errs.duration = 'Duration is required';
        else if (isNaN(dur) || dur < 1)
            errs.duration = 'Duration must be at least 1 second';
        else if (dur > MAX)
            errs.duration = `Max duration is ${MAX}s${!isProActive ? ' (Pro: 300s)' : ''}`;

        return errs;
    };

    /* ── Launch ── */
    const launch = async () => {
        setLaunchError('');
        setLaunched(false);
        setAttackCompleted(false);

        const captchaToken = captchaTokenRef.current;
        const issuedAt     = captchaIssuedRef.current;

        if (!captchaToken) {
            setLaunchError('Please complete the CAPTCHA before launching.');
            return;
        }
        if (!issuedAt || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) {
            resetCaptcha();
            setLaunchError('CAPTCHA expired. Please solve it again.');
            return;
        }

        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        if (attackStatus?.status === 'running') { setLaunchError('An attack is already running.'); return; }

        setLaunching(true);
        try {
            const token  = localStorage.getItem('token');
            const { data } = await axios.post(
                `${API_URL}/api/panel/attack`,
                { ip: form.ip, port: form.port, duration: form.duration, captchaToken },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Update user data
            if (data.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            const status = {
                status:    'running',
                ip:        form.ip,
                port:      parseInt(form.port),
                duration:  parseInt(form.duration),
                startedAt: data.attack.startedAt,
            };
            addToHistory(status);
            setAttackStatus(status);
            setLaunched(true);
            startCountdown(data.attack.startedAt, parseInt(form.duration));
            startStatusPolling();
            setTimeout(() => setLaunched(false), 3000);
            resetCaptcha();
            setForm({ ip: '', port: '', duration: '' });
            
            // Refresh stats after attack
            axios.get(`${API_URL}/api/panel/stats`)
                .then(r => setStats(r.data))
                .catch(() => {});
                
        } catch (err) {
            const status  = err.response?.status;
            const msg     = err.response?.data?.message;
            const credits = err.response?.data?.credits;
            const remainingAttacks = err.response?.data?.remainingAttacks;

            if (remainingAttacks !== undefined) {
                setUser(prev => ({ ...prev, remainingAttacks }));
            }

            if (status === 429) {
                const cooldownTime = err.response?.data?.cooldown || 5;
                setLaunchError(`Server is busy. Too many attacks running. Please wait ${cooldownTime} seconds`);
                setCooldown(cooldownTime);
                clearInterval(cooldownTimerRef.current);
                cooldownTimerRef.current = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) { clearInterval(cooldownTimerRef.current); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else if (msg?.includes('Max concurrent')) {
                setLaunchError('Server busy. Please try again shortly.');
            } else {
                setLaunchError(msg || 'Launch failed. Please try again.');
            }

            if (credits !== undefined) setUser(prev => ({ ...prev, credits }));
            resetCaptcha();
        } finally {
            setLaunching(false);
        }
    };

    /* ── Derived ── */
    const MAX_DURATION = isProActive ? 300 : 60;
    const progressPct  = attackStatus
        ? Math.min(100, Math.round(((attackStatus.duration - timeLeft) / attackStatus.duration) * 100))
        : 0;

    /* ── Loading screen ── */
    if (!user) return (
        <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.5} />
            <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
            </div>
        </div>
    );

    /* ── Style helpers ── */
    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
    }`;

    /* ────────────────────────────────────────────────────────── */
    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.4} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col gap-6">

                        {/* ── User Stats Cards ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            {/* Plan Type Card */}
                            <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${cardCls} ${isProActive ? 'border-red-500/30' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isProActive ? 'bg-red-600/20 border border-red-600/30' : 'bg-red-600/10 border border-red-600/20'}`}>
                                        {isProActive ? <FaCrown className="text-yellow-500" size={15} /> : <FaGem className="text-red-500" size={15} />}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Current Plan
                                        </p>
                                        <p className="font-black text-xl text-red-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {isProActive ? 'PRO ACTIVE' : 'FREE TIER'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Attacks Card - FIXED */}
                            <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <FaFire className="text-red-500" size={15} />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Total Attacks
                                        </p>
                                        <p className="font-black text-2xl text-red-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {stats.totalAttacks?.toLocaleString() || 0}
                                        </p>
                                        <p className={`text-[10px] mt-0.5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            All time
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Users Card */}
                            <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <FaUsers className="text-red-500" size={15} />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Total Users
                                        </p>
                                        <p className="font-black text-2xl text-red-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {stats.totalUsers?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Expiry (Pro only) */}
                        {isProActive && (
                            <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${cardCls}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <FaCalendarAlt className="text-red-500" size={15} />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Plan Expires In
                                        </p>
                                        <p className="font-black text-xl text-red-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {daysLeft} days
                                        </p>
                                        <p className={`text-xs mt-1 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {user?.subscription?.plan?.toUpperCase() || 'PRO'} plan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Free Tier Warning ── */}
                        {!isProActive && (
                            <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${dark
                                ? 'bg-yellow-500/[0.06] border-yellow-500/25'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <FaExclamationTriangle className="text-yellow-400" size={15} />
                                    </div>
                                    <div>
                                        <p
                                            className={`font-bold text-sm mb-0.5 ${dark ? 'text-yellow-300' : 'text-yellow-700'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
                                        >
                                            FREE TIER — LIMITED ACCESS
                                        </p>
                                        <p className={`text-xs leading-relaxed ${dark ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
                                            You have <span className="font-bold">{user?.credits || 0} credits</span> remaining. 
                                            Each attack costs 1 credit. Max duration: <span className="font-bold">60 seconds</span>.
                                            Upgrade to <span className="font-bold">Pro</span> to unlock <span className="font-bold">unlimited attacks</span> and <span className="font-bold">300 second</span> attacks!
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="/contact"
                                    className="shrink-0 inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-colors active:scale-95 whitespace-nowrap"
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}
                                >
                                    <FaCrown size={12} />
                                    UPGRADE TO PRO
                                </a>
                            </div>
                        )}

                        {/* ── Pro User Info ── */}
                        {isProActive && (
                            <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${dark
                                ? 'bg-green-500/[0.06] border-green-500/25'
                                : 'bg-green-50 border-green-200'
                            }`}>
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <FaCrown className="text-green-500" size={15} />
                                    </div>
                                    <div>
                                        <p
                                            className={`font-bold text-sm mb-0.5 ${dark ? 'text-green-300' : 'text-green-700'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
                                        >
                                            PRO PLAN ACTIVE — UNLIMITED ATTACKS
                                        </p>
                                        <p className={`text-xs leading-relaxed ${dark ? 'text-green-400/70' : 'text-green-600'}`}>
                                            You have <span className="font-bold">unlimited attacks</span>. Max duration: <span className="font-bold">300 seconds</span> per attack.
                                            {daysLeft <= 7 && daysLeft > 0 && (
                                                <span className="block mt-1 text-yellow-500 font-bold">
                                                    ⚠️ Your plan expires in {daysLeft} days! Consider renewing to keep unlimited access.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Attack Config ── */}
                        <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <MdRadar className="text-red-500" size={18} />
                                </div>
                                <div>
                                    <h2
                                        className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-900'}`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
                                    >
                                        ATTACK CONFIGURATION
                                    </h2>
                                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {isProActive 
                                            ? '⚡ Unlimited attacks — launch as many as you want!'
                                            : `💎 Each attack costs 1 credit · ${user?.credits || 0} credits left`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* IP */}
                                <div>
                                    <label className="bd-label">Target IP Address</label>
                                    <input
                                        name="ip" value={form.ip} onChange={handle}
                                        placeholder="e.g. 203.0.113.1"
                                        className={`${inputCls} ${errors.ip ? 'border-red-500/60' : ''}`}
                                        disabled={attackStatus?.status === 'running'}
                                    />
                                    {errors.ip && (
                                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
                                            <FaExclamationTriangle size={11} />{errors.ip}
                                        </p>
                                    )}
                                </div>

                                {/* Port & Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="bd-label">Port</label>
                                        <input
                                            name="port" type="number" value={form.port} onChange={handle}
                                            placeholder="e.g. 8080" min="1" max="65535"
                                            className={`${inputCls} ${errors.port ? 'border-red-500/60' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.port && (
                                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
                                                <FaExclamationTriangle size={11} />{errors.port}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="bd-label">
                                            Duration (seconds){' '}
                                            <span className={`normal-case font-normal ${isProActive ? 'text-green-500' : dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                max {MAX_DURATION}s
                                            </span>
                                        </label>
                                        <input
                                            name="duration" type="number" value={form.duration} onChange={handle}
                                            placeholder={`1 – ${MAX_DURATION}`} min="1" max={MAX_DURATION}
                                            className={`${inputCls} ${errors.duration ? 'border-red-500/60' : ''}`}
                                            disabled={
                                                launching ||
                                                !canAttack ||
                                                attackStatus?.status === 'running' ||
                                                cooldown > 0
                                            }
                                        />
                                        {errors.duration && (
                                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
                                                <FaExclamationTriangle size={11} />{errors.duration}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status messages */}
                                {attackCompleted && (
                                    <div className="rounded-xl p-4 border border-green-500/25 bg-green-500/8 flex items-center gap-2.5">
                                        <FaCheckCircle className="text-green-500 shrink-0" size={15} />
                                        <p className="text-green-400 font-semibold text-sm">Attack Completed Successfully</p>
                                    </div>
                                )}
                                {launchError && (
                                    <div className="rounded-xl p-4 border border-red-500/25 bg-red-500/8 flex items-center gap-2.5 text-sm">
                                        <FaExclamationTriangle className="text-red-400 shrink-0" size={15} />
                                        <span className="text-red-400">{launchError}</span>
                                    </div>
                                )}
                                {launched && (
                                    <div className="rounded-xl p-4 border border-green-500/25 bg-green-500/8 flex items-center gap-2.5 text-sm">
                                        <FaCheckCircle className="text-green-400 shrink-0" size={15} />
                                        <span className="text-green-400">
                                            Attack launched! {isProActive 
                                                ? 'You have unlimited attacks remaining' 
                                                : `${(user?.credits || 0) - 1} credits remaining`}
                                        </span>
                                    </div>
                                )}

                                {/* ── CAPTCHA ── */}
                                <CaptchaSection
                                    dark={dark}
                                    captchaReady={captchaReady}
                                    turnstileRef={turnstileRef}
                                    handleVerify={handleVerify}
                                    resetCaptcha={resetCaptcha}
                                    issuedAt={captchaIssuedRef.current}
                                    TOKEN_MAX_AGE_MS={TOKEN_MAX_AGE_MS}
                                />

                                {/* ── Launch Button ── */}
                                <button
                                    onClick={launch}
                                    disabled={
                                        MAINTENANCE ||
                                        launching ||
                                        !canAttack ||
                                        !captchaReady ||
                                        attackStatus?.status === 'running' ||
                                        cooldown > 0
                                    }
                                    className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wider transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:active:scale-100 ${
                                        MAINTENANCE
                                            ? dark
                                                ? 'bg-yellow-500/10 text-yellow-500/60 cursor-not-allowed'
                                                : 'bg-yellow-50 text-yellow-400 cursor-not-allowed'
                                            : !canAttack || !captchaReady || attackStatus?.status === 'running' || cooldown > 0
                                                ? dark
                                                    ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : launching
                                                    ? 'bg-red-700 text-white cursor-wait'
                                                    : 'bg-red-600 hover:bg-red-500 text-white'
                                    }`}
                                >
                                    {MAINTENANCE ? (
                                        <><FaWrench size={15} /> SERVER UNDER MAINTENANCE</>
                                    ) : cooldown > 0 ? (
                                        <>WAIT {cooldown}s</>
                                    ) : launching ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            LAUNCHING...
                                        </>
                                    ) : !canAttack ? (
                                        <>{isProActive ? <FaBan size={15} /> : <FaGem size={15} />} {isProActive ? 'SERVICE UNAVAILABLE' : 'INSUFFICIENT CREDITS'}</>
                                    ) : !captchaReady ? (
                                        <><FaLock size={15} /> COMPLETE CAPTCHA</>
                                    ) : attackStatus?.status === 'running' ? (
                                        <><FaRocket size={15} /> ATTACK RUNNING</>
                                    ) : (
                                        <><FaRocket size={15} /> LAUNCH ATTACK</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── Recent Activity ── */}
                        <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <FaHistory className="text-red-500" size={15} />
                                    <div>
                                        <h3
                                            className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
                                        >
                                            RECENT ACTIVITY
                                        </h3>
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Last {Math.min(attackHistory.length, 30)}
                                        </p>
                                    </div>
                                </div>
                                {attackHistory.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className={`p-2 rounded-lg text-xs transition-all ${dark ? 'bg-red-600/10 hover:bg-red-600/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                                        title="Clear history"
                                    >
                                        <FaTrash size={11} />
                                    </button>
                                )}
                            </div>

                            {/* Live attack card */}
                            {attackStatus?.status === 'running' && (
                                <div
                                    className="rounded-xl p-4 mb-3 border-2"
                                    style={{
                                        borderColor: 'rgba(220,38,38,0.5)',
                                        background:  dark ? 'rgba(220,38,38,0.06)' : 'rgba(220,38,38,0.04)',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                            </span>
                                            <span className={`font-mono font-bold text-sm truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
                                                {attackStatus.ip}:{attackStatus.port}
                                            </span>
                                        </div>
                                        <span className="font-black text-lg tabular-nums text-red-500 shrink-0 ml-2"
                                              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {timeLeft}s
                                        </span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${dark ? 'bg-white/[0.08]' : 'bg-red-100'}`}>
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 progress-bar-glow"
                                            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #dc2626, #ef4444)' }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{attackStatus.duration}s total</span>
                                        <span className="text-xs font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            Running
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* History list */}
                            {attackHistory.length === 0 && !attackStatus ? (
                                <div className="text-center py-8">
                                    <FaBullseye className={`mx-auto mb-2 ${dark ? 'text-slate-700' : 'text-slate-300'}`} size={22} />
                                    <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>No attacks yet</p>
                                    <p className={`text-xs mt-1 ${dark ? 'text-slate-700' : 'text-slate-300'}`}>Launch your first attack to see history</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {attackHistory.map((attack) => {
                                        const diffMs   = Date.now() - new Date(attack.timestamp).getTime();
                                        const diffMins = Math.floor(diffMs / 60000);
                                        const diffHours = Math.floor(diffMs / 3600000);
                                        const diffDays  = Math.floor(diffMs / 86400000);
                                        const timeAgo = diffMins < 1 ? 'Just now'
                                            : diffMins < 60  ? `${diffMins}m ago`
                                            : diffHours < 24 ? `${diffHours}h ago`
                                            : `${diffDays}d ago`;
                                        const isCompleted = attack.status === 'completed'
                                            || (attack.status === 'running' && attack.id !== runningHistoryIdRef.current);

                                        return (
                                            <div
                                                key={attack.id}
                                                className={`rounded-lg px-3 py-2.5 border transition-all ${isCompleted
                                                    ? dark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'
                                                    : dark ? 'bg-red-500/[0.05] border-red-500/20' : 'bg-red-50 border-red-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-mono text-sm font-bold truncate ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        {attack.ip}:{attack.port}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-xs tabular-nums ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{timeAgo}</span>
                                                        <span className={`text-xs font-bold uppercase tracking-wide ${isCompleted ? 'text-green-400' : 'text-red-400'}`}>
                                                            {isCompleted ? 'Done' : 'Live'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <Footer theme={theme} />
            </div>
        </div>
    );
}