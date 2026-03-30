import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaBullseye,
  FaGem,
  FaLink,
  FaBolt,
  FaArrowRight,
  FaShieldAlt,
  FaExclamationCircle,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import TurnstileWidget from '../components/TurnstileWidget';
import PasswordInput from '../components/PasswordInput';
import AnimatedBackground from '../components/AnimatedBackground';

const TOKEN_MAX_AGE_MS = 270_000;

export default function Login({ toggleTheme, theme, setIsAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [captchaReady, setCaptchaReady] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const captchaTokenRef = useRef('');
  const captchaIssuedRef = useRef(null);
  const expiryTimerRef = useRef(null);
  const turnstileRef = useRef(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const dark = theme !== 'light';

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
      setIsAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${
    dark
      ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
  }`;

  return (
    <div
      className={`relative min-h-screen flex transition-colors duration-300 ${
        dark ? 'bg-surface-950' : 'bg-slate-50'
      }`}
    >
      <AnimatedBackground intensity={0.6} />

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden z-10">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(8,8,15,0.95) 60%, rgba(4,4,10,1) 100%)',
          }}
        />
        {/* Decorative circles */}
        <div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)' }}
        />

        <div className="relative text-center px-12 z-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl blur-2xl"
                style={{ background: 'rgba(220,38,38,0.2)' }}
              />
              <img
                src="/logo512.png"
                alt="Battle Destroyer"
                className="relative w-52 h-52 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <h2
            className="text-5xl font-bold text-white tracking-[0.15em] mb-1"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            BATTLE
          </h2>
          <h2
            className="text-5xl font-bold tracking-[0.15em] mb-6"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            DESTROYER
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            The ultimate attack platform. Login to access your dashboard and launch operations.
          </p>

          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {[
              { icon: FaGem, text: 'Credits' },
              { icon: FaLink, text: 'Referrals' },
              { icon: FaBolt, text: 'Attack Hub' },
            ].map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400"
              >
                <f.icon className="text-red-500/70" size={12} /> {f.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'
          }`}
        >
          {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo512.png" alt="Battle Destroyer" className="w-16 h-16 object-contain mx-auto mb-3" />
            <h1
              className="text-2xl font-bold text-red-500 tracking-[0.12em]"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              BATTLE-DESTROYER
            </h1>
          </div>

          {/* Heading */}
          <h2
            className={`text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}
          >
            Welcome back
          </h2>
          <p className={`text-sm mb-7 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Login to your warrior account
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <FaExclamationCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={`bd-label ${dark ? '' : 'text-slate-500'}`}>Email</label>
              <input
                name="email" type="email" value={form.email} onChange={handle} required
                placeholder="you@example.com" className={inputCls}
              />
            </div>

            <div>
              <label className={`bd-label ${dark ? '' : 'text-slate-500'}`}>Password</label>
              <PasswordInput
                name="password" value={form.password} onChange={handle}
                theme={theme} placeholder="Enter your password"
              />
            </div>

            {/* CAPTCHA */}
            <div>
              <TurnstileWidget
                ref={turnstileRef}
                onVerify={handleVerify}
                onExpire={resetCaptcha}
                onError={resetCaptcha}
              />
              {!captchaReady ? (
                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <FaShieldAlt size={11} />
                  Complete the CAPTCHA to enable login
                </p>
              ) : (
                <p className="text-green-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <FaShieldAlt size={11} />
                  CAPTCHA verified
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !captchaReady}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: captchaReady ? '0 6px 24px rgba(220,38,38,0.35)' : 'none',
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.06em',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  LOGGING IN...
                </>
              ) : (
                <>
                  <FaBullseye size={15} />
                  LOGIN
                  <FaArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <p className={`text-sm text-center mt-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            No account?{' '}
            <Link to="/signup" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}