import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaBullseye,
    FaGem,
    FaCalendarAlt,
    FaBolt,
    FaShieldAlt,
    FaCrown,
    FaArrowRight,
    FaLock,
    FaServer,
    FaChartLine,
    FaUsers,
} from 'react-icons/fa';
import { MdSecurity, MdSpeed } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../utils/apiClient';

gsap.registerPlugin(ScrollTrigger);

/* ─── FEATURE DATA ─────────────────────────────── */
const FEATURES = [
    {
        icon: FaBolt,
        color: 'text-yellow-400',
        bg: 'from-yellow-600/10 to-yellow-600/5',
        border: 'border-yellow-600/20',
        title: 'Instant Launch',
        desc: 'Configure IP, port, and duration — deploy with a single click. Real-time countdown tracking included.',
    },
    {
        icon: FaCrown,
        color: 'text-red-400',
        bg: 'from-red-600/10 to-red-600/5',
        border: 'border-red-600/20',
        title: 'Pro Subscription',
        desc: 'Choose Weekly, Monthly, or Season Pro plans. Get 30 attacks/day with 300s max duration.',
    },
    {
        icon: FaShieldAlt,
        color: 'text-blue-400',
        bg: 'from-blue-600/10 to-blue-600/5',
        border: 'border-blue-600/20',
        title: 'CAPTCHA Protected',
        desc: 'Every action secured by advanced PoW + Math CAPTCHA. Device fingerprinting prevents abuse and ensures fair usage.',
    },
    {
        icon: FaChartLine,
        color: 'text-green-400',
        bg: 'from-green-600/10 to-green-600/5',
        border: 'border-green-600/20',
        title: 'Live Monitoring',
        desc: 'Track your active attack with a real-time progress bar and countdown. Full history with timestamps.',
    },
    {
        icon: FaUsers,
        color: 'text-purple-400',
        bg: 'from-purple-600/10 to-purple-600/5',
        border: 'border-purple-600/20',
        title: 'Reseller Program',
        desc: 'Become a reseller — buy credits in bulk and distribute Pro plans to customers for 4×+ profit.',
    },
    {
        icon: FaCalendarAlt,
        color: 'text-orange-400',
        bg: 'from-orange-600/10 to-orange-600/5',
        border: 'border-orange-600/20',
        title: 'Flexible Plans',
        desc: 'Weekly (₹850), Monthly (₹1800), or Season (₹2500) — pick what suits you and upgrade anytime.',
    },
];

/* ─── HOW IT WORKS ─────────────────────────────── */
const STEPS = [
    {
        number: '01',
        icon: FaLock,
        title: 'Create Account',
        desc: 'Sign up in seconds and log in to the panel.',
    },
    {
        number: '02',
        icon: FaCrown,
        title: 'Get Pro Plan',
        desc: 'Choose a plan (Weekly/Monthly/Season) and upgrade instantly via payment gateway.',
    },
    {
        number: '03',
        icon: FaBullseye,
        title: 'Launch Attack',
        desc: 'Enter target IP, port, duration. Pass CAPTCHA and fire — up to 30 attacks/day, 300s max.',
    },
];

/* ─── COMPONENT ─────────────────────────────────── */
export default function Home({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!(localStorage.getItem('token') && user.username);

    const [liveStats, setLiveStats] = useState({ totalAttacks: 0, totalUsers: 0 });

    const heroRef     = useRef(null);
    const statsRef    = useRef(null);
    const featuresRef = useRef(null);
    const stepsRef    = useRef(null);
    const ctaRef      = useRef(null);

    const STATS = [
        { value: '99.9%',                              label: 'Uptime',           icon: FaServer  },
        { value: liveStats.totalUsers.toLocaleString(), label: 'Active Users',    icon: FaUsers   },
        { value: liveStats.totalAttacks.toLocaleString(), label: 'Attacks Launched', icon: FaBullseye },
        { value: '<10ms',                              label: 'Response Time',    icon: MdSpeed   },
    ];

    /* ── Fetch stats ── */
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/panel/stats');
                setLiveStats(res.data);
            } catch {
                setLiveStats({ totalAttacks: 0, totalUsers: 0 });
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    /* ── GSAP ── */
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (heroRef.current) {
                const els = heroRef.current.querySelectorAll('.reveal-up');
                gsap.fromTo(
                    Array.from(els),
                    { opacity: 0, y: -28 },
                    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.13, delay: 0.1 }
                );
            }

            statsRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, scale: 0.8, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)', delay: i * 0.07,
                      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }
                );
            });

            featuresRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                const isHeading = el.closest('.text-center');
                gsap.fromTo(
                    el,
                    { opacity: 0, y: isHeading ? 30 : 70, x: isHeading ? 0 : (i % 2 === 0 ? -40 : 40), scale: isHeading ? 1 : 0.88 },
                    { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.55, ease: 'power3.out',
                      delay: isHeading ? 0 : (i % 3) * 0.07,
                      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            });

            stepsRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 60, scale: 0.9 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', delay: i * 0.09,
                      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }
                );
            });

            if (ctaRef.current) {
                gsap.fromTo(
                    ctaRef.current.querySelector('.reveal-up') ?? ctaRef.current,
                    { opacity: 0, scale: 0.93, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out',
                      scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
                const innerEls = ctaRef.current.querySelectorAll('.reveal-up');
                if (innerEls.length > 1) {
                    gsap.fromTo(
                        Array.from(innerEls),
                        { opacity: 0, y: 25 },
                        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.15,
                          scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } }
                    );
                }
            }
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <AnimatedBackground intensity={0.8} />
            <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none z-0" />

            {/* ── TOP BAR ── */}
            <header className={`relative z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="Battle Destroyer" className="relative w-8 h-8 rounded-xl object-contain"
                                 style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <span className="text-red-500 tracking-[0.15em] font-bold text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            BATTLE-DESTROYER
                        </span>
                    </div>

                    {/* Center Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {isLoggedIn ? (
                            <>
                                {[
                                    { to: '/dashboard', icon: FaBolt,     label: 'Dashboard' },
                                    { to: '/attack',    icon: FaBullseye, label: 'Attack'    },
                                    { to: '/pricing',   icon: FaGem,      label: 'Pricing'   },
                                ].map(item => (
                                    <Link key={item.to} to={item.to}
                                          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}
                                          style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        <item.icon size={14} />
                                        <span className="relative">{item.label}</span>
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <Link to="/pricing"
                                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                <FaGem size={14} />
                                <span className="relative">Pricing</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                            {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                        </button>
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                  style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.35)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                <FaBolt size={13} /> DASHBOARD
                            </Link>
                        ) : (
                            <Link to="/login"
                                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08]' : 'bg-black/[0.04] hover:bg-black/[0.07] text-slate-600 hover:text-slate-900 border border-black/[0.08]'}`}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section ref={heroRef} className="relative z-10 pt-20 pb-24 px-4 sm:px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
                     style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.12) 0%, transparent 70%)' }} />
                <div className="max-w-4xl mx-auto">
                    <div className="reveal-up inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest"
                         style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.25)', color: '#f87171' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Platform Active — Pro Plans from ₹850
                    </div>

                    <h1 className="reveal-up font-display" style={{ lineHeight: 1.05 }}>
                        <span className="block text-5xl sm:text-7xl md:text-8xl font-bold tracking-[0.06em] mb-1"
                              style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            BATTLE
                        </span>
                        <span className="block text-5xl sm:text-7xl md:text-8xl font-bold tracking-[0.06em]"
                              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.4))' }}>
                            DESTROYER
                        </span>
                    </h1>

                    <p className={`reveal-up text-base sm:text-xl mt-6 max-w-xl mx-auto leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        The ultimate stress-testing panel. Plan-Based access, real-time attack monitoring, and a powerful referral system.
                    </p>

                    <div className="reveal-up flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                  className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 group"
                                  style={{ boxShadow: '0 6px 30px rgba(220,38,38,0.4)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                <FaBolt size={16} /> GO TO DASHBOARD
                                <FaArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link to="/login"
                                  className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 group"
                                  style={{ boxShadow: '0 6px 30px rgba(220,38,38,0.4)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                <FaLock size={15} /> LOGIN TO PANEL
                                <FaArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>

                    <div className="reveal-up flex flex-wrap items-center justify-center gap-4 mt-8">
                        {[
                            { icon: MdSecurity,  text: 'PoW + Math CAPTCHA'     },
                            { icon: FaShieldAlt, text: 'Device Fingerprinted'   },
                            { icon: FaGem,       text: 'Pro Plans from ₹850/week' },
                        ].map(({ icon: Icon, text }) => (
                            <span key={text} className={`flex items-center gap-1.5 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Icon className="text-red-500/60" size={12} /> {text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section ref={statsRef} className="relative z-10 py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className={`rounded-2xl p-6 sm:p-8 border grid grid-cols-2 sm:grid-cols-4 gap-6 ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-black/[0.02] border-black/[0.07]'}`}>
                        {STATS.map((stat, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center`}>
                                <stat.icon className="text-red-500/60 mx-auto mb-2" size={20} />
                                <p className="font-bold text-2xl sm:text-3xl"
                                   style={{ fontFamily: "'Rajdhani', sans-serif", background: 'linear-gradient(135deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    {stat.value}
                                </p>
                                <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section ref={featuresRef} className="relative z-10 py-16 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="reveal-up bd-section-tag mb-2">Capabilities</p>
                        <h2 className="reveal-up text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Everything You Need to <span className="text-gradient-red">Dominate</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <div key={i} className={`reveal-up delay-${(i % 3) + 1} group rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${dark ? `bg-gradient-to-br ${f.bg} border-white/[0.07] hover:border-white/[0.12]` : `bg-white border-black/[0.07] hover:border-black/[0.12] shadow-sm hover:shadow-md`}`}>
                                <div className={`w-10 h-10 rounded-xl border bg-gradient-to-br ${f.bg} ${f.border} flex items-center justify-center mb-4`}>
                                    <f.icon className={f.color} size={18} />
                                </div>
                                <h3 className={`font-bold text-base mb-2 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}>
                                    {f.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section ref={stepsRef} className="relative z-10 py-16 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="reveal-up bd-section-tag mb-2">Process</p>
                        <h2 className="reveal-up text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Up and Running in <span className="text-gradient-red">3 Steps</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                        <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-px"
                             style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.3), transparent)' }} />
                        {STEPS.map((step, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center group`}>
                                <div className="relative inline-block mb-5">
                                    <div className="w-16 h-16 rounded-2xl border-2 border-red-600/30 bg-red-600/10 flex items-center justify-center mx-auto group-hover:border-red-600/60 transition-all"
                                         style={{ boxShadow: '0 0 30px rgba(220,38,38,0.1)' }}>
                                        <step.icon className="text-red-400" size={22} />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center"
                                          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-lg mb-2 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
                                    {step.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section ref={ctaRef} className="relative z-10 py-20 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className={`reveal-up rounded-3xl p-10 sm:p-14 border relative overflow-hidden ${dark ? 'bg-gradient-to-br from-red-600/10 via-surface-800/80 to-surface-800/80 border-red-600/20' : 'bg-gradient-to-br from-red-50 via-white to-white border-red-100'}`}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
                             style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)' }} />
                        <p className="reveal-up bd-section-tag mb-3">Join Now</p>
                        <h2 className="reveal-up text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Ready to <span className="text-gradient-red">Destroy?</span>
                        </h2>
                        <p className={`reveal-up text-sm sm:text-base mb-8 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isLoggedIn ? 'Welcome back, warrior. Your dashboard awaits.' : 'Subscribe to Pro for unlimited attacks. Weekly, Monthly & Season plans available.'}
                        </p>
                        <div className="reveal-up flex flex-col sm:flex-row items-center justify-center gap-3">
                            {isLoggedIn ? (
                                <Link to="/dashboard"
                                      className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                      style={{ boxShadow: '0 6px 30px rgba(220,38,38,0.4)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                    <FaBolt size={15} /> OPEN DASHBOARD
                                </Link>
                            ) : (
                                <Link to="/login"
                                      className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                      style={{ boxShadow: '0 6px 30px rgba(220,38,38,0.4)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                    <FaBullseye size={15} /> LOGIN TO PANEL
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer theme={theme} />
        </div>
    );
}