import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    FaGem, FaTelegram, FaBolt, FaCrown, FaFire,
    FaRupeeSign, FaInfoCircle, FaChevronRight,
    FaUsers, FaShieldAlt, FaCheckCircle,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight, MdSpeed } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

const TELEGRAM_URL = 'https://t.me/BattleDestroyerDDOS_Bot';

const RESELLER_PACKAGES = [
    {
        credits: 3000,
        inr: 5000,
        inrLabel: '5K',
        usdt: '55$',
        label: 'Starter Reseller',
        icon: FaBolt,
        color: 'text-blue-400',
        bg: 'from-blue-600/10 to-blue-600/5',
        border: 'border-blue-600/20',
        glow: 'rgba(59,130,246,0.3)',
        popular: false,
        perCredit: (5000 / 3000).toFixed(2),
    },
    {
        credits: 7000,
        inr: 10000,
        inrLabel: '10K',
        usdt: '108$',
        label: 'Business Reseller',
        icon: FaFire,
        color: 'text-orange-400',
        bg: 'from-orange-600/10 to-orange-600/5',
        border: 'border-orange-600/20',
        glow: 'rgba(249,115,22,0.3)',
        popular: true,
        perCredit: (10000 / 7000).toFixed(2),
    },
    {
        credits: 15000,
        inr: 15000,
        inrLabel: '15K',
        usdt: '160$',
        label: 'Pro Reseller',
        icon: FaCrown,
        color: 'text-yellow-400',
        bg: 'from-yellow-600/10 to-yellow-600/5',
        border: 'border-yellow-600/20',
        glow: 'rgba(234,179,8,0.3)',
        popular: false,
        perCredit: (15000 / 15000).toFixed(2),
    },
    {
        credits: 35000,
        inr: 20000,
        inrLabel: '20K',
        usdt: '215$',
        label: 'Elite Reseller',
        icon: FaGem,
        color: 'text-purple-400',
        bg: 'from-purple-600/10 to-purple-600/5',
        border: 'border-purple-600/20',
        glow: 'rgba(168,85,247,0.3)',
        popular: false,
        perCredit: (20000 / 35000).toFixed(2),
    },
];

const CUSTOMER_PLANS = [
    { credits: 50,  label: 'Starter',  icon: FaBolt,  color: 'text-blue-400'   },
    { credits: 150, label: 'Basic',    icon: FaGem,   color: 'text-green-400'  },
    { credits: 250, label: 'Standard', icon: FaFire,  color: 'text-orange-400', popular: true },
    { credits: 333, label: 'Advanced', icon: FaFire,  color: 'text-red-400'    },
    { credits: 400, label: 'Pro',      icon: FaCrown, color: 'text-yellow-400' },
    { credits: 500, label: 'Elite',    icon: FaCrown, color: 'text-purple-400' },
];

const BENEFITS = [
    { icon: FaUsers,     title: 'Grow Your Network',    desc: 'Distribute credits to customers and build your own reseller business.' },
    { icon: FaShieldAlt, title: 'Secure Panel Access',  desc: 'Dedicated reseller portal with full audit logs and account management.' },
    { icon: MdSpeed,     title: 'Instant Distribution', desc: 'Give credits to customers instantly via the reseller panel.' },
    { icon: FaCheckCircle, title: 'Fixed Pricing',      desc: 'Sell at our fixed customer price list — no undercutting allowed.' },
];

export default function ResellerPrices({ toggleTheme, theme }) {
    const dark = theme !== 'light';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!(localStorage.getItem('token') && user.username);

    const headerRef  = useRef(null);
    const packagesRef = useRef(null);
    const plansRef   = useRef(null);
    const benefitsRef = useRef(null);
    const ctaRef     = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // Header
            if (headerRef.current) {
                gsap.fromTo(Array.from(headerRef.current.children),
                    { opacity: 0, y: -28 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12, delay: 0.1 }
                );
            }

            // Package cards — burst in
            const pkgCards = packagesRef.current?.querySelectorAll('.pkg-card') || [];
            const origins = [
                { x: -200, y: -80,  r: -15 },
                { x: 0,    y: -180, r: 8   },
                { x: 200,  y: -80,  r: 15  },
                { x: 0,    y: 160,  r: -8  },
            ];
            if (pkgCards.length) {
                gsap.set(pkgCards, { opacity: 0 });
                pkgCards.forEach((card, i) => {
                    const isMobile = window.innerWidth < 640;
                    const o = origins[i % origins.length];
                    gsap.fromTo(card,
                        { opacity: 0, x: isMobile ? 0 : o.x, y: isMobile ? 40 : o.y, rotation: isMobile ? 0 : o.r, scale: isMobile ? 0.85 : 0.6 },
                        {
                            opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
                            duration: isMobile ? 0.6 : 0.85,
                            ease: 'back.out(1.3)',
                            scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 50%', scrub: 0.8 },
                        }
                    );
                });
            }

            // Credit bars
            pkgCards.forEach(card => {
                const bar = card.querySelector('.pkg-bar');
                if (!bar) return;
                gsap.fromTo(bar,
                    { scaleX: 0, transformOrigin: 'left center' },
                    { scaleX: 1, duration: 0.9, ease: 'power2.out',
                      scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 55%', scrub: 1 } }
                );
            });

            // Popular badge pulse
            gsap.to('.popular-badge', {
                boxShadow: '0 4px 28px rgba(220,38,38,0.65)',
                repeat: -1, yoyo: true, duration: 1.4, ease: 'sine.inOut',
            });

            // Customer plans
            const planCards = plansRef.current?.querySelectorAll('.plan-card') || [];
            gsap.fromTo(planCards,
                { opacity: 0, y: 30, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.07,
                  scrollTrigger: { trigger: plansRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } }
            );

            // Benefits
            const benCards = benefitsRef.current?.querySelectorAll('.ben-card') || [];
            gsap.fromTo(benCards,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1,
                  scrollTrigger: { trigger: benefitsRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
            );

            // CTA
            if (ctaRef.current) {
                gsap.fromTo(ctaRef.current,
                    { opacity: 0, scale: 0.93, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out',
                      scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            }

            // Telegram button shimmer
            gsap.to('.tg-btn', {
                boxShadow: '0 8px 36px rgba(37,99,235,0.55)',
                repeat: -1, yoyo: true, duration: 1.8, ease: 'sine.inOut',
            });
        });

        return () => ctx.revert();
    }, []);

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`} style={{ overflowX: 'hidden' }}>
            <AnimatedBackground intensity={0.35} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">

                {/* ── Minimal Top Bar (no Navbar since this is semi-public) ── */}
                <header className={`sticky top-0 z-50 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                                <img src="/logo512.png" alt="" className="relative w-8 h-8 rounded-xl object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                            </div>
                            <span className="text-red-500 tracking-[0.15em] font-bold text-sm sm:text-base" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                BATTLE-DESTROYER
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            {isLoggedIn ? (
                                <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 flex items-center gap-2"
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                                    <FaBolt size={13} /> DASHBOARD
                                </Link>
                            ) : (
                                <Link to="/login" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08]' : 'bg-black/[0.04] hover:bg-black/[0.07] text-slate-600 hover:text-slate-900 border border-black/[0.08]'}`}>
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                    {/* ── Header ── */}
                    <div ref={headerRef} className="text-center mb-14">
                        <p className="bd-section-tag mb-2">Become a Reseller</p>
                        <h1 className={`text-3xl sm:text-5xl font-bold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
                            Reseller <span className="text-gradient-red">Packages</span>
                        </h1>
                        <p className={`text-sm max-w-lg mx-auto mb-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Buy credits in bulk at discounted rates and resell to your customers using our dedicated reseller panel. Fixed customer pricing protects your margins.
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                className="tg-btn inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors active:scale-95 text-sm"
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(37,99,235,0.35)' }}>
                                <FaTelegram size={16} /> CONTACT TO BECOME RESELLER <FaChevronRight size={11} />
                            </a>
                            <Link to="/reseller"
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 border ${dark ? 'bg-white/[0.05] border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.08]' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                RESELLER LOGIN
                            </Link>
                        </div>
                    </div>

                    {/* ── Reseller Packages ── */}
                    <div className="mb-6">
                        <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-6 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Wholesale Credit Packages
                        </p>
                    </div>
                    <div ref={packagesRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16">
                        {RESELLER_PACKAGES.map((pkg, i) => {
                            const Icon = pkg.icon;
                            return (
                                <div key={i}
                                    className={`pkg-card relative rounded-2xl border p-5 sm:p-6 flex flex-col transition-[border-color,box-shadow] hover:-translate-y-1 ${cardCls} ${pkg.popular ? dark ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-red-300 ring-1 ring-red-100' : ''}`}
                                    style={{ willChange: 'transform, opacity' }}>

                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="popular-badge bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5"
                                                style={{ fontFamily: "'Rajdhani', sans-serif", boxShadow: '0 4px 16px rgba(220,38,38,0.4)' }}>
                                                <FaFire size={10} /> BEST VALUE
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon + Label */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl border bg-gradient-to-br ${pkg.bg} ${pkg.border} flex items-center justify-center`}>
                                            <Icon className={pkg.color} size={17} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>{pkg.label}</p>
                                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Wholesale Pack</p>
                                        </div>
                                    </div>

                                    {/* Credits */}
                                    <div className="flex items-end gap-2 mb-1">
                                        <span className={`text-5xl font-black ${pkg.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {pkg.credits.toLocaleString()}
                                        </span>
                                        <span className={`text-sm mb-2.5 font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>credits</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className={`w-full h-1.5 rounded-full mb-5 overflow-hidden ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                                        <div className="pkg-bar h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                                            style={{ width: `${(pkg.credits / 35000) * 100}%` }} />
                                    </div>

                                    {/* Price box */}
                                    <div className={`rounded-xl px-4 py-3 mb-5 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Price (INR)</span>
                                            <span className={`text-2xl font-black flex items-center gap-0.5 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                <FaRupeeSign size={17} />{pkg.inrLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Price (USDT)</span>
                                            <span className={`text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{pkg.usdt}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                                            <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Per credit</span>
                                            <span className={`text-xs font-bold flex items-center gap-0.5 ${pkg.color}`}>
                                                <FaRupeeSign size={10} />{pkg.perCredit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                        className={`w-full py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-colors active:scale-95 mt-auto ${pkg.popular ? 'bg-red-600 hover:bg-red-500 text-white' : dark ? 'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: pkg.popular ? '0 4px 20px rgba(220,38,38,0.3)' : 'none' }}>
                                        <FaTelegram size={13} /> GET THIS PACK
                                    </a>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Customer Price List ── */}
                    <div className="mb-6 text-center">
                        <p className="bd-section-tag mb-2">Fixed Customer Pricing</p>
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Sell at These <span className="text-gradient-red">Fixed Rates</span>
                        </h2>
                        <p className={`text-xs max-w-md mx-auto ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            As a reseller you must sell at these fixed prices. Undercutting is not allowed.
                        </p>
                    </div>
                    <div ref={plansRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
                        {CUSTOMER_PLANS.map((plan, i) => {
                            const Icon = plan.icon;
                            return (
                                <div key={i} className={`plan-card relative rounded-xl border p-4 text-center transition-all hover:-translate-y-1 ${cardCls} ${plan.popular ? dark ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-red-300 ring-1 ring-red-100' : ''}`}>
                                    {plan.popular && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">HOT</span>
                                    )}
                                    <Icon className={`${plan.color} mx-auto mb-2`} size={18} />
                                    <p className={`font-black text-xl mb-0.5 ${plan.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{plan.credits}</p>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{plan.label}</p>
                                    <div className={`rounded-lg p-2 border ${dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>credits</p>
                                        <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>via reseller panel</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Benefits ── */}
                    <div ref={benefitsRef} className="mb-16">
                        <div className="text-center mb-8">
                            <p className="bd-section-tag mb-2">Why Resell?</p>
                            <h2 className={`text-2xl sm:text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                Reseller <span className="text-gradient-red">Benefits</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {BENEFITS.map((b, i) => {
                                const Icon = b.icon;
                                return (
                                    <div key={i} className={`ben-card rounded-2xl border p-5 transition-all hover:-translate-y-1 ${cardCls}`}>
                                        <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-4">
                                            <Icon className="text-red-500" size={17} />
                                        </div>
                                        <h3 className={`font-bold text-sm mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}>{b.title}</h3>
                                        <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{b.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── How it works ── */}
                    <div ref={ctaRef} className={`rounded-3xl border p-8 sm:p-12 mb-8 relative overflow-hidden ${dark ? 'bg-gradient-to-br from-red-600/10 via-surface-800/80 to-surface-800/80 border-red-600/20' : 'bg-gradient-to-br from-red-50 via-white to-white border-red-100'}`}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />

                        <div className="text-center mb-8">
                            <p className="bd-section-tag mb-2">How It Works</p>
                            <h2 className={`text-2xl sm:text-4xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                Start Reselling in <span className="text-gradient-red">3 Steps</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                            {[
                                { n: '01', icon: FaTelegram, title: 'Contact Admin', desc: 'Message us on Telegram and choose your reseller package.' },
                                { n: '02', icon: FaRupeeSign, title: 'Make Payment', desc: 'Pay via UPI or USDT. Credits added to your reseller account instantly.' },
                                { n: '03', icon: FaUsers, title: 'Distribute', desc: 'Log in to the reseller panel and give credits to your customers.' },
                            ].map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className="text-center">
                                        <div className="relative inline-block mb-4">
                                            <div className="w-14 h-14 rounded-2xl border-2 border-red-600/30 bg-red-600/10 flex items-center justify-center mx-auto">
                                                <Icon className="text-red-400" size={20} />
                                            </div>
                                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center"
                                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>{i + 1}</span>
                                        </div>
                                        <h3 className={`font-bold text-base mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>{step.title}</h3>
                                        <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95"
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 6px 30px rgba(37,99,235,0.4)' }}>
                                <FaTelegram size={16} /> CONTACT ON TELEGRAM
                            </a>
                            <Link to="/reseller"
                                className={`flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base transition-all active:scale-95 border ${dark ? 'bg-white/[0.05] border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.08]' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em' }}>
                                RESELLER PANEL LOGIN
                            </Link>
                        </div>
                    </div>

                    {/* Info note */}
                    <div className={`rounded-2xl border p-5 flex items-start gap-4 ${cardCls}`}>
                        <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <FaInfoCircle className="text-blue-400" size={15} />
                        </div>
                        <div>
                            <p className={`font-bold text-sm mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>IMPORTANT NOTES</p>
                            <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Reseller accounts are manually approved. Credits are non-refundable once distributed to customers. 
                                Resellers must sell at our fixed customer pricing — undercutting will result in account termination. 
                                Contact admin on Telegram for support.
                            </p>
                        </div>
                    </div>
                </div>

                <Footer theme={theme} />
            </div>
        </div>
    );
}