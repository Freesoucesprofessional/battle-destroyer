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
        title: 'Reseller Program',
        desc: 'Buy credits in bulk (as low as ₹250/attack). Set your own prices. Earn 4x+ profit. Complete reseller panel included.',
    },
    {
        icon: FaCode,
        color: 'text-purple-400',
        bg: 'from-purple-600/10 to-purple-600/5',
        border: 'border-purple-600/30',
        title: 'Public API Access',
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
        desc: 'Use our public API or request a custom bot. Full documentation provided.',
    },
    {
        number: '03',
        icon: FaBullseye,
        title: 'Deploy Attacks',
        desc: 'Use web panel, API, or your own bot. BGMI server stress testing with 10/10 success rate.',
    },
];

/* ─── CIRCULAR ANIMATED RED BORDER IMAGE ─── */
const CircleAnimatedImage = ({ src, alt = '', size = 280 }) => {
    return (
        <div
            className="circle-image-wrapper"
            style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
        >
            {/* Glow blur layer */}
            <div className="circle-ring circle-ring--blur" />
            {/* Sharp ring layer */}
            <div className="circle-ring circle-ring--sharp" />
            {/* Image */}
            <div
                className="circle-img"
                style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                aria-label={alt}
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
        { value: '10/10', label: 'Success Ratio', icon: FaMedal, gradient: 'from-red-400 to-red-600' },
        { value: liveStats.totalUsers.toLocaleString(), label: 'Trusted Users', icon: FaUsers, gradient: 'from-red-500 to-red-700' },
        { value: liveStats.totalAttacks.toLocaleString(), label: 'Attacks Launched', icon: FaBullseye, gradient: 'from-red-600 to-red-800' },
        { value: '24/7', label: 'Live Support', icon: FaHeadset, gradient: 'from-red-400 to-red-600' },
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

                    setLiveStats({
                        totalAttacks: attacks || 1250000,
                        totalUsers: users || 15000,
                    });
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
                    {
                        opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)', delay: i * 0.07,
                        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
                    }
                );
            });

            featuresRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                const isHeading = el.closest('.text-center');
                gsap.fromTo(
                    el,
                    { opacity: 0, y: isHeading ? 30 : 70, x: isHeading ? 0 : (i % 2 === 0 ? -40 : 40), scale: isHeading ? 1 : 0.88 },
                    {
                        opacity: 1, y: 0, x: 0, scale: 1, duration: 0.55, ease: 'power3.out',
                        delay: isHeading ? 0 : (i % 3) * 0.07,
                        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
                    }
                );
            });

            stepsRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 60, scale: 0.9 },
                    {
                        opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', delay: i * 0.09,
                        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
                    }
                );
            });

            trustRef.current?.querySelectorAll('.reveal-up').forEach((el, i) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 40, rotationX: 15 },
                    {
                        opacity: 1, y: 0, rotationX: 0, duration: 0.5, ease: 'back.out(1)',
                        delay: i * 0.08,
                        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' },
                    }
                );
            });

            if (ctaRef.current) {
                gsap.fromTo(
                    ctaRef.current.querySelector('.reveal-up') ?? ctaRef.current,
                    { opacity: 0, scale: 0.93, y: 40 },
                    {
                        opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out',
                        scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', toggleActions: 'play none none reverse' },
                    }
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
                /* ── Spin slow ── */
                @keyframes spin-slow {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                .animation-delay-150 { animation-delay: 1.5s; }

                /* ── Text gradient ── */
                .text-gradient-red {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent !important;
                }

                /* ── Section tag pill ── */
                .bd-section-tag {
                    display: inline-block;
                    padding: 0.25rem 1rem;
                    border-radius: 9999px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    background: rgba(220, 38, 38, 0.1);
                    color: #f87171 !important;
                    border: 1px solid rgba(220, 38, 38, 0.2);
                }

                /* ── Stat value ── */
                .stat-value {
                    font-weight: 900;
                    font-size: 1.5rem;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                @media (min-width: 640px)  { .stat-value { font-size: 1.875rem; } }
                @media (min-width: 768px)  { .stat-value { font-size: 2.25rem;  } }

                /* ── @property for conic angle ── */
                @property --bd-angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                }

                /* ── Conic spin keyframe ── */
                @keyframes bd-spin {
                    from { --bd-angle: 0deg; }
                    to   { --bd-angle: 360deg; }
                }

                /* ── Circle image wrapper ── */
                .circle-image-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Actual image circle (sits on top, z-index 1) */
                .circle-img {
                    position: relative;
                    z-index: 1;
                    width: 90%;
                    height: 90%;
                    border-radius: 50%;
                    overflow: hidden;
                }

                /* Shared ring styles */
                .circle-ring {
                    content: '';
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

                /* Blurred glow layer behind */
                .circle-ring--blur {
                    filter: blur(1rem);
                    opacity: 0.65;
                    z-index: 0;
                }

                /* Sharp visible ring */
                .circle-ring--sharp {
                    z-index: 2;
                    /* punch a hole so only the ring edge is visible */
                    -webkit-mask: radial-gradient(
                        farthest-side,
                        transparent calc(100% - 4px),
                        white calc(100% - 4px)
                    );
                    mask: radial-gradient(
                        farthest-side,
                        transparent calc(100% - 4px),
                        white calc(100% - 4px)
                    );
                }
            `}</style>

            {/* ── TOP BAR ── */}
            <header className={`relative z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="Battle Destroyer"
                                className="relative w-8 h-8 rounded-xl object-contain"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <span className="text-red-500 tracking-[0.15em] font-bold text-base hidden sm:inline"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            BATTLE-DESTROYER
                        </span>
                        <span className="inline sm:hidden text-red-500 tracking-[0.1em] font-bold text-xs"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            BATTLE-DESTROYER
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            #1 BGMI
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {isLoggedIn ? (
                            <>
                                {[
                                    { to: '/dashboard', icon: FaBolt,     label: 'Dashboard' },
                                    { to: '/attack',    icon: FaBullseye, label: 'Attack'    },
                                    { to: '/reseller',  icon: FaGem,      label: 'Reseller'  },
                                    { to: '/api-docs',  icon: FaCode,     label: 'API'       },
                                ].map(item => (
                                    <Link key={item.to} to={item.to}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                                        <item.icon size={14} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <>
                                <Link to="/reseller"
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                                    <FaGem size={14} /><span>Reseller</span>
                                </Link>
                                <Link to="/api-docs"
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                                    <FaCode size={14} /><span>API</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={toggleTheme}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                            {dark ? <MdWbSunny size={16} /> : <MdNightlight size={16} />}
                        </button>
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                                <FaBolt size={13} /> DASHBOARD
                            </Link>
                        ) : (
                            <Link to="/login"
                                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'bg-black/[0.04] hover:bg-black/[0.07]'}`}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section ref={heroRef} className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.08) 50%, transparent 80%)' }} />

                <div className="max-w-5xl mx-auto">
                    <div className="inline-block mb-6 sm:mb-8">
                        <CircleAnimatedImage
                            src="/bgmi.png"
                            alt="BGMI"
                            size={120}
                        />
                    </div>

                    <div className="reveal-up inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border mb-6 sm:mb-8 text-xs sm:text-sm font-bold uppercase tracking-wider"
                        style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.1))', borderColor: 'rgba(220,38,38,0.4)' }}>
                        <FaFire className="text-red-500 animate-pulse text-xs sm:text-sm" />
                        <span className="text-red-400 text-[10px] sm:text-sm">#1 BGMI DDoS PLATFORM • INDIA'S BEST</span>
                        <FaFire className="text-red-500 animate-pulse text-xs sm:text-sm" />
                    </div>

                    <h1 className="reveal-up" style={{ lineHeight: 1.1 }}>
                        <span className="block text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.06em] mb-1 sm:mb-2 text-slate-200">
                            BATTLE
                        </span>
                        <span className="block text-5xl sm:text-7xl md:text-8xl font-bold tracking-[0.06em] text-gradient-red"
                            style={{ filter: 'drop-shadow(0 0 40px rgba(220,38,38,0.5))' }}>
                            DESTROYER
                        </span>
                    </h1>

                    <p className={`reveal-up text-sm sm:text-base md:text-xl mt-4 sm:mt-6 md:mt-8 max-w-2xl mx-auto leading-relaxed font-medium px-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                        India's most trusted BGMI Ddos platform.{' '}
                        <span className="text-red-500 font-bold">10/10 success ratio</span> • Reseller Panel • API • Custom bots • 24/7 support
                    </p>

                    <div className="reveal-up flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-10">
                        {isLoggedIn ? (
                            <Link to="/dashboard"
                                className="flex items-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all active:scale-95 group w-full sm:w-auto justify-center"
                                style={{ boxShadow: '0 8px 30px rgba(220,38,38,0.5)' }}>
                                <FaBolt size={14} /> GO TO DASHBOARD
                                <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login"
                                    className="flex items-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all active:scale-95 group w-full sm:w-auto justify-center"
                                    style={{ boxShadow: '0 8px 30px rgba(220,38,38,0.5)' }}>
                                    <FaBullseye size={13} /> START ATTACK
                                    <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/reseller"
                                    className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all w-full sm:w-auto justify-center ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1]' : 'bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.08]'}`}>
                                    <FaGem size={14} /> Become Reseller
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="reveal-up flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 md:mt-10">
                        {TRUST_BADGES.map((badge, idx) => (
                            <span key={idx} className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <badge.icon className={badge.color} size={12} />
                                {badge.text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section ref={statsRef} className="relative z-10 py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className={`rounded-2xl p-4 sm:p-6 md:p-8 border grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-black/[0.02] border-black/[0.07]'}`}>
                        {STATS.map((stat, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center`}>
                                <stat.icon className="text-red-500/60 mx-auto mb-2" size={18} />
                                <p className="stat-value">{loading ? '...' : stat.value}</p>
                                <p className={`text-[10px] sm:text-xs mt-1 uppercase tracking-wider font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                    {apiError && (
                        <p className="text-center text-xs text-red-400 mt-4">
                            Using demo data. API Error: {apiError}
                        </p>
                    )}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section ref={featuresRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14">
                        <p className="reveal-up bd-section-tag mb-2">Why Choose Us</p>
                        <h2 className="reveal-up text-2xl sm:text-3xl md:text-5xl font-bold text-slate-800 dark:text-white">
                            India's <span className="text-gradient-red">#1 BGMI </span>DDoS Platform
                        </h2>
                        <p className={`reveal-up mt-3 sm:mt-4 text-sm sm:text-base ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Reseller program • Public API • Custom bots • 10/10 success
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {FEATURES.map((f, i) => (
                            <div key={i}
                                className={`reveal-up delay-${(i % 3) + 1} group rounded-2xl p-5 sm:p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? `bg-gradient-to-br ${f.bg} border-white/[0.07] hover:border-white/[0.15]` : `bg-white border-black/[0.07] hover:border-black/[0.12] shadow-sm`}`}>
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border bg-gradient-to-br ${f.bg} ${f.border} flex items-center justify-center mb-4 sm:mb-5`}>
                                    <f.icon className={f.color} size={20} />
                                </div>
                                <h3 className={`font-bold text-base sm:text-lg mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section ref={stepsRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent via-red-500/5 to-transparent">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14">
                        <p className="reveal-up bd-section-tag mb-2">Quick Start</p>
                        <h2 className="reveal-up text-2xl sm:text-3xl md:text-5xl font-bold text-slate-800 dark:text-white">
                            Get Started in <span className="text-gradient-red">3 Steps</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
                        <div className="hidden sm:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        {STEPS.map((step, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} text-center group`}>
                                <div className="relative inline-block mb-4 sm:mb-5">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-red-600/30 bg-red-600/10 flex items-center justify-center mx-auto group-hover:border-red-500/70 transition-all group-hover:scale-105"
                                        style={{ boxShadow: '0 0 30px rgba(220,38,38,0.15)' }}>
                                        <step.icon className="text-red-400" size={24} />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center shadow-lg">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-lg sm:text-xl mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                                <p className={`text-xs sm:text-sm leading-relaxed px-2 sm:px-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TRUST / TESTIMONIALS ── */}
            <section ref={trustRef} className="relative z-10 py-16 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12">
                        <p className="reveal-up bd-section-tag mb-2">Trusted by Thousands</p>
                        <h2 className="reveal-up text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                            What Our <span className="text-gradient-red">Community</span> Says
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        {[
                            { name: 'Karan (BGMI Pro)', text: '10/10 success ratio. Took down opponents in seconds. Reseller program is amazing — made 40k in first week!', role: 'Reseller', rating: 5 },
                            { name: 'Clan Leader', text: 'API integration was smooth. Built my own Discord bot using their endpoints. #1 BGMI panel hands down.', role: 'API User', rating: 5 },
                            { name: 'Pro Member', text: 'Best investment for BGMI. Support is instant. Custom bot feature is OP. 10/10 success rate every time.', role: 'Pro Member', rating: 5 },
                        ].map((testimonial, i) => (
                            <div key={i} className={`reveal-up delay-${i + 1} rounded-2xl p-5 sm:p-6 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-white border-black/[0.07] shadow-sm'}`}>
                                <div className="flex gap-1 mb-3">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <FaStar key={j} className="text-yellow-400 text-xs sm:text-sm" />
                                    ))}
                                </div>
                                <p className={`text-xs sm:text-sm italic mb-4 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>"{testimonial.text}"</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{testimonial.name}</p>
                                        <p className="text-[8px] sm:text-[10px] text-slate-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── RESELLER CTA ── */}
            <section ref={ctaRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className={`reveal-up rounded-3xl p-8 sm:p-10 md:p-14 border relative overflow-hidden ${dark ? 'bg-gradient-to-br from-red-600/10 via-red-900/20 to-surface-800 border-red-600/30' : 'bg-gradient-to-br from-red-50 via-red-50 to-white border-red-200'}`}>
                        {/* Background glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(220,38,38,0.1) 50%, transparent 70%)' }} />
                        <FaFire className="absolute top-4 right-4 text-red-500/20 text-4xl sm:text-6xl" />

                        {/* ── Content ── */}
                        <div className="relative z-10 text-center">
                            <p className="bd-section-tag mb-3">Start Earning Today</p>

                            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-white">
                                Become a <span className="text-gradient-red">Reseller</span>
                            </h2>

                            <p className={`text-sm sm:text-base md:text-lg mb-6 max-w-xl mx-auto ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Buy credits in bulk (as low as ₹250/attack). Set your own prices. Complete panel + API access. Earn 4x profit instantly.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                                <div className={`flex items-center gap-2 rounded-full px-2 sm:px-3 py-1 ${dark ? 'bg-white/10' : 'bg-black/5'}`}>
                                    <FaRobot className="text-red-400 text-xs" />
                                    <span className="text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400">Custom bot creation</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                                {isLoggedIn ? (
                                    <Link to="/reseller"
                                        className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all w-full sm:w-auto justify-center"
                                        style={{ boxShadow: '0 8px 25px rgba(220,38,38,0.4)' }}>
                                        <FaGem size={14} /> RESELLER DASHBOARD
                                    </Link>
                                ) : (
                                    <Link to="/reseller-prices"
                                        className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all w-full sm:w-auto justify-center"
                                        style={{ boxShadow: '0 8px 25px rgba(220,38,38,0.4)' }}>
                                        <FaGem size={14} /> JOIN & START EARNING
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