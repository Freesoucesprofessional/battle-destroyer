import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    FaGem, FaTelegram, FaBolt, FaCrown, FaFire,
    FaRupeeSign, FaInfoCircle, FaShoppingCart, FaChevronRight,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';

gsap.registerPlugin(ScrollTrigger);

const TELEGRAM_URL = 'https://t.me/BattleDestroyerDDOS_Bot';

const plans = [
    { credits: 50, price: 499, label: 'Starter', icon: FaBolt, color: 'text-blue-400', bg: 'from-blue-600/10 to-blue-600/5', border: 'border-blue-600/20', popular: false },
    { credits: 150, price: 999, label: 'Basic', icon: FaGem, color: 'text-green-400', bg: 'from-green-600/10 to-green-600/5', border: 'border-green-600/20', popular: false },
    { credits: 250, price: 1499, label: 'Standard', icon: FaFire, color: 'text-orange-400', bg: 'from-orange-600/10 to-orange-600/5', border: 'border-orange-600/20', popular: true },
    { credits: 333, price: 1999, label: 'Advanced', icon: FaFire, color: 'text-red-400', bg: 'from-red-600/10 to-red-600/5', border: 'border-red-600/20', popular: false },
    { credits: 400, price: 2499, label: 'Pro', icon: FaCrown, color: 'text-yellow-400', bg: 'from-yellow-600/10 to-yellow-600/5', border: 'border-yellow-600/20', popular: false },
    { credits: 500, price: 2999, label: 'Elite', icon: FaCrown, color: 'text-purple-400', bg: 'from-purple-600/10 to-purple-600/5', border: 'border-purple-600/20', popular: false },
];

export default function Contact({ toggleTheme, theme, setIsAuth }) {
    const dark = theme !== 'light';

    const headerRef = useRef(null);
    const gridRef = useRef(null);
    const infoRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // ── HEADER — stagger fade + slide down on mount ──
            const headerEls = headerRef.current ? Array.from(headerRef.current.children) : [];
            if (headerEls.length) {
                gsap.fromTo(headerEls,
                    { opacity: 0, y: -28 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                        stagger: 0.12,
                        delay: 0.1,
                    }
                );
            }

            // ── PLAN CARDS — burst in from random directions ──
            const cards = gridRef.current
                ? Array.from(gridRef.current.querySelectorAll('.plan-card'))
                : [];

            const burstOrigins = [
                { x: -220, y: -100, rotation: -18 },  // top-left
                { x: 0, y: -200, rotation: 8 },  // top-center
                { x: 220, y: -100, rotation: 20 },  // top-right
                { x: -260, y: 60, rotation: -14 },  // mid-left
                { x: 260, y: 60, rotation: 16 },  // mid-right
                { x: 0, y: 200, rotation: -8 },  // bottom-center
            ];

            if (cards.length) {
                // set all invisible before ScrollTrigger fires
                gsap.set(cards, { opacity: 0 });

                cards.forEach((card, i) => {
                    const origin = burstOrigins[i % burstOrigins.length];

                    gsap.fromTo(card,
                        {
                            opacity: 0,
                            x: origin.x,
                            y: origin.y,
                            rotation: origin.rotation,
                            scale: 0.55,
                        },
                        {
                            opacity: 1,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            scale: 1,
                            duration: 0.85,
                            ease: 'back.out(1.3)',
                            scrollTrigger: {
                                trigger: card,
                                start: 'top 88%',
                                end: 'top 50%',
                                scrub: 1.0,
                                toggleActions: 'play none none reverse',
                            },
                        }
                    );
                });
            }

            cards.forEach((card, i) => {
                // ── responsive burst distance based on screen width ──
                const isMobile = window.innerWidth < 640;
                const dist = isMobile ? 80 : 220;

                const burstOrigins = [
                    { x: -dist, y: -dist * 0.5, rotation: -18 },
                    { x: 0, y: -dist, rotation: 8 },
                    { x: dist, y: -dist * 0.5, rotation: 20 },
                    { x: -dist * 1.2, y: dist * 0.3, rotation: -14 },
                    { x: dist * 1.2, y: dist * 0.3, rotation: 16 },
                    { x: 0, y: dist, rotation: -8 },
                ];

                const origin = burstOrigins[i % burstOrigins.length];

                gsap.fromTo(card,
                    {
                        opacity: 0,
                        x: origin.x,
                        y: origin.y,
                        rotation: isMobile ? 0 : origin.rotation, // ← no rotation on mobile
                        scale: isMobile ? 0.75 : 0.55,             // ← less scale on mobile
                    },
                    {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scale: 1,
                        duration: isMobile ? 0.65 : 0.85,
                        ease: 'back.out(1.2)',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 88%',
                            end: 'top 50%',
                            scrub: 1.0,
                            toggleActions: 'play none none reverse',
                        },
                    }
                );
            });

            // ── CREDIT BARS — animate width on scroll, per card ──
            cards.forEach((card) => {
                const bar = card.querySelector('.credit-bar-fill');
                if (!bar) return;
                gsap.fromTo(bar,
                    { scaleX: 0, transformOrigin: 'left center' },
                    {
                        scaleX: 1,
                        duration: 0.9,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 88%',
                            end: 'top 55%',
                            scrub: 1.2,
                        },
                    }
                );
            });

            // ── POPULAR BADGE — continuous pulse ──
            gsap.to('.popular-badge', {
                boxShadow: '0 4px 28px rgba(220,38,38,0.65)',
                repeat: -1, yoyo: true,
                duration: 1.4,
                ease: 'sine.inOut',
            });

            // ── INFO CARD — slide up on scroll ──
            if (infoRef.current) {
                gsap.fromTo(infoRef.current,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.55,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: infoRef.current,
                            start: 'top 92%',
                            toggleActions: 'play none none reverse',
                        },
                    }
                );
            }

            // ── TELEGRAM BUTTON — continuous shimmer ──
            gsap.to('.tg-btn', {
                boxShadow: '0 8px 36px rgba(37,99,235,0.55)',
                repeat: -1, yoyo: true,
                duration: 1.8,
                ease: 'sine.inOut',
            });

        });

        return () => ctx.revert();
    }, []);

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}` } style={{ overflowX: 'hidden' }}>
            <AnimatedBackground intensity={0.35} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                    {/* ── Header ── */}
                    <div ref={headerRef} className="text-center mb-12">
                        {/* ✅ NO style={{ opacity: 0 }} — GSAP owns opacity */}
                        <p className="bd-section-tag mb-2">Pricing Plans</p>

                        <h1
                            className={`text-3xl sm:text-5xl font-bold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
                        >
                            Buy <span className="text-gradient-red">Credits</span>
                        </h1>

                        <p className={`text-sm max-w-md mx-auto mb-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Purchase credits to power your attacks. All payments handled securely via Telegram bot.
                        </p>
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tg-btn inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors active:scale-95 text-sm"
                            style={{
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '0.06em',
                                boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
                            }}
                        >
                            <FaTelegram size={16} />
                            CONTACT VIA TELEGRAM BOT
                            <FaChevronRight size={11} />
                        </a>
                    </div>

                    {/* ── Pricing Grid ── */}
                    <div
                        ref={gridRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8"
                    >
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                className={`plan-card relative rounded-2xl border p-5 sm:p-6 flex flex-col transition-[border-color,box-shadow] hover:-translate-y-1 hover:shadow-card-hover ${cardCls} ${plan.popular
                                    ? dark
                                        ? 'border-red-500/40 ring-1 ring-red-500/20'
                                        : 'border-red-300 ring-1 ring-red-100'
                                    : ''
                                    }`}
                                style={{ willChange: 'transform, opacity' }}
                            >
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span
                                            className="popular-badge bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5"
                                            style={{
                                                fontFamily: "'Rajdhani', sans-serif",
                                                boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
                                            }}
                                        >
                                            <FaFire size={10} />
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl border bg-gradient-to-br ${plan.bg} ${plan.border} flex items-center justify-center`}>
                                        <plan.icon className={plan.color} size={17} />
                                    </div>
                                    <div>
                                        <p
                                            className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}
                                        >
                                            {plan.label}
                                        </p>
                                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Credit Pack
                                        </p>
                                    </div>
                                </div>

                                {/* Credits count */}
                                <div className="flex items-end gap-2 mb-1">
                                    <span
                                        className={`text-5xl font-black ${plan.color}`}
                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                    >
                                        {plan.credits}
                                    </span>
                                    <span className={`text-sm mb-2.5 font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        credits
                                    </span>
                                </div>

                                {/* Animated credit bar */}
                                <div className={`w-full h-1.5 rounded-full mb-5 overflow-hidden ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                                    <div
                                        className="credit-bar-fill h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                                        style={{ width: `${(plan.credits / 500) * 100}%` }}
                                    />
                                </div>

                                {/* Price box */}
                                <div className={`rounded-xl px-4 py-3 mb-5 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Price
                                        </span>
                                        <span
                                            className={`text-2xl font-black flex items-center gap-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}
                                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                        >
                                            <FaRupeeSign size={17} />
                                            {plan.price}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            Per credit
                                        </span>
                                        <span className={`text-xs font-bold flex items-center gap-0.5 ${plan.color}`}>
                                            <FaRupeeSign size={10} />
                                            {(plan.price / plan.credits).toFixed(1)}/credit
                                        </span>
                                    </div>
                                </div>

                                {/* Buy button */}
                                <a
                                    href={TELEGRAM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-colors active:scale-95 mt-auto ${plan.popular
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : dark
                                            ? 'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white'
                                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                                        }`}
                                    style={{
                                        fontFamily: "'Rajdhani', sans-serif",
                                        letterSpacing: '0.06em',
                                        boxShadow: plan.popular ? '0 4px 20px rgba(220,38,38,0.3)' : 'none',
                                    }}
                                >
                                    <FaShoppingCart size={13} />
                                    BUY NOW
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* ── Info note ── */}
                    {/* ✅ NO style={{ opacity: 0 }} — GSAP owns it */}
                    <div
                        ref={infoRef}
                        className={`rounded-2xl border p-5 flex items-start gap-4 ${cardCls}`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <FaInfoCircle className="text-blue-400" size={15} />
                        </div>
                        <div>
                            <p
                                className={`font-bold text-sm mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}
                            >
                                HOW TO PURCHASE
                            </p>
                            <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Click{' '}
                                <span className="text-blue-400 font-semibold">Buy Now</span>{' '}
                                on any plan to open our Telegram bot. Send the plan name and complete
                                payment via UPI/bank transfer. Credits are added to your account within
                                minutes after confirmation.
                            </p>
                        </div>
                    </div>

                </div>

                <Footer theme={theme} />
            </div>
        </div>
    );
}