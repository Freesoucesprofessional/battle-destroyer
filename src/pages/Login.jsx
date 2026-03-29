import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCrosshairs, FaGem, FaLink, FaBolt } from 'react-icons/fa';
import TurnstileWidget from '../components/TurnstileWidget';
import PasswordInput from '../components/PasswordInput';

const TOKEN_MAX_AGE_MS = 270_000;

export default function Login({ toggleTheme, theme }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const [captchaReady, setCaptchaReady] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const captchaTokenRef = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef = useRef(null);

    // FIX: ref pointing to the TurnstileWidget instance so we can call
    // widget.reset() with the correct widgetId — window.turnstile.reset()
    // with no arguments silently does nothing, which meant the old token
    // was reused on every retry and login always failed after the first attempt.
    const turnstileRef = useRef(null);

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const resetCaptcha = useCallback(() => {
        captchaTokenRef.current = '';
        captchaIssuedRef.current = null;
        setCaptchaReady(false);
        clearTimeout(expiryTimerRef.current);
        // FIX: call reset on the widget ref (passes the widgetId internally)
        // instead of window.turnstile.reset() which resets nothing without an ID
        turnstileRef.current?.reset();
    }, []);

    const handleVerify = useCallback((token) => {
        captchaTokenRef.current = token;
        captchaIssuedRef.current = Date.now();
        setCaptchaReady(true);
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(resetCaptcha, TOKEN_MAX_AGE_MS);
    }, [resetCaptcha]);

    useEffect(() => () => clearTimeout(expiryTimerRef.current), []);

    const submit = async e => {
        e.preventDefault();
        setError('');

        const token = captchaTokenRef.current;
        const issuedAt = captchaIssuedRef.current;

        if (!token) return setError('Please complete the CAPTCHA.');

        if (!issuedAt || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) {
            resetCaptcha();
            return setError('CAPTCHA expired. Please solve it again.');
        }

        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/api/auth/login`, {
                ...form,
                captchaToken: token,
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');

        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
            // Token is consumed — reset so next attempt gets a fresh one
            resetCaptcha();

        } finally {
            setLoading(false);
        }
    };

    const dark = theme === 'dark';

    const tokenAgePercent = captchaIssuedRef.current
        ? Math.min(100, ((Date.now() - captchaIssuedRef.current) / TOKEN_MAX_AGE_MS) * 100)
        : 0;

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>

            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900 to-gray-950" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-800/10 rounded-full blur-2xl" />
                <div className="relative text-center px-12">
                    <div className="flex justify-center mb-6">
                        <img src="/logo512.png" alt="Battle Destroyer" className="w-35 h-35 object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-widest mb-3">BATTLE</h2>
                    <h2 className="text-4xl font-black text-red-500 tracking-widest mb-6">DESTROYER</h2>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                        The ultimate attack platform. Login to access your dashboard and launch operations.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        {[
                            { icon: FaGem, text: 'Credits System' },
                            { icon: FaLink, text: 'Referrals' },
                            { icon: FaBolt, text: 'Attack Hub' },
                        ].map((f, i) => (
                            <span key={i} className="bg-gray-800/50 border border-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <f.icon size={14} /> {f.text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative">

                <button onClick={toggleTheme}
                    className={`absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        }`}>
                    {dark ? '☀️' : '🌙'}
                </button>

                <div className="w-full max-w-sm">

                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-25 h-25">
                            <img src="/logo512.png" alt="Battle Destroyer" className="w-20 h-20 object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-red-500 tracking-widest">BATTLE-DESTROYER</h1>
                    </div>

                    <h2 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
                    <p className={`text-sm mb-7 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Login to your warrior account</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                            <span>⚠️</span>{error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                            <input
                                name="email" type="email" value={form.email} onChange={handle} required
                                placeholder="you@example.com"
                                className={`w-full rounded-xl px-4 py-3 text-sm border focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition ${dark ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-600'
                                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                                    }`}
                            />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                            <PasswordInput name="password" value={form.password} onChange={handle} theme={theme} placeholder="Enter your password" />
                        </div>

                        <div>
                            {/* FIX: pass ref so resetCaptcha() can call widget.reset(widgetId) */}
                            <TurnstileWidget
                                ref={turnstileRef}
                                onVerify={handleVerify}
                                onExpire={resetCaptcha}
                                onError={resetCaptcha}
                            />

                            {!captchaReady ? (
                                <p className="text-yellow-500 text-xs mt-1.5">
                                    ⏳ Complete the CAPTCHA to enable login
                                </p>
                            ) : (
                                <div className="mt-1.5">
                                    <p className="text-green-500 text-xs mb-1">✅ CAPTCHA verified — submit within 4.5 min</p>
                                    <div className={`w-full h-1 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div
                                            className="h-1 rounded-full bg-green-500 transition-all duration-1000"
                                            style={{ width: `${100 - tokenAgePercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !captchaReady}
                            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</>
                            ) : (
                                <><FaCrosshairs size={16} /> Login</>
                            )}
                        </button>
                    </form>

                    <p className={`text-sm text-center mt-6 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        No account?{' '}
                        <Link to="/signup" className="text-red-400 hover:text-red-300 font-semibold">Sign up free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}