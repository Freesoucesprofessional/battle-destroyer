import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { FaCrosshairs, FaGift, FaLink, FaLock, FaShieldAlt } from 'react-icons/fa';
import TurnstileWidget from '../components/TurnstileWidget';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';

const TOKEN_MAX_AGE_MS = 270_000; // 270s — safe window before Cloudflare's 300s expiry

export default function Signup({ toggleTheme, theme }) {
    const [form, setForm]         = useState({ username: '', email: '', password: '', referralCode: '' });
    const [captchaReady, setCaptchaReady] = useState(false);
    const [fingerprint, setFingerprint]   = useState('');
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [loading, setLoading]   = useState(false);

    // Ref-based token storage — avoids stale closure in submit handler
    const captchaTokenRef  = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef   = useRef(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const API_URL  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // ─── Init fingerprint + referral code ────────────────────────────────────
    useEffect(() => {
        FingerprintJS.load()
            .then(fp => fp.get())
            .then(r => setFingerprint(r.visitorId));

        const ref = searchParams.get('ref');
        if (ref) setForm(f => ({ ...f, referralCode: ref }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup timer on unmount
    useEffect(() => () => clearTimeout(expiryTimerRef.current), []);

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    // ─── CAPTCHA helpers ──────────────────────────────────────────────────────
    const resetCaptcha = useCallback(() => {
        captchaTokenRef.current  = '';
        captchaIssuedRef.current = null;
        setCaptchaReady(false);
        clearTimeout(expiryTimerRef.current);
        if (window.turnstile) window.turnstile.reset();
    }, []);

    const handleVerify = useCallback((token) => {
        captchaTokenRef.current  = token;
        captchaIssuedRef.current = Date.now();
        setCaptchaReady(true);

        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(resetCaptcha, TOKEN_MAX_AGE_MS);
    }, [resetCaptcha]);

    // ─── Submit ───────────────────────────────────────────────────────────────
    const submit = async e => {
        e.preventDefault();
        setError(''); setSuccess('');

        const token    = captchaTokenRef.current;
        const issuedAt = captchaIssuedRef.current;

        if (!token) return setError('Please complete the CAPTCHA.');
        if (!issuedAt || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) {
            resetCaptcha();
            return setError('CAPTCHA expired. Please solve it again.');
        }
        if (!fingerprint) return setError('Fingerprint not ready, please wait a moment.');

        setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
                ...form,
                captchaToken: token,
                fingerprint,
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setSuccess(data.message || 'Account created! Redirecting…');
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
            // Always reset on failure — token is consumed (even on server error).
            resetCaptcha();
        }
        setLoading(false);
    };

    const dark = theme === 'dark';
    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition ${
        dark ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-600'
             : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
    }`;

    const features = [
        { icon: FaGift,     text: '3 free credits on signup' },
        { icon: FaLink,     text: '+2 credits per referral' },
        { icon: FaLock,     text: 'Device fingerprint protection' },
        { icon: FaShieldAlt, text: 'Access to Attack Hub' },
    ];

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>

            {/* Left panel */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-gray-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900 to-gray-950" />
                <div className="absolute top-1/3 left-1/3 w-56 h-56 bg-red-600/10 rounded-full blur-3xl" />
                <div className="relative text-center px-10">
                    <div className="text-7xl mb-5 flex justify-center">
                        <FaCrosshairs className="text-red-500" size={80} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-widest mb-2">BATTLE</h2>
                    <h2 className="text-3xl font-black text-red-500 tracking-widest mb-5">DESTROYER</h2>
                    <div className="space-y-3 text-left">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-gray-800/40 rounded-xl px-4 py-2.5">
                                <f.icon className="text-lg text-red-500" />
                                <span className="text-gray-300 text-sm">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative overflow-y-auto">
                <button onClick={toggleTheme}
                    className={`absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
                        dark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}>
                    {dark ? '☀️' : '🌙'}
                </button>

                <div className="w-full max-w-sm py-4">
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/20 border border-red-600/30 mb-3">
                            <FaCrosshairs className="text-red-500" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-red-500 tracking-widest">BATTLE-DESTROYER</h1>
                    </div>

                    <h2 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Create account</h2>
                    <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Join the battle — free to start</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
                            <span>⚠️</span>{error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/40 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
                            <span>✅</span>{success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                            <input name="username" value={form.username} onChange={handle} required placeholder="WarriorXX (3–20 chars)" className={inputCls} />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                            <input name="email" type="email" value={form.email} onChange={handle} required placeholder="you@example.com" className={inputCls} />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                            <PasswordInput name="password" value={form.password} onChange={handle} theme={theme} placeholder="Min 8 chars, uppercase, number, special" />
                            <PasswordStrength password={form.password} theme={theme} />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wide mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Referral Code <span className={`normal-case font-normal ${dark ? 'text-gray-500' : 'text-gray-400'}`}>(optional — get +bonus)</span>
                            </label>
                            <input name="referralCode" value={form.referralCode} onChange={handle} placeholder="Enter referral code" className={inputCls} />
                        </div>

                        <div>
                            <TurnstileWidget onVerify={handleVerify} onExpire={resetCaptcha} onError={resetCaptcha} />
                            {!captchaReady && (
                                <p className="text-yellow-500 text-xs mt-1.5">⏳ Complete the CAPTCHA to enable signup</p>
                            )}
                        </div>

                        <button type="submit" disabled={loading || !captchaReady}
                            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 flex items-center justify-center gap-2">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                            ) : (
                                <><FaCrosshairs size={16} /> Create Account</>
                            )}
                        </button>
                    </form>

                    <p className={`text-sm text-center mt-5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Already have an account?{' '}
                        <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}