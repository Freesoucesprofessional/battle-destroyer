import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaGem, FaClipboard, FaExclamationTriangle, FaCheckCircle, FaCrown, FaStopCircle, FaSyncAlt, FaServer } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TurnstileWidget from '../components/TurnstileWidget';

export default function Attack({ toggleTheme, theme }) {
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ ip: '', port: '', duration: '' });
    const [errors, setErrors] = useState({});
    const [launching, setLaunching] = useState(false);
    const [launched, setLaunched] = useState(false);
    const [launchError, setLaunchError] = useState('');
    const [attackStatus, setAttackStatus] = useState(null);
    const [stoppingAttack, setStoppingAttack] = useState(false);
    const [bgmiServer, setBgmiServer] = useState(null);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const [captchaReady, setCaptchaReady] = useState(false);
    const captchaTokenRef = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef = useRef(null);
    const turnstileRef = useRef(null);
    const statusIntervalRef = useRef(null);
    const TOKEN_MAX_AGE_MS = 270_000;

    // ── Load user and check for existing attack ────────────────────────────────
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
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
        };
    }, [navigate, API_URL, checkAttackStatus]);

    const startStatusPolling = useCallback(() => {
        if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
        }

        statusIntervalRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.data?.status !== 'running') {
                    setAttackStatus(null);
                    setBgmiServer(null);
                    clearInterval(statusIntervalRef.current);
                } else {
                    setAttackStatus(response.data.data);
                }
            } catch (err) {
                console.error('Error polling attack status:', err);
            }
        }, 10000); // Check every 10 seconds
    }, [API_URL]);

    // Memoize checkAttackStatus to avoid dependency warning
    const checkAttackStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.data?.status === 'running') {
                setAttackStatus(response.data.data);
                setBgmiServer(response.data.data.bgmiServer);
                startStatusPolling();
            }
        } catch (err) {
            console.error('Error checking attack status:', err);
        }
    }, [API_URL]);

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

    useEffect(() => () => {
        clearTimeout(expiryTimerRef.current);
        if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
        }
    }, []);

    // ── Client-side validation (mirrors backend) ────────────────────────────────
    const validate = () => {
        const errs = {};
        const MAX = user?.isPro ? 300 : 60;

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!form.ip) errs.ip = 'IP address is required';
        else if (!ipRegex.test(form.ip)) errs.ip = 'Enter a valid IP address';

        const port = parseInt(form.port);
        if (!form.port) errs.port = 'Port is required';
        else if (isNaN(port) || port < 1 || port > 65535) errs.port = 'Port must be 1–65535';

        const dur = parseInt(form.duration);
        if (!form.duration) errs.duration = 'Duration is required';
        else if (isNaN(dur) || dur < 1) errs.duration = 'Duration must be at least 1 second';
        else if (dur > MAX) errs.duration = `Max duration is ${MAX}s${!user?.isPro ? ' (upgrade to Pro for 300s)' : ''}`;

        return errs;
    };

    // ── Launch ──────────────────────────────────────────────────────────────────
    const launch = async () => {
        setLaunchError('');
        setLaunched(false);

        // ✅ Captcha check FIRST
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
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        // Check if user already has an attack running
        if (attackStatus?.status === 'running') {
            setLaunchError('You already have an attack running. Please stop it first.');
            return;
        }

        setLaunching(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `${API_URL}/api/panel/attack`,
                {
                    ip: form.ip,
                    port: form.port,
                    duration: form.duration,
                    captchaToken
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUser(prev => ({ ...prev, credits: data.credits }));
            localStorage.setItem('user', JSON.stringify({ ...user, credits: data.credits }));

            setLaunched(true);
            setAttackStatus({
                status: 'running',
                ip: form.ip,
                port: parseInt(form.port),
                duration: parseInt(form.duration),
                startedAt: new Date().toISOString()
            });
            setBgmiServer(data.attack.bgmiServer);
            startStatusPolling();

            setTimeout(() => setLaunched(false), 4000);
            resetCaptcha();

        } catch (err) {
            const msg = err.response?.data?.message || 'Launch failed. Please try again.';
            setLaunchError(msg);

            if (err.response?.data?.credits !== undefined) {
                setUser(prev => ({ ...prev, credits: err.response.data.credits }));
            }

            if (err.response?.data?.maxDuration) {
                setErrors(prev => ({
                    ...prev,
                    duration: `Max duration is ${err.response.data.maxDuration}s${!user?.isPro ? ' (upgrade to Pro for 300s)' : ''}`
                }));
            }

            resetCaptcha();
        } finally {
            setLaunching(false);
        }
    };

    // ── Stop Attack ─────────────────────────────────────────────────────────────
    const stopAttack = async () => {
        if (!attackStatus || !bgmiServer) {
            setLaunchError('No active attack to stop');
            return;
        }

        setStoppingAttack(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/panel/stop-attack`,
                { bgmiServerUrl: bgmiServer },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAttackStatus(null);
            setBgmiServer(null);
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
        } catch (err) {
            setLaunchError(err.response?.data?.message || 'Failed to stop attack');
        } finally {
            setStoppingAttack(false);
        }
    };

    const MAX_DURATION = user?.isPro ? 300 : 60;

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

    const rules = [
        'Valid public IP address required',
        'Port range: 1 – 65535',
        `Duration: 1 – ${MAX_DURATION} seconds`,
        '1 credit per attack launch',
        'No concurrent attacks',
        'BGMI server will auto-stop after duration'
    ];

    // Calculate remaining time for active attack
    const getRemainingTime = () => {
        if (!attackStatus || !attackStatus.startedAt) return 0;

        const startTime = new Date(attackStatus.startedAt).getTime();
        const currentTime = new Date().getTime();
        const durationMs = attackStatus.duration * 1000;
        const elapsedMs = currentTime - startTime;
        const remainingMs = durationMs - elapsedMs;

        return Math.max(0, Math.floor(remainingMs / 1000));
    };

    const remainingTime = getRemainingTime();

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${sub}`}>Attack Module</p>
                    <h1 className={`text-2xl sm:text-3xl font-black ${text}`}>
                        ⚔️ Battle <span className="text-red-500">Attack Hub</span>
                    </h1>
                    <p className={`text-sm mt-1 ${sub}`}>Configure and launch your attack below</p>
                </div>

                {/* Pro / Free tier banner */}
                {user.isPro ? (
                    <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <FaCrown className="text-yellow-400 text-lg shrink-0" />
                        <p className="text-yellow-400 text-sm font-semibold">
                            Pro Account — up to <span className="font-black">300 second</span> attacks unlocked
                        </p>
                    </div>
                ) : (
                    <div className="mb-5 bg-gray-500/10 border border-gray-500/20 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
                        <p className={`text-sm ${sub}`}>
                            Free Account — attacks limited to <span className="font-bold text-white">60 seconds</span>
                        </p>
                        <Link
                            to="/contact"
                            className="text-xs bg-red-600/20 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all"
                        >
                            Upgrade to Pro
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Attack Form */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-2xl border overflow-hidden ${card}`}>
                            {/* Form header */}
                            <div className={`px-5 sm:px-6 py-4 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                                    <FaClipboard className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <h2 className={`font-bold text-sm ${text}`}>Attack Configuration</h2>
                                    <p className={`text-xs ${sub}`}>Fill in target details below</p>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 space-y-5">
                                {/* IP */}
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Target IP Address</label>
                                    <input
                                        name="ip" value={form.ip} onChange={handle}
                                        placeholder="e.g. 203.0.113.1"
                                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.ip ? 'border-red-500' : ''}`}
                                        disabled={attackStatus?.status === 'running'}
                                    />
                                    {errors.ip && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.ip}</p>}
                                </div>

                                {/* Port + Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Port</label>
                                        <input
                                            name="port" type="number" value={form.port} onChange={handle}
                                            placeholder="e.g. 8080" min="1" max="65535"
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.port ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.port && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.port}</p>}
                                    </div>

                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                                            Duration (seconds)
                                            <span className={`ml-2 normal-case font-normal ${user.isPro ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                max {MAX_DURATION}s
                                            </span>
                                        </label>
                                        <input
                                            name="duration" type="number" value={form.duration} onChange={handle}
                                            placeholder={`1 – ${MAX_DURATION}`} min="1" max={MAX_DURATION}
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.duration ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.duration && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.duration}</p>}
                                    </div>
                                </div>

                                {/* Active Attack Status */}
                                {attackStatus?.status === 'running' && (
                                    <div className={`rounded-xl p-4 border font-mono text-xs space-y-2 ${theme === 'dark' ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaServer className="text-blue-400" />
                                            <p className={`font-bold ${text}`}>Attack In Progress</p>
                                        </div>
                                        <p className="text-blue-400">Target: <span className="text-white">{attackStatus.ip}:{attackStatus.port}</span></p>
                                        <p className="text-blue-400">Duration: <span className="text-white">{attackStatus.duration}s</span></p>
                                        <p className="text-blue-400">Started: <span className="text-white">{new Date(attackStatus.startedAt).toLocaleString()}</span></p>
                                        <p className="text-blue-400">Time Remaining: <span className="text-white">{remainingTime}s</span></p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${100 - (remainingTime / attackStatus.duration * 100)}%` }}
                                            ></div>
                                        </div>
                                        <button
                                            onClick={stopAttack}
                                            disabled={stoppingAttack}
                                            className={`mt-3 w-full py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${stoppingAttack
                                                    ? 'bg-gray-600 text-gray-400 cursor-wait'
                                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                        >
                                            {stoppingAttack ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Stopping...
                                                </>
                                            ) : (
                                                <>
                                                    <FaStopCircle /> Stop Attack
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Preview */}
                                {(form.ip || form.port || form.duration) && !attackStatus && (
                                    <div className={`rounded-xl p-4 border font-mono text-xs space-y-1 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={sub}>Attack Preview:</p>
                                        <p className="text-green-400">Target: <span className="text-white">{form.ip || '—'}:{form.port || '—'}</span></p>
                                        <p className="text-green-400">Duration: <span className="text-white">{form.duration ? `${form.duration}s` : '—'}</span></p>
                                        <p className="text-green-400">Mode: <span className={user.isPro ? 'text-yellow-400' : 'text-white'}>{user.isPro ? '👑 Pro (300s max)' : 'Free (60s max)'}</span></p>
                                    </div>
                                )}

                                {/* Error */}
                                {launchError && (
                                    <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                                        <FaExclamationTriangle size={16} />{launchError}
                                    </div>
                                )}

                                {/* Success */}
                                {launched && (
                                    <div className="bg-green-500/10 border border-green-500/40 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                                        <FaCheckCircle size={16} />
                                        Attack launched on {form.ip}:{form.port} for {form.duration}s — {user.credits} credits remaining
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
                                    {!captchaReady && (
                                        <p className="text-yellow-500 text-xs mt-1.5 flex items-center gap-1">
                                            ⏳ Complete the CAPTCHA to enable launch
                                        </p>
                                    )}
                                    {captchaReady && (
                                        <p className="text-green-500 text-xs mt-1.5 flex items-center gap-1">
                                            ✅ CAPTCHA verified — ready to launch
                                        </p>
                                    )}
                                </div>

                                {/* Launch Button */}
                                <button
                                    onClick={launch}
                                    disabled={launching || user.credits < 1 || !captchaReady || attackStatus?.status === 'running'}
                                    className={`w-full py-4 rounded-xl font-black text-base tracking-wider transition-all flex items-center justify-center gap-3 ${user.credits < 1
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : !captchaReady
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : attackStatus?.status === 'running'
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : launching
                                                        ? 'bg-red-700 text-white cursor-wait'
                                                        : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xl shadow-red-900/30'
                                        }`}>
                                    {launching ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Launching Attack...</>
                                    ) : user.credits < 1 ? (
                                        '⛔ Insufficient Credits'
                                    ) : !captchaReady ? (
                                        '🔒 Complete CAPTCHA to Launch'
                                    ) : attackStatus?.status === 'running' ? (
                                        '🚀 Attack Already Running'
                                    ) : (
                                        '🚀 Launch Attack'
                                    )}
                                </button>

                                {user.credits < 1 && (
                                    <p className={`text-xs text-center ${sub}`}>
                                        You need at least 1 credit to launch. Share your referral link to earn more.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Credits card */}
                        <div className={`rounded-2xl p-5 border ${card}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaGem className="text-lg text-red-500" />
                                <h3 className={`font-bold text-sm ${text}`}>Available Credits</h3>
                            </div>
                            <p className={`font-black text-5xl mb-1 ${user.credits > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                {user.credits}
                            </p>
                            <p className={`text-xs ${sub}`}>credits remaining</p>
                            <div className={`mt-4 h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
                                    style={{ width: `${Math.min((user.credits / 10) * 100, 100)}%` }}
                                />
                            </div>

                            <Link
                                to="/contact"
                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white text-xs font-bold transition-all"
                            >
                                <FaGem size={12} />
                                Buy Credits
                            </Link>
                        </div>

                        {/* BGMI Server Status */}
                        {bgmiServer && (
                            <div className={`rounded-2xl p-5 border ${card}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaServer className="text-blue-500" />
                                    <h3 className={`font-bold text-sm ${text}`}>BGMI Server</h3>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className={sub}>Endpoint: <span className="text-white">{bgmiServer}</span></p>
                                    <p className={sub}>Status: <span className="text-green-400">Active</span></p>
                                    <button
                                        onClick={() => window.open(bgmiServer, '_blank')}
                                        className="mt-2 w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 text-blue-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <FaSyncAlt size={12} />
                                        Check Server Status
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Rules */}
                        <div className={`rounded-2xl p-5 border ${card}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaClipboard className="text-red-500" />
                                <h3 className={`font-bold text-sm ${text}`}>Attack Rules</h3>
                            </div>
                            <ul className="space-y-2">
                                {rules.map((rule, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-xs ${sub}`}>
                                        <span className="text-red-500 mt-0.5">▸</span>{rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}