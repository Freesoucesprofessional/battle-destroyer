import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
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
import HCaptchaWidget from '../components/HCaptchaWidget'; // Changed to hCaptcha
import PasswordInput from '../components/PasswordInput';
import AnimatedBackground from '../components/AnimatedBackground';

// Add encryption key (should match backend)
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

export default function Login({ toggleTheme, theme, setIsAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [captchaReady, setCaptchaReady] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Stores captcha data from HCaptchaWidget
  const captchaDataRef = useRef(null);
  const captchaRef = useRef(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const dark = theme !== 'light';

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const resetCaptcha = useCallback(() => {
    captchaDataRef.current = null;
    setCaptchaReady(false);
    captchaRef.current?.reset();
  }, []);

  // Function to encrypt data before sending
  const encryptData = (data) => {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  };

  // Function to create SHA256 hash for integrity
  const createHash = (data) => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString + ENCRYPTION_KEY).toString();
  };

  // Function to decrypt response from server
  const decryptResponse = (encryptedData, hash) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Decryption failed');
      const parsed = JSON.parse(decrypted);

      // Verify hash of decrypted data
      const calculatedHash = CryptoJS.SHA256(JSON.stringify(parsed) + ENCRYPTION_KEY).toString();
      if (calculatedHash !== hash) {
        throw new Error('Response hash verification failed');
      }

      return parsed;
    } catch (error) {
      console.error('Response decryption error:', error);
      throw new Error('Failed to decrypt response');
    }
  };

  // Called by HCaptchaWidget once captcha is solved
  const handleVerify = useCallback((captchaData) => {
    // captchaData contains { token, ekey, timestamp }
    captchaDataRef.current = captchaData;
    setCaptchaReady(true);
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError('');

    if (!captchaDataRef.current) return setError('Please complete the human check.');

    setLoading(true);
    try {
      const requestData = {
        email: form.email,
        password: form.password,
        captchaData: captchaDataRef.current, // Send the captcha data object
        hp: '',
        timestamp: Date.now(),
      };

      const dataHash = createHash(requestData);
      const encryptedPayload = encryptData(requestData);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        encrypted: encryptedPayload,
        hash: dataHash,
        clientVersion: '1.0.0',
      });

      // Check if response is encrypted
      if (!response.data.encrypted || !response.data.hash) {
        throw new Error('Invalid response format');
      }

      // Decrypt the response
      const decryptedResponse = decryptResponse(response.data.encrypted, response.data.hash);

      if (!decryptedResponse.success) {
        throw new Error(decryptedResponse.message);
      }

      localStorage.setItem('token', decryptedResponse.token);
      localStorage.setItem('user', JSON.stringify(decryptedResponse.user));
      setIsAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${dark
    ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
    }`;

  return (
    <div className={`relative min-h-screen flex transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
      <AnimatedBackground intensity={0.6} />
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden z-10">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(8,8,15,0.95) 60%, rgba(4,4,10,1) 100%)' }}
        />
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
              <div className="absolute inset-0 rounded-3xl blur-2xl" style={{ background: 'rgba(220,38,38,0.2)' }} />
              <img src="/logo512.png" alt="Battle Destroyer" className="relative w-52 h-52 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white tracking-[0.15em] mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
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
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'
            }`}
        >
          {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo512.png" alt="Battle Destroyer" className="w-16 h-16 object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-red-500 tracking-[0.12em]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              BATTLE-DESTROYER
            </h1>
          </div>

          <h2
            className={`text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}
          >
            Welcome back
          </h2>
          <p className={`text-sm mb-7 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Login to your warrior account
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <FaExclamationCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* ── Honeypot — hidden from real users, bots fill it ── */}
            <input
              name="hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ display: 'none' }}
            />

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

            {/* ── HCAPTCHA SECTION ── */}
            <div>
              <label className={`bd-label flex items-center gap-1.5 mb-1.5 ${dark ? '' : 'text-slate-500'}`}>
                <FaShieldAlt size={10} className="text-red-500/70" />
                Human Verification
              </label>

              <HCaptchaWidget
                ref={captchaRef}
                onVerify={handleVerify}
                onExpire={resetCaptcha}
                onError={resetCaptcha}
                theme={theme}
              />
            </div>

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