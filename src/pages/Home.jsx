import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaBullseye,
    FaGem,
    FaBolt,
    FaShieldAlt,
    FaCrown,
    FaArrowRight,
    FaUsers,
    FaRobot,
    FaCode,
    FaStar,
    FaMedal,
    FaFire,
    FaHeadset,
} from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../utils/apiClient';

gsap.registerPlugin(ScrollTrigger);

/* ─── FEATURE DATA ── */
const FEATURES = [
    {
        icon: FaFire,
        color: 'text-orange-400',
        bg: 'from-orange-600/10 to-orange-600/5',
        border: 'border-orange-600/30',
        title: '#1 BGMI Stresser',
        desc: "India's most powerful BGMI DDoS platform. Trusted by top clans & esports teams. 10/10 success ratio guaranteed.",
    },
    {
        icon: FaRobot,
        color: 'text-cyan-400',
        bg: 'from-cyan-600/10 to-cyan-600/5',
        border: 'border-cyan-600/30',
        title: 'Custom Bot Creation',
        desc: 'Get your own private DDoS bot with personalized API. Full white-label solution for resellers.',
    },
    {
        icon: FaCrown,
        color: 'text-yellow-400',
        bg: 'from-yellow-600/10 to-yellow-600/5',
        border: 'border-yellow-600/30',
        title: 'Reseller Panel',
        desc: 'Buy credits in bulk (as low as ₹250/attack). Set your own prices. Earn 4x+ profit. Complete reseller panel included.',
    },
    {
        icon: FaCode,
        color: 'text-purple-400',
        bg: 'from-purple-600/10 to-purple-600/5',
        border: 'border-purple-600/30',
        title: 'API Access',
        desc: 'RESTful API for automated attacks. Integrate with your own bots, scripts, or tools. Rate limits: 300 req/min on Pro.',
    },
    {
        icon: FaHeadset,
        color: 'text-emerald-400',
        bg: 'from-emerald-600/10 to-emerald-600/5',
        border: 'border-emerald-600/30',
        title: '24/7 Support',
        desc: 'Dedicated support team. Instant ticket resolution and priority assistance for resellers.',
    },
    {
        icon: FaShieldAlt,
        color: 'text-rose-400',
        bg: 'from-rose-600/10 to-rose-600/5',
        border: 'border-rose-600/30',
        title: '10/10 Success Ratio',
        desc: 'Proprietary Layer 7 + Layer 4 hybrid methods. Bypass Cloudflare, AWS Shield, and all major protections.',
    },
];

/* ─── HOW IT WORKS ── */
const STEPS = [
    {
        number: '01',
        icon: FaGem,
        title: 'Get Pro / Reseller',
        desc: 'Choose Pro plan or become a reseller. Bulk credits from ₹2500 (100 attacks). API keys generated instantly.',
    },
    {
        number: '02',
        icon: FaCode,
        title: 'API & Bot Integration',
        desc: 'Use our API or request a custom bot. Full documentation provided.',
    },
    {
        number: '03',
        icon: FaBullseye,
        title: 'Deploy Attacks',
        desc: 'Use web panel, API, or your own bot. BGMI server stress testing with 10/10 success rate.',
    },
];

/* ─── CIRCULAR ANIMATED RED BORDER IMAGE ─── */
const CircleAnimatedImage = ({ src, alt = '', size = 120 }) => {
    return (
        <div
            style={{
                width: size,
                height: size,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                flexShrink: 0,
            }}
        >
            {/* Blur glow ring */}
            <div className="circle-ring circle-ring--blur" />
            {/* Sharp spinning ring */}
            <div className="circle-ring circle-ring--sharp" />
            {/* Image */}
            <img
                src={src}
                alt={alt}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '90%',
                    height: '90%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                }}
                onError={e => { e.target.style.display = 'none'; }}
            />
        </div>
    );
};

/* ─── MAIN COMPONENT ── */
export default function Home({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!(localStorage.getItem('token') && user.username);

    const [liveStats, setLiveStats] = useState({ totalAttacks: 0, totalUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    const heroRef     = useRef(null);
    const statsRef    = useRef(null);
    const featuresRef = useRef(null);
    const stepsRef    = useRef(null);
    const ctaRef      = useRef(null);
    const trustRef    = useRef(null);

    const STATS = [
        { value: '10/10', label: 'Success Ratio', icon: FaMedal },
        { value: liveStats.totalUsers.toLocaleString(), label: 'Trusted Users', icon: FaUsers },
        { value: liveStats.totalAttacks.toLocaleString(), label: 'Attacks Launched', icon: FaBullseye },
        { value: '24/7', label: 'Live Support', icon: FaHeadset },
    ];

    const TRUST_BADGES = [
        { icon: FaMedal, text: 'Verified Platform', color: 'text-red-400' },
        { icon: FaStar, text: '4.9/5 Rating', color: 'text-yellow-400' },
        { icon: FaFire, text: '#1 BGMI DDoS Panel India', color: 'text-orange-400' },
        { icon: FaShieldAlt, text: '10/10 Success Rate', color: 'text-emerald-400' },
    ];

    /* ── Fetch stats ── */
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/panel/stats');
                if (res.data) {
                    let attacks = 0;
                    let users = 0;
                    if (res.data.totalAttacks !== undefined) attacks = res.data.totalAttacks;
                    else if (res.data.attacks !== undefined) attacks = res.data.attacks;
                    else if (res.data.total_attacks !== undefined) attacks = res.data.total_attacks;
                    if (res.data.totalUsers !== undefined) users = res.data.totalUsers;
                    else if (res.data.users !== undefined) users = res.data.users;
                    else if (res.data.total_users !== undefined) users = res.data.total_users;
                    if (res.data.data) {
                        if (res.data.data.totalAttacks !== undefined) attacks = res.data.data.totalAttacks;
                        else if (res.data.data.attacks !== undefined) attacks = res.data.data.attacks;
                        if (res.data.data.totalUsers !== undefined) users = res.data.data.totalUsers;
                        else if (res.data.data.users !== undefined) users = res.data.data.users;
                    }
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        attacks = res.data[0].totalAttacks || res.data[0].attacks || 0;
                        users = res.data[0].totalUsers || res.data[0].users || 0;
                    }
                    setLiveStats({ totalAttacks: attacks || 1250000, totalUsers: users || 15000 });
                    setApiError(null);
                } else {
                    setLiveStats({ totalAttacks: 1250000, totalUsers: 15000 });
                }
            } catch (error) {
                setApiError(error.message);
                setLiveStats({ totalAttacks: 1250000, totalUsers: 15000 });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    /* ── GSAP Animations ── */
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (heroRef.current) {
                const els = heroRef.current.querySelectorAll('.reveal-up');
                gsap.fromTo(Array.from(els),
                    { opacity: 0, y: -28 },
                    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.13, delay: 0.1 }
                );
            }
            statsRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(el,
                    { opacity: 0, scale: 0.8, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)', delay: i * 0.07,
                      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }
                );
            });
            featuresRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                const isHeading = el.closest('.text-center');
                gsap.fromTo(el,
                    { opacity: 0, y: isHeading ? 30 : 70, x: isHeading ? 0 : (i % 2 === 0 ? -40 : 40), scale: isHeading ? 1 : 0.88 },
                    { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.55, ease: 'power3.out',
                      delay: isHeading ? 0 : (i % 3) * 0.07,
                      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            });
            stepsRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 60, scale: 0.9 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', delay: i * 0.09,
                      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }
                );
            });
            trustRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 40, rotationX: 15 },
                    { opacity: 1, y: 0, rotationX: 0, duration: 0.5, ease: 'back.out(1)',
                      delay: i * 0.08,
                      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } }
                );
            });
            if (ctaRef.current) {
                gsap.fromTo(
                    ctaRef.current.querySelector('.reveal-up') ?? ctaRef.current,
                    { opacity: 0, scale: 0.93, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out',
                      scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            }
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <AnimatedBackground intensity={0.8} />
            <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none z-0" />

            <style>{`
                @keyframes spin-slow {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                .animation-delay-150 { animation-delay: 1.5s; }

                .text-gradient-red {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent !important;
                }

                .bd-section-tag {
                    display: inline-block;
                    padding: 0.4rem 1.5rem;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    background: rgba(220, 38, 38, 0.1);
                    color: #f87171 !important;
                    border: 1px solid rgba(220, 38, 38, 0.2);
                }
                @media (max-width: 768px) {
                    .bd-section-tag { font-size: 0.7rem; padding: 0.3rem 1.2rem; }
                }

                .stat-value {
                    font-weight: 900;
                    font-size: 1.8rem;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                @media (min-width: 480px) { .stat-value { font-size: 2rem; } }
                @media (min-width: 640px) { .stat-value { font-size: 2.5rem; } }
                @media (min-width: 768px) { .stat-value { font-size: 3rem; } }

                @property --bd-angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                }
                @keyframes bd-spin {
                    from { --bd-angle: 0deg; }
                    to   { --bd-angle: 360deg; }
                }

                /* ── Circle rings ── */
                .circle-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: repeating-conic-gradient(
                        from var(--bd-angle),
                        #dc2626 0%,
                        #ef4444 2%,
                        transparent 0%,
                        transparent 5%,
                        #dc2626 50%
                    );
                    animation: bd-spin 3.5s linear infinite;
                    pointer-events: none;
                }
                .circle-ring--blur {
                    filter: blur(0.9rem);
                    opacity: 0.7;
                    z-index: 0;
                }
                .circle-ring--sharp {
                    z-index: 2;
                    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px));
                    mask: radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px));
                }
            `}</style>

            {/* ── TOP BAR ── */}
            <header className={`relative z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="Battle Destroyer"
                                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <span className="text-red-500 tracking-[0.15em] font-bold text-base sm:text-xl hidden xs:inline"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            BATTLE-DESTROYER
                        </span>
                        <span className="inline xs:hidden text-red-500 tracking-[0.1em] font-bold text-sm"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            BATTLE-DESTROYER
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {isLoggedIn ? (
                            <>
                                {[
                                    { to: '/dashboard', icon: FaBolt,     label: 'Dashboard' },
                                    { to: '/attack',    icon: FaBullseye, label: 'Attack'    },
                                    { to: '/reseller',  icon: FaGem,      label: 'Reseller'  },
                                ].map(item => (
                                    <Link key={item.to} to={item.to}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                                        <item.icon size={16} /><span>{item.label}</span>
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <>
                                <Link to="/reseller"
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                                    <FaGem size={16} /><span>Reseller</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={toggleTheme}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                            {dark ? <MdWbSunny size={16} /> : <MdNightlight size={16} />}
                        </button>
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                style={{ boxShadow: '0 2px 10px rgba(220,38,38,0.35)' }}>
                                <FaBolt size={14} /><span className="hidden xs:inline">DASHBOARD</span><span className="xs:hidden">DASH</span>
                            </Link>
                        ) : (
                            <Link to="/login"
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'bg-black/[0.04] hover:bg-black/[0.07]'}`}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section ref={heroRef} className="relative z-10 pt-12 sm:pt-28 pb-16 sm:pb-32 px-4 sm:px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.08) 50%, transparent 80%)' }} />

                <div className="max-w-5xl mx-auto flex flex-col items-center">

                    {/* ── Centered circle image ── */}
                    <div className="mb-6 sm:mb-10 flex items-center justify-center w-full">
                        <CircleAnimatedImage
                            src="/bgmi.png"
                            alt="BGMI"
                            size={140}
                        />
                    </div>

                    <div className="reveal-up inline-flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 rounded-full border mb-6 sm:mb-10 text-sm sm:text-base font-bold uppercase tracking-wider"
                        style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.1))', borderColor: 'rgba(220,38,38,0.4)' }}>
                        <FaFire className="text-red-500 animate-pulse text-sm sm:text-base" />
                        <span className="text-red-400 text-sm sm:text-base">#1 BGMI DDoS PLATFORM • INDIA'S BEST</span>
                        <FaFire className="text-red-500 animate-pulse text-sm sm:text-base" />
                    </div>

                    <h1 className="reveal-up" style={{ lineHeight: 1.1 }}>
                        <span className="block text-4xl sm:text-7xl md:text-8xl font-bold tracking-[0.04em] sm:tracking-[0.06em] mb-2 text-slate-200">
                            BATTLE
                        </span>
                        <span className="block text-5xl sm:text-8xl md:text-9xl font-bold tracking-[0.04em] sm:tracking-[0.06em] text-gradient-red"
                            style={{ filter: 'drop-shadow(0 0 20px rgba(220,38,38,0.4))' }}>
                            DESTROYER
                        </span>
                    </h1>

                    <p className={`reveal-up text-base sm:text-xl md:text-2xl mt-4 sm:mt-8 md:mt-10 max-w-2xl mx-auto leading-relaxed font-medium px-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                        India's most trusted BGMI DDoS platform.{' '}
                        <span className="text-red-500 font-bold">10/10 success ratio</span> • Reseller Panel • API • Custom bots • 24/7 support
                    </p>

                    <div className="reveal-up flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mt-6 sm:mt-10 md:mt-12 w-full sm:w-auto">
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                className="flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all active:scale-95 group w-full sm:w-auto justify-center"
                                style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}>
                                <FaBolt size={16} /> GO TO DASHBOARD
                                <FaArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login"
                                    className="flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all active:scale-95 group w-full sm:w-auto justify-center"
                                    style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}>
                                    <FaBullseye size={14} /> START ATTACK
                                    <FaArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/reseller"
                                    className={`flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-5 rounded-xl font-semibold text-base sm:text-lg transition-all w-full sm:w-auto justify-center ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1]' : 'bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.08]'}`}>
                                    <FaGem size={16} /> Become Reseller
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="reveal-up flex flex-wrap items-center justify-center gap-3 sm:gap-8 mt-6 sm:mt-10 md:mt-12">
                        {TRUST_BADGES.map((badge, idx) => (
                            <span key={idx} className={`flex items-center gap-1.5 text-sm sm:text-base font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <badge.icon className={badge.color} size={14} />
                                {badge.text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section ref={statsRef} className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className={`rounded-2xl p-5 sm:p-8 md:p-10 border grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8 ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-black/[0.02] border-black/[0.07]'}`}>
                        {STATS.map((stat, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center`}>
                                <stat.icon className="text-red-500/60 mx-auto mb-2" size={20} />
                                <p className="stat-value">{loading ? '...' : stat.value}</p>
                                <p className={`text-sm sm:text-base mt-2 uppercase tracking-wider font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                    {apiError && (
                        <p className="text-center text-sm text-red-400 mt-4">Using demo data. API Error: {apiError}</p>
                    )}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section ref={featuresRef} className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16">
                        <p className="reveal-up bd-section-tag mb-3">Why Choose Us</p>
                        <h2 className="reveal-up text-2xl sm:text-4xl md:text-6xl font-bold text-slate-800 dark:text-white">
                            India's <span className="text-gradient-red">#1 BGMI </span>DDoS Platform
                        </h2>
                        <p className={`reveal-up mt-3 sm:mt-5 text-base sm:text-lg ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Reseller program • API Access • Custom bots • 10/10 success
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                        {FEATURES.map((f, i) => (
                            <div key={i}
                                className={`reveal-up delay-${(i % 3) + 1} group rounded-xl sm:rounded-2xl p-5 sm:p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? `bg-gradient-to-br ${f.bg} border-white/[0.07] hover:border-white/[0.15]` : `bg-white border-black/[0.07] hover:border-black/[0.12] shadow-sm`}`}>
                                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border bg-gradient-to-br ${f.bg} ${f.border} flex items-center justify-center mb-4 sm:mb-6`}>
                                    <f.icon className={f.color} size={22} />
                                </div>
                                <h3 className={`font-bold text-lg sm:text-xl mb-2 sm:mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                                <p className={`text-sm sm:text-base leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section ref={stepsRef} className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-red-500/5 to-transparent">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16">
                        <p className="reveal-up bd-section-tag mb-3">Quick Start</p>
                        <h2 className="reveal-up text-2xl sm:text-4xl md:text-6xl font-bold text-slate-800 dark:text-white">
                            Get Started in <span className="text-gradient-red">3 Steps</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 relative">
                        <div className="hidden sm:block absolute top-14 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        {STEPS.map((step, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center group`}>
                                <div className="relative inline-block mb-4 sm:mb-6">
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 border-red-600/30 bg-red-600/10 flex items-center justify-center mx-auto group-hover:border-red-500/70 transition-all group-hover:scale-105"
                                        style={{ boxShadow: '0 0 20px rgba(220,38,38,0.1)' }}>
                                        <step.icon className="text-red-400" size={26} />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white text-sm sm:text-base font-black flex items-center justify-center shadow-lg">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-lg sm:text-2xl mb-2 sm:mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                                <p className={`text-sm sm:text-base leading-relaxed px-3 sm:px-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section ref={trustRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14">
                        <p className="reveal-up bd-section-tag mb-3">Trusted by Thousands</p>
                        <h2 className="reveal-up text-2xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
                            What Our <span className="text-gradient-red">Community</span> Says
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7">
                        {[
                            { name: 'Karan (BGMI Pro)', text: '10/10 success ratio. Took down opponents in seconds. Reseller program is amazing — made 40k in first week!', role: 'Reseller', rating: 5 },
                            { name: 'Clan Leader', text: 'API integration was smooth. Built my own Discord bot using their endpoints. #1 BGMI panel hands down.', role: 'API User', rating: 5 },
                            { name: 'Pro Member', text: 'Best investment for BGMI. Support is instant. Custom bot feature is OP. 10/10 success rate every time.', role: 'Pro Member', rating: 5 },
                        ].map((testimonial, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} rounded-xl sm:rounded-2xl p-5 sm:p-7 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-white border-black/[0.07] shadow-sm'}`}>
                                <div className="flex gap-1 mb-3">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <FaStar key={j} className="text-yellow-400 text-sm sm:text-base" />
                                    ))}
                                </div>
                                <p className={`text-sm sm:text-base italic mb-4 sm:mb-5 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>"{testimonial.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white text-sm sm:text-base font-bold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm sm:text-base font-bold">{testimonial.name}</p>
                                        <p className="text-xs sm:text-sm text-slate-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── RESELLER CTA ── */}
            <section ref={ctaRef} className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className={`reveal-up rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16 border relative overflow-hidden ${dark ? 'bg-gradient-to-br from-red-600/10 via-red-900/20 to-surface-800 border-red-600/30' : 'bg-gradient-to-br from-red-50 via-red-50 to-white border-red-200'}`}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(220,38,38,0.1) 50%, transparent 70%)' }} />
                        <FaFire className="absolute top-4 right-4 text-red-500/20 text-4xl sm:text-7xl" />

                        <div className="relative z-10 text-center">
                            <p className="bd-section-tag mb-3">Start Earning Today</p>
                            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 text-slate-800 dark:text-white">
                                Become a <span className="text-gradient-red">Reseller</span>
                            </h2>
                            <p className={`text-base sm:text-lg md:text-xl mb-5 sm:mb-7 max-w-xl mx-auto ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Buy credits in bulk (as low as ₹250/attack). Set your own prices. Complete panel + API access. Earn 4x profit instantly.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-6 sm:mb-9">
                                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${dark ? 'bg-white/10' : 'bg-black/5'}`}>
                                    <FaRobot className="text-red-400 text-sm" />
                                    <span className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400">Custom bot creation</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
                                {isLoggedIn ? (
                                    <Link to="/reseller"
                                        className="flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all w-full sm:w-auto justify-center"
                                        style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}>
                                        <FaGem size={16} /> RESELLER DASHBOARD
                                    </Link>
                                ) : (
                                    <Link to="/reseller-prices"
                                        className="flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all w-full sm:w-auto justify-center"
                                        style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}>
                                        <FaGem size={16} /> JOIN & START EARNING
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer theme={theme} />
        </div>
    );
}