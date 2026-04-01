import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FaGem, FaUsers, FaCoins, FaKey, FaLink, FaGift,
  FaBullseye, FaCopy, FaCheck, FaExclamationTriangle,
  FaBolt,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';

gsap.registerPlugin(ScrollTrigger);

export default function Dashboard({ toggleTheme, theme, setIsAuth }) {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const navigate = useNavigate();
  const dark = theme !== 'light';
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const bannerRef = useRef(null);
  const statsRef = useRef(null);
  const referralRef = useRef(null);
  const howRef = useRef(null);
  const warningRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/panel/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      setUser(r.data);
      localStorage.setItem('user', JSON.stringify(r.data));
    }).catch(() => { localStorage.clear(); navigate('/login'); });
  }, [navigate, API_URL]);

  useEffect(() => {
    if (!user) return;
    const ctx = gsap.context(() => {

      // Welcome banner slides down from above
      gsap.fromTo(bannerRef.current,
        { opacity: 0, y: -40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
      );

      // Stat cards stagger pop up
      gsap.fromTo(
        statsRef.current?.querySelectorAll('.stat-card'),
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)', stagger: 0.1, delay: 0.3 }
      );

      // Referral card slides in from left
      gsap.fromTo(referralRef.current,
        { opacity: 0, x: -50 },
        {
          opacity: 1, x: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: referralRef.current, start: 'top 88%' }
        }
      );

      // How-it-works cards stagger up
      gsap.fromTo(
        howRef.current?.querySelectorAll('.how-card'),
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: howRef.current, start: 'top 85%' }
        }
      );

      // Warning banner scale in
      if (warningRef.current) {
        gsap.fromTo(warningRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out',
            scrollTrigger: { trigger: warningRef.current, start: 'top 90%' }
          }
        );
      }

      // Continuous glow pulse on launch button
      gsap.to('.launch-btn', {
        boxShadow: '0 6px 36px rgba(220,38,38,0.55)',
        repeat: -1, yoyo: true, duration: 1.6, ease: 'sine.inOut',
      });

    });
    return () => ctx.revert();
  }, [user]);

  const copyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${user.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(user.userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!user) return (
    <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
      <AnimatedBackground intensity={0.5} />
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading dashboard...</p>
      </div>
    </div>
  );

  const stats = [
    { icon: FaGem, label: 'Credits', value: user.credits, color: 'text-red-400', ring: 'ring-red-600/20', iconBg: 'bg-red-600/10 border-red-600/20' },
    { icon: FaUsers, label: 'Referrals', value: user.referralCount || 0, color: 'text-green-400', ring: 'ring-green-600/20', iconBg: 'bg-green-600/10 border-green-600/20' },
    { icon: FaCoins, label: 'Per Refer', value: '+2', color: 'text-yellow-400', ring: 'ring-yellow-600/20', iconBg: 'bg-yellow-600/10 border-yellow-600/20' },
    { icon: FaKey, label: 'User ID', value: user.userId, color: 'text-blue-400', ring: 'ring-blue-600/20', iconBg: 'bg-blue-600/10 border-blue-600/20', isId: true },
  ];

  const howItWorks = [
    { icon: FaGift, title: 'Signup Bonus', desc: 'Get 3 free credits when you create your account on a new device', color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
    { icon: FaLink, title: 'Refer Friends', desc: 'Share your referral link and earn +2 credits per successful signup', color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-600/20' },
    { icon: FaBullseye, title: 'Use Credits', desc: 'Spend credits to launch attacks from the Attack page', color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
  ];

  const cardCls = dark
    ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl shadow-card hover:border-red-600/20'
    : 'bg-white border-slate-200/80 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-red-200';

  const inputCls = dark
    ? 'bg-white/[0.04] border-white/[0.1] text-slate-300 font-mono'
    : 'bg-slate-50 border-slate-200 text-slate-600 font-mono';

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
      <AnimatedBackground intensity={0.4} />
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

      <div className="relative z-10">
        <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* ── Welcome Banner ── */}
          <div
            ref={bannerRef}
            className={`rounded-2xl p-5 sm:p-7 border mb-5 relative overflow-hidden transition-all ${cardCls}`}
            style={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-30 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }}
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.15em] mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Dashboard
                </p>
                <h1
                  className={`text-2xl sm:text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}
                >
                  Welcome, <span className="text-red-500">{user.username}</span>
                </h1>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
              </div>
              <Link
                to="/attack"
                className="launch-btn inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-95 text-sm self-start sm:self-auto"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(220,38,38,0.3)' }}
              >
                <FaBullseye size={15} />
                LAUNCH ATTACK
              </Link>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {stats.map((stat, i) => (
              <div
                key={i}
                onClick={stat.isId ? copyUserId : undefined}
                className={`stat-card rounded-2xl p-4 sm:p-5 border transition-all ${cardCls} ${stat.isId ? 'cursor-pointer' : ''}`}
                style={{ opacity: 0 }}
              >
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border mb-3 ${stat.iconBg}`}>
                  <stat.icon className={stat.color} size={15} />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {stat.label}
                </p>
                {stat.isId ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold text-sm font-mono truncate ${stat.color}`}>{user.userId}</p>
                    <button
                      onClick={e => { e.stopPropagation(); copyUserId(); }}
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${copiedId ? 'bg-green-600/20 border-green-500/40 text-green-400' : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                        }`}
                    >
                      {copiedId ? <FaCheck size={11} /> : <FaCopy size={11} />}
                    </button>
                  </div>
                ) : (
                  <p className={`font-black text-2xl sm:text-3xl ${stat.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {stat.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Referral Card ── */}
          <div ref={referralRef} className={`rounded-2xl p-5 sm:p-6 border mb-5 transition-all ${cardCls}`} style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center">
                <FaLink className="text-green-500" size={14} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your Referral Link</h3>
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Earn <span className="text-green-400 font-bold">+2 credits</span> for every successful referral
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className={`flex-1 rounded-xl px-4 py-3 text-xs font-mono truncate border ${inputCls}`}>
                {window.location.origin}/signup?ref={user.referralCode}
              </div>
              <button
                onClick={copyReferral}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${copied ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }}
              >
                {copied ? <><FaCheck size={13} /> COPIED!</> : <><FaCopy size={13} /> COPY LINK</>}
              </button>
            </div>
          </div>

          {/* ── How Credits Work ── */}
          <div ref={howRef} className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
            <div className="flex items-center gap-2.5 mb-4">
              <FaBolt className="text-yellow-500" size={15} />
              <h3
                className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
              >
                HOW CREDITS WORK
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {howItWorks.map((item, i) => (
                <div
                  key={i}
                  className={`how-card rounded-xl p-4 border transition-all ${dark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  style={{ opacity: 0 }}
                >
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${item.bg}`}>
                    <item.icon className={item.color} size={14} />
                  </div>
                  <p className={`font-bold text-sm mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {item.title}
                  </p>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── No credits warning ── */}
          {user.credits === 0 && (
            <div
              ref={warningRef}
              className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3 border"
              style={{ background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.2)', opacity: 0 }}
            >
              <FaExclamationTriangle className="text-yellow-500 mt-0.5 shrink-0" size={15} />
              <div>
                <p className="font-bold text-sm text-yellow-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  No Credits Available
                </p>
                <p className="text-yellow-500/70 text-xs mt-1">
                  This device was already used to claim free credits. Share your referral link to earn more!
                </p>
              </div>
            </div>
          )}
        </div>

        <Footer theme={theme} />
      </div>
    </div>
  );
}