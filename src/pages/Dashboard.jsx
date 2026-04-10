import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    FaGem, FaUsers, FaKey, FaLink, FaGift,
    FaBullseye, FaCopy, FaCheck, FaExclamationTriangle,
    FaBolt, FaCrown, FaCalendarAlt, FaInfinity,
    FaStore, FaClock
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import api from '../utils/apiClient';

gsap.registerPlugin(ScrollTrigger);

export default function Dashboard({ toggleTheme, theme, setIsAuth }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const dark = theme !== 'light';
    
    // Refs for GSAP
    const bannerRef = useRef(null);
    const statsRef = useRef(null);
    const referralRef = useRef(null);
    const howRef = useRef(null);
    const warningRef = useRef(null);
    const animationsInitialized = useRef(false);

    /* ── fetch user ── */
    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        
        if (!token) { 
            window.location.href = '/login';
            return; 
        }
        
        try {
            const res = await api.get('/api/panel/me');
            
            if (res.data && res.data.username) {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
                setError(null);
            } else {
                throw new Error('Invalid user data');
            }
        } catch (err) {
            console.error('Fetch user error:', err);
            setError(err.message || 'Failed to load user data');
            
            if (err.response?.status === 401) {
                localStorage.clear();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    /* ── refresh every 60 seconds (reduced from 30s) ── */
    useEffect(() => {
        if (!user) return;
        
        const refresh = async () => {
            try {
                const res = await api.get('/api/panel/me');
                if (res.data && res.data.username) {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                }
            } catch (err) {
                console.error('Refresh error:', err);
            }
        };
        
        const id = setInterval(refresh, 60000); // Changed to 60 seconds
        return () => clearInterval(id);
    }, [user]);

    /* ── GSAP animations - runs only once ── */
    useEffect(() => {
        if (!user || loading || animationsInitialized.current) return;
        
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                // Banner animation
                if (bannerRef.current) {
                    gsap.fromTo(bannerRef.current, 
                        { opacity: 0, y: -30 }, 
                        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', overwrite: true }
                    );
                }
                
                // Stats cards animation
                const statCards = statsRef.current?.querySelectorAll('.stat-card');
                if (statCards?.length) {
                    gsap.fromTo(statCards,
                        { opacity: 0, y: 40, scale: 0.95 },
                        { 
                            opacity: 1, y: 0, scale: 1, 
                            duration: 0.4, ease: 'back.out(1.2)', 
                            stagger: 0.08,
                            overwrite: true
                        }
                    );
                }
                
                // Referral card animation
                if (referralRef.current) {
                    gsap.fromTo(referralRef.current,
                        { opacity: 0, x: -30 },
                        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', overwrite: true }
                    );
                }
                
                // How it works cards
                const howCards = howRef.current?.querySelectorAll('.how-card');
                if (howCards?.length) {
                    gsap.fromTo(howCards,
                        { opacity: 0, y: 30 },
                        { 
                            opacity: 1, y: 0, duration: 0.4, 
                            ease: 'power2.out', stagger: 0.1,
                            overwrite: true
                        }
                    );
                }
                
                // Warning card
                if (warningRef.current) {
                    gsap.fromTo(warningRef.current,
                        { opacity: 0, scale: 0.98 },
                        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', overwrite: true }
                    );
                }
            });
            
            animationsInitialized.current = true;
            return () => ctx.revert();
        }, 100);
        
        return () => clearTimeout(timer);
    }, [user, loading]);

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

    // Loading state
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="text-center z-10 p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
                    <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Dashboard</h2>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Stats cards data
    const stats = user.isPro ? [
        { icon: FaInfinity, label: 'Daily Attacks', value: 'Unlimited', color: 'text-purple-400', iconBg: 'bg-purple-600/10 border-purple-600/20', subtext: 'Unlimited attacks / day' },
        { icon: FaClock, label: 'Max Duration', value: '300', unit: 's', color: 'text-green-400', iconBg: 'bg-green-600/10 border-green-600/20', subtext: 'Pro benefit' },
        { icon: FaCalendarAlt, label: 'Expires In', value: user.subscriptionStatus?.daysLeft ?? 0, unit: ' days', color: (user.subscriptionStatus?.daysLeft ?? 99) <= 3 ? 'text-red-400' : 'text-yellow-400', iconBg: 'bg-yellow-600/10 border-yellow-600/20', subtext: user.subscriptionStatus?.plan || 'Pro Plan' },
        { icon: FaKey, label: 'User ID', value: user.userId, color: 'text-blue-400', iconBg: 'bg-blue-600/10 border-blue-600/20', isId: true },
    ] : [
        { icon: FaGem, label: 'Credits', value: user.credits, color: 'text-red-400', iconBg: 'bg-red-600/10 border-red-600/20', subtext: '1 credit = 1 attack' },
        { icon: FaUsers, label: 'Referrals', value: user.referralCount || 0, color: 'text-green-400', iconBg: 'bg-green-600/10 border-green-600/20', subtext: '+2 credits each' },
        { icon: FaClock, label: 'Max Duration', value: '60', unit: 's', color: 'text-yellow-400', iconBg: 'bg-yellow-600/10 border-yellow-600/20', subtext: 'Upgrade → 300s' },
        { icon: FaKey, label: 'User ID', value: user.userId, color: 'text-blue-400', iconBg: 'bg-blue-600/10 border-blue-600/20', isId: true },
    ];

    const howItWorks = user.isPro ? [
        { icon: FaCrown, title: 'Pro Subscription', desc: '30 attacks per day with 300s max duration — no credits needed', color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-600/20' },
        { icon: FaLink, title: 'Refer Friends', desc: 'Share your referral link — earn bonus credits for every successful signup', color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
        { icon: FaBullseye, title: 'Launch Attacks', desc: 'Enter IP, port, duration. Pass CAPTCHA and fire when ready', color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
    ] : [
        { icon: FaGift, title: 'Signup Bonus', desc: 'Get 10 free credits when you create your account', color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
        { icon: FaLink, title: 'Refer Friends', desc: 'Share your referral link and earn +2 credits per successful signup', color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-600/20' },
        { icon: FaBullseye, title: 'Use Credits', desc: 'Spend 1 credit per attack (max 60s). Upgrade Pro for 300s & unlimited', color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
    ];

    const cardCls = dark ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl shadow-card hover:border-red-600/20' : 'bg-white border-slate-200/80 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-red-200';
    const inputCls = dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-300 font-mono' : 'bg-slate-50 border-slate-200 text-slate-600 font-mono';

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.4} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                <Navbar toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Welcome Banner */}
                    <div ref={bannerRef} className={`rounded-2xl p-5 sm:p-7 border mb-5 relative overflow-hidden transition-all ${cardCls}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-30 pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />
                        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Dashboard</p>
                                    {user.isPro && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 text-yellow-400">
                                            <FaCrown size={10} /> PRO ACTIVE
                                        </span>
                                    )}
                                </div>
                                <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}>
                                    Welcome, <span className="text-red-500">{user.username}</span>
                                </h1>
                                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                                <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {user.isPro
                                        ? (user.subscriptionStatus?.daysLeft ?? 99) <= 3
                                            ? <span className="text-red-400 font-semibold">⚠ Expires in {user.subscriptionStatus?.daysLeft} days — renew soon!</span>
                                            : <>Pro expires in <span className="text-yellow-400 font-semibold">{user.subscriptionStatus?.daysLeft} days</span></>
                                        : <><span className="text-red-400 font-semibold">{user.credits}</span> credits remaining</>
                                    }
                                </p>
                            </div>
                            <Link to="/attack" className="launch-btn inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-95 text-sm self-start sm:self-auto"
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(220,38,38,0.3)' }}>
                                <FaBullseye size={15} /> LAUNCH ATTACK
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
                        {stats.map((stat, i) => (
                            <div key={i} onClick={stat.isId ? copyUserId : undefined}
                                className={`stat-card rounded-2xl p-4 sm:p-5 border transition-all ${cardCls} ${stat.isId ? 'cursor-pointer' : ''}`}>
                                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border mb-3 ${stat.iconBg}`}>
                                    <stat.icon className={stat.color} size={15} />
                                </div>
                                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                                {stat.isId ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`font-bold text-sm font-mono truncate ${stat.color}`}>{user.userId}</p>
                                        <button onClick={e => { e.stopPropagation(); copyUserId(); }}
                                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${copiedId ? 'bg-green-600/20 border-green-500/40 text-green-400' : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'}`}>
                                            {copiedId ? <FaCheck size={11} /> : <FaCopy size={11} />}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className={`font-black text-2xl sm:text-3xl ${stat.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {stat.value}{stat.unit ?? ''}
                                        </p>
                                        {stat.subtext && <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.subtext}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Nav */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        {[
                            { to: '/attack', icon: FaBullseye, iconCls: 'text-red-400', iconBg: 'bg-red-600/10 border-red-600/20', label: 'Attack Panel', desc: user.isPro ? '30/day · up to 300s' : `${user.credits} credits · up to 60s`, accentCls: 'text-red-500/40 group-hover:text-red-400' },
                            { to: '/contact', icon: FaCrown, iconCls: 'text-yellow-400', iconBg: 'bg-yellow-600/10 border-yellow-600/20', label: user.isPro ? 'Manage Plan' : 'Upgrade to Pro', desc: user.isPro ? 'Extend or change plan' : 'Unlimited · 300s · from ₹850', accentCls: 'text-yellow-500/40 group-hover:text-yellow-400' },
                            { to: '/reseller-prices', icon: FaStore, iconCls: 'text-purple-400', iconBg: 'bg-purple-600/10 border-purple-600/20', label: 'Reseller Plans', desc: 'Bulk pricing & reseller deals', accentCls: 'text-purple-500/40 group-hover:text-purple-400' },
                        ].map(item => (
                            <Link key={item.to} to={item.to} className={`rounded-2xl p-4 border flex items-center gap-3 transition-all group hover:-translate-y-0.5 ${cardCls}`}>
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                    <item.icon className={item.iconCls} size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.label}</p>
                                    <p className={`text-xs truncate ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                                </div>
                                <FaBolt className={`transition-colors shrink-0 ${item.accentCls}`} size={13} />
                            </Link>
                        ))}
                    </div>

                    {/* Referral Card */}
                    <div ref={referralRef} className={`rounded-2xl p-5 sm:p-6 border mb-5 transition-all ${cardCls}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center">
                                <FaLink className="text-green-500" size={14} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your Referral Link</h3>
                                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Earn <span className="text-green-400 font-bold">+2 {user.isPro ? 'bonus credits' : 'credits'}</span> per referral</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className={`flex-1 rounded-xl px-4 py-3 text-xs font-mono truncate border ${inputCls}`}>
                                {window.location.origin}/signup?ref={user.referralCode}
                            </div>
                            <button onClick={copyReferral}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${copied ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em', boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }}>
                                {copied ? <><FaCheck size={13} /> COPIED!</> : <><FaCopy size={13} /> COPY LINK</>}
                            </button>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div ref={howRef} className={`rounded-2xl p-5 sm:p-6 border transition-all ${cardCls}`}>
                        <div className="flex items-center gap-2.5 mb-4">
                            <FaBolt className="text-yellow-500" size={15} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                                {user.isPro ? 'PRO BENEFITS' : 'HOW CREDITS WORK'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {howItWorks.map((item, i) => (
                                <div key={i} className={`how-card rounded-xl p-4 border transition-all ${dark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${item.bg}`}>
                                        <item.icon className={item.color} size={14} />
                                    </div>
                                    <p className={`font-bold text-sm mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.title}</p>
                                    <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warnings */}
                    {!user.isPro && user.credits === 0 && (
                        <div ref={warningRef} className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3 border" style={{ background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.2)' }}>
                            <FaExclamationTriangle className="text-yellow-500 mt-0.5 shrink-0" size={15} />
                            <div>
                                <p className="font-bold text-sm text-yellow-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>No Credits Available</p>
                                <p className="text-yellow-500/70 text-xs mt-1">
                                    You've used all your credits! Refer friends to earn +2 credits each, or{' '}
                                    <Link to="/contact" className="text-yellow-400 underline underline-offset-2">upgrade to Pro</Link>{' '}
                                    for unlimited daily attacks.
                                </p>
                            </div>
                        </div>
                    )}

                    {user.isPro && (user.subscriptionStatus?.daysLeft ?? 99) <= 3 && (
                        <div className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3 border" style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.25)' }}>
                            <FaExclamationTriangle className="text-red-400 mt-0.5 shrink-0" size={15} />
                            <div>
                                <p className="font-bold text-sm text-red-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Pro Expiring Soon</p>
                                <p className="text-red-400/70 text-xs mt-1">
                                    Your Pro subscription expires in <span className="text-red-400 font-semibold">{user.subscriptionStatus?.daysLeft} days</span>.{' '}
                                    <Link to="/contact" className="text-red-400 underline underline-offset-2">Renew now</Link> to keep unlimited access.
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