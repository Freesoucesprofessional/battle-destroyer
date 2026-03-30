import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationTriangle, FaCheckCircle, FaTrash, FaHistory, FaGem } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import TurnstileWidget from '../components/TurnstileWidget';

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
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const [captchaReady, setCaptchaReady] = useState(false);
    const captchaTokenRef = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef = useRef(null);
    const turnstileRef = useRef(null);
    const countdownRef = useRef(null);
    const statusPollRef = useRef(null);
    const TOKEN_MAX_AGE_MS = 270_000;
    // Track the currently running attack's history id
    const runningHistoryIdRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('attackHistory');
        if (saved) {
            try { setAttackHistory(JSON.parse(saved)); }
            catch (e) { console.error('Failed to load history:', e); }
        }
    }, []);

    const saveAttackHistory = useCallback((newHistory) => {
        localStorage.setItem('attackHistory', JSON.stringify(newHistory));
        setAttackHistory(newHistory);
    }, []);

    const addToHistory = useCallback((attack) => {
        const id = Date.now();
        runningHistoryIdRef.current = id;
        const newEntry = {
            id,
            ip: attack.ip,
            port: attack.port,
            duration: attack.duration,
            status: 'running',
            startedAt: attack.startedAt,
            completedAt: null,
            timestamp: new Date().toISOString()
        };
        setAttackHistory(prev => {
            const updated = [newEntry, ...prev].slice(0, 30);
            localStorage.setItem('attackHistory', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const markRunningComplete = useCallback(() => {
        const rid = runningHistoryIdRef.current;
        setAttackHistory(prev => {
            const updated = prev.map(a =>
                a.id === rid
                    ? { ...a, status: 'completed', completedAt: new Date().toISOString() }
                    : a
            );
            localStorage.setItem('attackHistory', JSON.stringify(updated));
            return updated;
        });
        runningHistoryIdRef.current = null;
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm('Clear all attack history? This cannot be undone.')) {
            saveAttackHistory([]);
        }
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
                const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data.data;

                if (data?.status === 'completed') {
                    clearInterval(statusPollRef.current);
                    clearInterval(countdownRef.current);
                    setAttackStatus(null);
                    setTimeLeft(0);
                    setAttackCompleted(true);
                    markRunningComplete();
                    setTimeout(() => setAttackCompleted(false), 5000);
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 10000);
    }, [API_URL, markRunningComplete]);

    const checkAttackStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data.data;
            if (data?.status === 'running') {
                setAttackStatus(data);
                startCountdown(data.startedAt, data.duration);
                startStatusPolling();
            }
        } catch (err) {
            console.error('Error checking attack status:', err);
        }
    }, [API_URL, startCountdown, startStatusPolling]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/api/panel/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setUser(r.data);
            localStorage.setItem('user', JSON.stringify(r.data));
        }).catch(() => {
            localStorage.clear();
            navigate('/login');
        });

        checkAttackStatus();

        return () => {
            clearInterval(countdownRef.current);
            clearInterval(statusPollRef.current);
        };
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

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!form.ip) errs.ip = 'IP address is required';
        else if (!ipRegex.test(form.ip)) errs.ip = 'Enter a valid IP address';

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

        if (attackStatus?.status === 'running') {
            setLaunchError('You already have an attack running. Please stop it first.');
            return;
        }

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

            const status = {
                status: 'running',
                ip: form.ip,
                port: parseInt(form.port),
                duration: parseInt(form.duration),
                startedAt: data.attack.startedAt
            };

            addToHistory(status);
            setAttackStatus(status);
            setLaunched(true);
            startCountdown(data.attack.startedAt, parseInt(form.duration));
            startStatusPolling();

            setTimeout(() => setLaunched(false), 3000);
            resetCaptcha();
            setForm({ ip: '', port: '', duration: '' });

        } catch (err) {
            const msg = err.response?.data?.message || 'Launch failed. Please try again.';
            setLaunchError(msg);

            if (err.response?.data?.credits !== undefined) {
                setUser(prev => ({ ...prev, credits: err.response.data.credits }));
            }
            resetCaptcha();
        } finally {
            setLaunching(false);
        }
    };

    const stopAttack = async () => {
        if (!attackStatus) return;
        setStoppingAttack(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/panel/stop-attack`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            clearInterval(countdownRef.current);
            clearInterval(statusPollRef.current);
            setAttackStatus(null);
            setTimeLeft(0);
            markRunningComplete();
        } catch (err) {
            setLaunchError(err.response?.data?.message || 'Failed to stop attack');
        } finally {
            setStoppingAttack(false);
        }
    };

    const MAX_DURATION = user?.isPro ? 300 : 60;
    const progressPct = attackStatus
        ? Math.min(100, Math.round(((attackStatus.duration - timeLeft) / attackStatus.duration) * 100))
        : 0;

    const bg = theme === 'dark'
        ? 'bg-gray-950 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        : 'bg-gray-50 bg-gradient-to-br from-gray-100 via-gray-50 to-white';
    const card = theme === 'dark'
        ? 'bg-gray-900/60 border-gray-700/50 backdrop-blur-xl shadow-xl shadow-black/20'
        : 'bg-white/70 border-gray-200/60 backdrop-blur-xl shadow-xl shadow-gray-200/50';
    const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const sub = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inp = theme === 'dark'
        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';

    if (!user) return (
        <div className={`min-h-screen ${bg} flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${sub}`}>Loading...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* Credits Card */}
                <div className={`rounded-2xl p-4 sm:p-5 border mb-6 ${card}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-lg">
                                <FaGem className="text-red-500" />
                            </div>
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wide ${sub}`}>Available Credits</p>
                                <p className={`font-black text-2xl ${user.credits > 0 ? 'text-red-500' : 'text-gray-600'}`}>
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

                    {/* ── ATTACK CONFIGURATION ── */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-2xl p-5 sm:p-6 border ${card}`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <span className="text-red-500 text-lg">⚔️</span>
                                </div>
                                <div>
                                    <h2 className={`font-bold text-base ${text}`}>Attack Configuration</h2>
                                    <p className={`text-xs ${sub}`}>Configure your attack below</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* IP Input */}
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                                        Target IP Address
                                    </label>
                                    <input
                                        name="ip"
                                        value={form.ip}
                                        onChange={handle}
                                        placeholder="e.g. 203.0.113.1"
                                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.ip ? 'border-red-500' : ''}`}
                                        disabled={attackStatus?.status === 'running'}
                                    />
                                    {errors.ip && <p className="text-red-400 text-xs mt-1">⚠️ {errors.ip}</p>}
                                </div>

                                {/* Port & Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                                            Port
                                        </label>
                                        <input
                                            name="port"
                                            type="number"
                                            value={form.port}
                                            onChange={handle}
                                            placeholder="e.g. 8080"
                                            min="1"
                                            max="65535"
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.port ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.port && <p className="text-red-400 text-xs mt-1">⚠️ {errors.port}</p>}
                                    </div>

                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                                            Duration (seconds)
                                            <span className={`ml-2 normal-case font-normal ${user?.isPro ? 'text-green-500' : 'text-gray-500'}`}>
                                                max {MAX_DURATION}s
                                            </span>
                                        </label>
                                        <input
                                            name="duration"
                                            type="number"
                                            value={form.duration}
                                            onChange={handle}
                                            placeholder={`1 – ${MAX_DURATION}`}
                                            min="1"
                                            max={MAX_DURATION}
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.duration ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.duration && <p className="text-red-400 text-xs mt-1">⚠️ {errors.duration}</p>}
                                    </div>
                                </div>

                                {/* Completed Banner */}
                                {attackCompleted && (
                                    <div className={`rounded-xl p-4 text-center border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/30' : 'bg-green-100 border-green-300'}`}>
                                        <p className="text-green-500 font-bold text-sm">✅ Attack Completed Successfully</p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {launchError && (
                                    <div className={`rounded-xl p-4 text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                                        <FaExclamationTriangle size={16} />{launchError}
                                    </div>
                                )}

                                {/* Success Message */}
                                {launched && (
                                    <div className={`rounded-xl p-4 text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-green-100 border border-green-300 text-green-700'}`}>
                                        <FaCheckCircle size={16} />
                                        Attack launched — watch live progress in Recent Activity →
                                    </div>
                                )}

                                {/* CAPTCHA */}
                                <div>
                                    <TurnstileWidget
                                        ref={turnstileRef}
                                        onVerify={handleVerify}
                                        onExpire={resetCaptcha}
                                        onError={resetCaptcha}
                                    />
                                    {!captchaReady ? (
                                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                            ⏳ Complete the CAPTCHA to enable launch
                                        </p>
                                    ) : (
                                        <p className="text-green-500 text-xs mt-2 flex items-center gap-1">
                                            ✅ CAPTCHA verified
                                        </p>
                                    )}
                                </div>

                                {/* Launch Button */}
                                <button
                                    onClick={launch}
                                    disabled={launching || user.credits < 1 || !captchaReady || attackStatus?.status === 'running'}
                                    className={`w-full py-3 rounded-xl font-bold text-base tracking-wider transition-all flex items-center justify-center gap-2 ${
                                        user.credits < 1 || !captchaReady || attackStatus?.status === 'running'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : launching
                                                ? 'bg-red-700 text-white cursor-wait'
                                                : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-lg shadow-red-900/30'
                                    }`}
                                >
                                    {launching ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Launching...</>
                                    ) : user.credits < 1 ? '⛔ Insufficient Credits'
                                      : !captchaReady ? '🔒 Complete CAPTCHA'
                                      : attackStatus?.status === 'running' ? '🚀 Already Running'
                                      : '🚀 Launch Attack'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── RECENT ACTIVITY ── */}
                    <div>
                        <div className={`rounded-2xl p-5 sm:p-6 border ${card}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FaHistory className="text-red-500 text-lg" />
                                    <div>
                                        <h3 className={`font-bold text-base ${text}`}>Recent Activity</h3>
                                        <p className={`text-xs ${sub}`}>Last {Math.min(attackHistory.length, 30)}</p>
                                    </div>
                                </div>
                                {attackHistory.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className={`p-2 rounded-lg text-xs transition-all ${
                                            theme === 'dark'
                                                ? 'bg-red-600/10 hover:bg-red-600/20 text-red-400'
                                                : 'bg-red-100 hover:bg-red-200 text-red-600'
                                        }`}
                                        title="Clear history"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Live Attack Card — shown at top when running */}
                            {attackStatus?.status === 'running' && (
                                <div className={`rounded-xl p-4 border-2 border-red-500/60 mb-3 ${
                                    theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
                                }`}>
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                            <span className={`font-mono font-bold text-sm truncate ${text}`}>
                                                {attackStatus.ip}:{attackStatus.port}
                                            </span>
                                        </div>
                                        <span className="font-black text-lg tabular-nums text-red-500 flex-shrink-0 ml-2">
                                            {timeLeft}s
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-gray-700/30 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${progressPct}%`,
                                                background: 'linear-gradient(90deg, #dc2626, #ef4444)'
                                            }}
                                        />
                                    </div>

                                    {/* Duration info */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs ${sub}`}>{attackStatus.duration}s total</span>
                                        <span className="text-xs font-bold text-red-400 uppercase tracking-wide">● Running</span>
                                    </div>
                                </div>
                            )}

                            {/* History list */}
                            {attackHistory.length === 0 && !attackStatus ? (
                                <div className="text-center py-8">
                                    <p className={`text-xs ${sub}`}>No attacks yet</p>
                                    <p className={`text-xs ${sub} mt-1`}>Launch your first attack to see history</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-[560px] overflow-y-auto">
                                    {attackHistory.map((attack) => {
                                        const attackDate = new Date(attack.timestamp);
                                        const diffMs = Date.now() - attackDate.getTime();
                                        const diffMins = Math.floor(diffMs / 60000);
                                        const diffHours = Math.floor(diffMs / 3600000);
                                        const diffDays = Math.floor(diffMs / 86400000);

                                        let timeAgo = '';
                                        if (diffMins < 1) timeAgo = 'Just now';
                                        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
                                        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
                                        else timeAgo = `${diffDays}d ago`;

                                        // An entry is truly running only if the global attackStatus
                                        // is still active AND this is the current running entry
                                        const isLiveRunning =
                                            attack.status === 'running' &&
                                            attackStatus?.status === 'running' &&
                                            attack.id === runningHistoryIdRef.current;

                                        const isCompleted = attack.status === 'completed';

                                        return (
                                            <div
                                                key={attack.id}
                                                className={`rounded-lg px-3 py-2.5 border transition-all ${
                                                    isCompleted
                                                        ? theme === 'dark'
                                                            ? 'bg-gray-800/60 border-gray-700/50'
                                                            : 'bg-gray-50 border-gray-200'
                                                        : theme === 'dark'
                                                            ? 'bg-red-500/8 border-red-500/20'
                                                            : 'bg-red-50/60 border-red-200'
                                                }`}
                                            >
                                                {/* Row: ip:port — time · STATUS */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-mono text-sm font-bold truncate ${text}`}>
                                                        {attack.ip}:{attack.port}
                                                    </span>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`text-xs ${sub} tabular-nums`}>{timeAgo}</span>
                                                        <span className={`text-xs font-bold uppercase tracking-wide ${
                                                            isCompleted
                                                                ? 'text-green-400'
                                                                : 'text-red-400'
                                                        }`}>
                                                            {isCompleted ? '✓ Done' : '● Live'}
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
        </div>
    );
}