import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  FaBullseye,
  FaGift,
  FaLink,
  FaLock,
  FaShieldAlt,
  FaArrowRight,
  FaExclamationCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import HCaptchaWidget from '../components/HCaptchaWidget';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import AnimatedBackground from '../components/AnimatedBackground';

const FEATURES = [
  { icon: FaGift, text: '3 free credits on signup' },
  { icon: FaLink, text: '+2 credits per referral' },
  { icon: FaLock, text: 'Device fingerprint protection' },
  { icon: FaShieldAlt, text: 'Access to Attack Hub' },
];

// OTP Verification Component
function OTPVerification({ email, userId, onVerified, onBack, theme, onResendOTP }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const dark = theme !== 'light';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/complete-signup', {
        userId: userId,
        otp: otp,
      });

      const decryptedResponse = response.data;

      if (decryptedResponse.success) {
        localStorage.setItem('token', decryptedResponse.token);
        localStorage.setItem('user', JSON.stringify(decryptedResponse.user));
        onVerified(decryptedResponse);
      } else {
        setError(decryptedResponse.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/resend-verification', {
        userId: userId,
      });

      const decryptedResponse = response.data;

      if (decryptedResponse.success) {
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) clearInterval(timer);
            return prev - 1;
          });
        }, 1000);
        setError('');
      } else {
        setError(decryptedResponse.message || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition text-center text-2xl tracking-wider font-mono ${dark
    ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/60'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'
    }`;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <FaShieldAlt className="text-red-500" size={28} />
          </div>
        </div>
        <h3 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
          Verify Your Email
        </h3>
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          We sent a verification code to<br />
          <strong className="text-red-400">{email}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
            Enter 6-Digit Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className={inputCls}
            autoFocus
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              VERIFYING...
            </>
          ) : (
            <>
              <FaCheckCircle size={15} />
              VERIFY EMAIL
            </>
          )}
        </button>
      </form>

      <div className="text-center space-y-2">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
          className={`text-sm transition-colors disabled:opacity-50 ${dark ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-500'}`}
        >
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
        </button>

        <div>
          <button
            onClick={onBack}
            className={`text-sm transition-colors ${dark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'}`}
          >
            ← Back to signup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Signup({ toggleTheme, theme, setIsAuth }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', referralCode: '' });
  const [captchaReady, setCaptchaReady] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const captchaDataRef = useRef(null);
  const captchaRef = useRef(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dark = theme !== 'light';

  useEffect(() => {
    FingerprintJS.load().then(fp => fp.get()).then(r => setFingerprint(r.visitorId));
    const ref = searchParams.get('ref');
    if (ref) setForm(f => ({ ...f, referralCode: ref }));
  }, [searchParams]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const resetCaptcha = useCallback(() => {
    captchaDataRef.current = null;
    setCaptchaReady(false);
    captchaRef.current?.reset();
  }, []);

  const handleVerify = useCallback((captchaData) => {
    captchaDataRef.current = captchaData;
    setCaptchaReady(true);
  }, []);

  const handleOTPVerified = (userData) => {
    console.log('OTP verified, user data:', userData);

    if (userData.token) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));
      setIsAuth(true);

      setSuccess('Email verified! Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } else {
      setError('Something went wrong. Please try logging in manually.');
      setShowOTP(false);
    }
  };

  const handleBackToSignup = () => {
    setShowOTP(false);
    setPendingUserId('');
    setPendingEmail('');
    resetCaptcha();
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!captchaDataRef.current) {
      setError('Please complete the human check.');
      return;
    }

    if (!fingerprint) {
      setError('Fingerprint not ready, please wait a moment.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/signup', {
        username: form.username,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode,
        captchaData: captchaDataRef.current,
        fingerprint: fingerprint,
        hp: '',
      });

      const decryptedResponse = response.data;

      if (!decryptedResponse.success) {
        throw new Error(decryptedResponse.message);
      }

      // Check if OTP verification is required
      if (decryptedResponse.requiresOTP) {
        setPendingUserId(decryptedResponse.userId);
        setPendingEmail(form.email);
        setShowOTP(true);
        setSuccess('Verification code sent to your email! Please check your inbox.');
      } else {
        // Fallback for old flow
        localStorage.setItem('token', decryptedResponse.token);
        localStorage.setItem('user', JSON.stringify(decryptedResponse.user));
        setSuccess(decryptedResponse.message || 'Account created! Redirecting…');
        setIsAuth(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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

      <div className="hidden lg:flex lg:w-[42%] relative items-center justify-center overflow-hidden z-10">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(8,8,15,0.95) 60%, rgba(4,4,10,1) 100%)' }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)' }}
        />
        <div className="relative text-center px-10 z-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl" style={{ background: 'rgba(220,38,38,0.18)' }} />
              <img src="/logo512.png" alt="Battle Destroyer" className="relative w-44 h-44 object-contain" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-[0.15em] mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            BATTLE
          </h2>
          <h2
            className="text-4xl font-bold tracking-[0.15em] mb-6"
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
          <div className="space-y-2.5 text-left">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.06]">
                <f.icon className="text-red-400 shrink-0" size={14} />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10 overflow-y-auto">
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'
            }`}
        >
          {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
        </button>

        <div className="w-full max-w-sm py-4">
          <div className="lg:hidden text-center mb-6">
            <img src="/logo512.png" alt="Battle Destroyer" className="w-14 h-14 object-contain mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-red-500 tracking-[0.12em]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              BATTLE-DESTROYER
            </h1>
          </div>

          {!showOTP ? (
            <>
              <h2
                className={`text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}
              >
                Create account
              </h2>
              <p className={`text-sm mb-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Join the battle — free to start
              </p>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
                  <FaExclamationCircle size={15} className="shrink-0" />{error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">
                  <FaCheckCircle size={15} className="shrink-0" />{success}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <input
                  name="hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: 'none' }}
                />

                <div>
                  <label className="bd-label">Username</label>
                  <input name="username" value={form.username} onChange={handle} required placeholder="WarriorXX (3–20 chars)" className={inputCls} />
                </div>
                <div>
                  <label className="bd-label">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handle} required placeholder="you@example.com" className={inputCls} />
                </div>
                <div>
                  <label className="bd-label">Password</label>
                  <PasswordInput name="password" value={form.password} onChange={handle} theme={theme} placeholder="Min 8 chars, uppercase, number, special" />
                  <PasswordStrength password={form.password} theme={theme} />
                </div>
                <div>
                  <label className="bd-label">
                    Referral Code{' '}
                    <span className={`normal-case font-normal ${dark ? 'text-slate-500' : 'text-slate-400'}`}>(optional — get bonus)</span>
                  </label>
                  <input name="referralCode" value={form.referralCode} onChange={handle} placeholder="Enter referral code" className={inputCls} />
                </div>

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
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    <>
                      <FaBullseye size={15} />
                      CREATE ACCOUNT
                      <FaArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>

              <p className={`text-sm text-center mt-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Already have an account?{' '}
                <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">Login</Link>
              </p>
            </>
          ) : (
            <OTPVerification
              email={pendingEmail}
              userId={pendingUserId}
              onVerified={handleOTPVerified}
              onBack={handleBackToSignup}
              theme={theme}
            />
          )}
        </div>
      </div>
    </div>
  );
}