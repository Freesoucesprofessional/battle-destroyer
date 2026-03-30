import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaExclamationTriangle, FaCheckCircle, FaTrash, FaHistory,
    FaGem, FaBullseye, FaBan, FaLock, FaRocket, FaShieldAlt,
} from 'react-icons/fa';
import { MdRadar } from 'react-icons/md';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TurnstileWidget from '../components/TurnstileWidget';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Attack({ toggleTheme, theme, setIsAuth }) {
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ ip: '', port: '', duration: '' });
    const [errors, setErrors] = useState({});
    const [launching, setLaunching] = useState(false);
    const [launched, setLaunched] = useState(false);
    const [launchError, setLaunchError] = useState('');
    const [attackStatus, setAttackStatus] = useState(null);
    const [attackCompleted, setAttackCompleted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [attackHistory, setAttackHistory] = useState([]);
    const [captchaReady, setCaptchaReady] = useState(false);

    const navigate = useNavigate();
    const dark = theme !== 'light';
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const captchaTokenRef = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef = useRef(null);
    const turnstileRef = useRef(null);
    const countdownRef = useRef(null);
    const statusPollRef = useRef(null);
    const runningHistoryIdRef = useRef(null);
    const TOKEN_MAX_AGE_MS = 270_000;

    useEffect(() => {
        const saved = localStorage.getItem('attackHistory');
        if (saved) { try { setAttackHistory(JSON.parse(saved)); } catch (e) { } }
    }, []);

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
            const updated = prev.map(a => a.id === rid ? { ...a, status: 'completed', completedAt: new Date().toISOString() } : a);
            localStorage.setItem('attackHistory', JSON.stringify(updated));
            return updated;
        });
        runningHistoryIdRef.current = null;
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm('Clear all attack history? This cannot be undone.')) saveAttackHistory([]);
    }, [saveAttackHistory]);

    const startCountdown = useCallback((startedAt, duration) => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const tick = () => {
            const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
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
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/panel/attack-status`, { headers: { Authorization: `Bearer ${token}` } });
                if (response.data.data?.status === 'completed') {
                    clearInterval(statusPollRef.current);
                    clearInterval(countdownRef.current);
                    setAttackStatus(null);
                    setTimeLeft(0);
                    setAttackCompleted(true);
                    markRunningComplete();
                    setTimeout(() => setAttackCompleted(false), 5000);
                }
            } catch (err) { }
        }, 10000);
    }, [API_URL, markRunningComplete]);

    const checkAttackStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/panel/attack-status`, { headers: { Authorization: `Bearer ${token}` } });
            const data = response.data.data;
            if (data?.status === 'running') {
                setAttackStatus(data);
                startCountdown(data.startedAt, data.duration);
                startStatusPolling();
            }
        } catch (err) { }
    }, [API_URL, startCountdown, startStatusPolling]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/api/panel/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
            .catch(() => { localStorage.clear(); navigate('/login'); });
        checkAttackStatus();
        return () => { clearInterval(countdownRef.current); clearInterval(statusPollRef.current); };
    }, [navigate, API_URL, checkAttackStatus]);

    useEffect(() => () => {
        clearTimeout(expiryTimerRef.current);
        clearInterval(countdownRef.current);
        clearInterval(statusPollRef.current);
    }, []);

    const handle = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setLaunchError('');
    };

    const resetCaptcha = useCallback(() => {
        captchaTokenRef.current = '';
        captchaIssuedRef.current = null;
        setCaptchaReady(false);
        clearTimeout(expiryTimerRef.current);
        turnstileRef.current?.reset();
    }, []);

    const handleVerify = useCallback((token) => {
        captchaTokenRef.current = token;
        captchaIssuedRef.current = Date.now();
        setCaptchaReady(true);
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(resetCaptcha, TOKEN_MAX_AGE_MS);
    }, [resetCaptcha]);

    const BLOCKED_PORTS = new Set([8700, 20000, 443, 17500, 9031, 20002, 20001]);

    const validate = () => {
        const errs = {};
        const MAX = user?.isPro ? 300 : 60;
        if (!form.ip) errs.ip = 'IP address is required';
        else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.ip)) errs.ip = 'Enter a valid IP address';
        const port = parseInt(form.port);
        if (!form.port) errs.port = 'Port is required';
        else if (isNaN(port) || port < 1 || port > 65535) errs.port = 'Port must be 1–65535';
        else if (BLOCKED_PORTS.has(port)) errs.port = `Port ${port} is blocked`;
        const dur = parseInt(form.duration);
        if (!form.duration) errs.duration = 'Duration is required';
        else if (isNaN(dur) || dur < 1) errs.duration = 'Duration must be at least 1 second';
        else if (dur > MAX) errs.duration = `Max duration is ${MAX}s${!user?.isPro ? ' (Pro: 300s)' : ''}`;
        return errs;
    };

    const launch = async () => {
        setLaunchError('');
        setLaunched(false);
        setAttackCompleted(false);
        const captchaToken = captchaTokenRef.current;
        const issuedAt = captchaIssuedRef.current;
        if (!captchaToken) { setLaunchError('Please complete the CAPTCHA before launching.'); return; }
        if (!issuedAt || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) { resetCaptcha(); setLaunchError('CAPTCHA expired. Please solve it again.'); return; }
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        if (attackStatus?.status === 'running') { setLaunchError('An attack is already running.'); return; }
        setLaunching(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `${API_URL}/api/panel/attack`,
                { ip: form.ip, port: form.port, duration: form.duration, captchaToken },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(prev => ({ ...prev, credits: data.credits }));
            localStorage.setItem('user', JSON.stringify({ ...user, credits: data.credits }));
            const status = { status: 'running', ip: form.ip, port: parseInt(form.port), duration: parseInt(form.duration), startedAt: data.attack.startedAt };
            addToHistory(status);
            setAttackStatus(status);
            setLaunched(true);
            startCountdown(data.attack.startedAt, parseInt(form.duration));
            startStatusPolling();
            setTimeout(() => setLaunched(false), 3000);
            resetCaptcha();
            setForm({ ip: '', port: '', duration: '' });
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            const credits = err.response?.data?.credits;

            // ✅ Handle server overload / cooldown
            if (status === 429) {
                const cooldown = err.response?.data?.cooldown || 5;
                setLaunchError(`Server is busy. Too many attacks running. Please wait ${cooldown}seconds`);

                // optional: start cooldown timer
                setCooldown(cooldown);

                const interval = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

            }
            // ✅ Hide internal technical errors
            else if (msg?.includes("Max concurrent")) {
                setLaunchError("Server busy. Please try again shortly.");
            }
            // ✅ Default safe message
            else {
                setLaunchError(msg || "Launch failed. Please try again.");
            }

            // ✅ update credits if backend sends it
            if (credits !== undefined) {
                setUser(prev => ({ ...prev, credits }));
            }

            // ✅ reset captcha always
            resetCaptcha();
        }
        finally {
            setLaunching(false);
        }
    }
    const MAX_DURATION = user?.isPro ? 300 : 60;
    const progressPct = attackStatus
        ? Math.min(100, Math.round(((attackStatus.duration - timeLeft) / attackStatus.duration) * 100))
        : 0;

    if (!user) return (
        <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.5} />
            <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
            </div>
        </div>
    );

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
        }`;

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.4} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Credits Bar */}
                    <div className={`rounded-2xl p-4 sm:p-5 border mb-6 transition-all ${cardCls}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <FaGem className="text-red-500" size={15} />
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Available Credits
                                    </p>
                                    <p
                                        className={`font-black text-2xl ${user.credits > 0 ? 'text-red-500' : dark ? 'text-slate-600' : 'text-slate-400'}`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                    >
                                        {user.credits}
                                    </p>
                                </div>
                            </div>
                            {user.credits < 1 && (
                                <p className="text-xs text-red-400 font-semibold">Need credits to launch</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Attack Config ── */}
                        <div className="lg:col-span-2">
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
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Configure and launch your operation</p>
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
                                                <span className={`normal-case font-normal ${user?.isPro ? 'text-green-500' : dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    max {MAX_DURATION}s
                                                </span>
                                            </label>
                                            <input
                                                name="duration" type="number" value={form.duration} onChange={handle}
                                                placeholder={`1 – ${MAX_DURATION}`} min="1" max={MAX_DURATION}
                                                className={`${inputCls} ${errors.duration ? 'border-red-500/60' : ''}`}
                                                disabled={attackStatus?.status === 'running'}
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
                                            <span className="text-green-400">Attack launched — watch live progress in Recent Activity</span>
                                        </div>
                                    )}

                                    {/* CAPTCHA */}
                                    <div>
                                        <TurnstileWidget ref={turnstileRef} onVerify={handleVerify} onExpire={resetCaptcha} onError={resetCaptcha} />
                                        {!captchaReady ? (
                                            <p className={`text-xs mt-2 flex items-center gap-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <FaShieldAlt size={11} />Complete the CAPTCHA to enable launch
                                            </p>
                                        ) : (
                                            <p className="text-green-500 text-xs mt-2 flex items-center gap-1.5">
                                                <FaShieldAlt size={11} />CAPTCHA verified
                                            </p>
                                        )}
                                    </div>

                                    {/* Launch Button */}
                                    <button
                                        onClick={launch}
                                        disabled={launching || user.credits < 1 || !captchaReady || attackStatus?.status === 'running'}
                                        className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wider transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:active:scale-100 ${user.credits < 1 || !captchaReady || attackStatus?.status === 'running'
                                            ? dark ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : launching
                                                ? 'bg-red-700 text-white cursor-wait'
                                                : 'bg-red-600 hover:bg-red-500 text-white'
                                            }`}
                                        style={{
                                            fontFamily: "'Rajdhani', sans-serif",
                                            letterSpacing: '0.08em',
                                            boxShadow: (!launching && user.credits > 0 && captchaReady && attackStatus?.status !== 'running')
                                                ? '0 6px 24px rgba(220,38,38,0.35)' : 'none',
                                        }}
                                    >
                                        {launching ? (
                                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> LAUNCHING...</>
                                        ) : user.credits < 1 ? (
                                            <><FaBan size={15} /> INSUFFICIENT CREDITS</>
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
                        </div>

                        {/* ── Recent Activity ── */}
                        <div>
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
                                            className={`p-2 rounded-lg text-xs transition-all ${dark ? 'bg-red-600/10 hover:bg-red-600/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'
                                                }`}
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
                                            background: dark ? 'rgba(220,38,38,0.06)' : 'rgba(220,38,38,0.04)',
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
                                            <span className="font-black text-lg tabular-nums text-red-500 shrink-0 ml-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
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
                                    <div className="space-y-1.5 max-h-[560px] overflow-y-auto thin-scroll">
                                        {attackHistory.map((attack) => {
                                            const diffMs = Date.now() - new Date(attack.timestamp).getTime();
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMs / 3600000);
                                            const diffDays = Math.floor(diffMs / 86400000);
                                            const timeAgo = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffHours < 24 ? `${diffHours}h ago` : `${diffDays}d ago`;
                                            const isCompleted = attack.status === 'completed' || (attack.status === 'running' && attack.id !== runningHistoryIdRef.current);

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
                </div>

                <Footer theme={theme} />
            </div>
        </div>
    );
}