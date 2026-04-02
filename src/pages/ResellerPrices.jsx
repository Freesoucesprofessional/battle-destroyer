import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    FaGem, FaTelegram, FaBolt, FaCrown, FaFire,
    FaRupeeSign, FaInfoCircle, FaChevronRight,
    FaUsers, FaShieldAlt, FaCheckCircle,
    FaCalculator, FaChartLine,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight, MdSpeed } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

const TELEGRAM_URL = 'https://t.me/BattleDestroyerDDOS_Bot';

// ── Credit system: Base unit = 200 ───────────────────────────────────────────
const CREDIT_RATE = 1; // ₹1 per credit

// Reseller packages (NO BONUS CREDITS shown)
const RESELLER_PACKAGES = [
    {
        credits: 5000,
        inr: 5000,
        inrLabel: '5K',
        usdt: '55$',
        label: 'Starter Pack',
        icon: FaBolt,
        color: 'text-blue-400',
        bg: 'from-blue-600/10 to-blue-600/5',
        border: 'border-blue-600/20',
        glow: 'rgba(59,130,246,0.3)',
        popular: false,
    },
    {
        credits: 10000,
        inr: 10000,
        inrLabel: '10K',
        usdt: '108$',
        label: 'Growth Pack',
        icon: FaFire,
        color: 'text-orange-400',
        bg: 'from-orange-600/10 to-orange-600/5',
        border: 'border-orange-600/20',
        glow: 'rgba(249,115,22,0.3)',
        popular: true,
    },
    {
        credits: 20000,
        inr: 20000,
        inrLabel: '20K',
        usdt: '215$',
        label: 'Elite Pack',
        icon: FaGem,
        color: 'text-purple-400',
        bg: 'from-purple-600/10 to-purple-600/5',
        border: 'border-purple-600/20',
        glow: 'rgba(168,85,247,0.3)',
        popular: false,
    },
];

// Fixed customer price list
const CUSTOMER_PLANS = [
    {
        label: 'Week',
        days: 7,
        price: 850,
        credits: 200,
        get profit() { return this.price - this.credits * CREDIT_RATE; },
        get multiplier() { return (this.price / (this.credits * CREDIT_RATE)).toFixed(2); },
        icon: FaBolt,
        color: 'text-blue-400',
        accent: 'border-blue-600/25',
        bg: 'from-blue-600/8 to-blue-600/3',
    },
    {
        label: 'Month',
        days: 30,
        price: 1800,
        credits: 400,
        get profit() { return this.price - this.credits * CREDIT_RATE; },
        get multiplier() { return (this.price / (this.credits * CREDIT_RATE)).toFixed(2); },
        icon: FaGem,
        color: 'text-green-400',
        accent: 'border-green-600/25',
        bg: 'from-green-600/8 to-green-600/3',
        popular: true,
    },
    {
        label: 'Season',
        days: 60,
        price: 2500,
        credits: 800,
        get profit() { return this.price - this.credits * CREDIT_RATE; },
        get multiplier() { return (this.price / (this.credits * CREDIT_RATE)).toFixed(2); },
        icon: FaCrown,
        color: 'text-yellow-400',
        accent: 'border-yellow-600/25',
        bg: 'from-yellow-600/8 to-yellow-600/3',
    },
];

const PLAN_COSTS = [
    { name: 'Week', cost: 200 },
    { name: 'Month', cost: 400 },
    { name: 'Season', cost: 800 },
];

const BENEFITS = [
    { icon: FaUsers,       title: 'Grow Your Network',    desc: 'Build your own customer base and distribute plans instantly via the reseller panel.' },
    { icon: FaShieldAlt,   title: 'Secure Panel Access',  desc: 'Dedicated reseller portal with full audit logs and account management.' },
    { icon: MdSpeed,       title: 'Instant Distribution', desc: 'Give plans to customers in seconds — no waiting, no delays.' },
    { icon: FaCheckCircle, title: 'Fixed Pricing',        desc: 'Sell at our fixed customer price list — your margins are always protected.' },
];

// ── NEW PROFIT CALCULATOR ─────────────────────────────────────────────────────
// Shows: For X credits, how many Week/Month/Season plans can you sell?
// With profit breakdown per plan type and total profit
function ProfitCalculator({ dark }) {
    const [credits, setCredits] = useState(10000);
    
    // Calculate max possible plans from credits
    const maxWeeks = Math.floor(credits / 200);
    const maxMonths = Math.floor(credits / 400);
    const maxSeasons = Math.floor(credits / 800);
    
    // For each plan type, calculate:
    // - How many you can sell if you sell ONLY that plan
    // - Total revenue, cost, profit
    const weekRevenue = maxWeeks * 850;
    const weekCost = maxWeeks * 200;
    const weekProfit = weekRevenue - weekCost;
    
    const monthRevenue = maxMonths * 1800;
    const monthCost = maxMonths * 400;
    const monthProfit = monthRevenue - monthCost;
    
    const seasonRevenue = maxSeasons * 2500;
    const seasonCost = maxSeasons * 800;
    const seasonProfit = seasonRevenue - seasonCost;
    
    // For "Balanced Mix" - sell equal number of each plan (using smallest divisor)
    const balancedCount = Math.floor(credits / (200 + 400 + 800)); // credits / 1400
    const balancedWeeks = balancedCount;
    const balancedMonths = balancedCount;
    const balancedSeasons = balancedCount;
    const balancedUsedCredits = (balancedWeeks * 200) + (balancedMonths * 400) + (balancedSeasons * 800);
    const balancedRevenue = (balancedWeeks * 850) + (balancedMonths * 1800) + (balancedSeasons * 2500);
    const balancedCost = balancedUsedCredits;
    const balancedProfit = balancedRevenue - balancedCost;
    const remainingCredits = credits - balancedUsedCredits;
    
    // Quick preset buttons
    const quickPresets = [
        { label: '₹5K', value: 5000 },
        { label: '₹10K', value: 10000 },
        { label: '₹20K', value: 20000 },
    ];
    
    // Helper to format currency
    const formatINR = (num) => `₹${num.toLocaleString()}`;
    
    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';
    
    return (
        <div className={`rounded-3xl border p-6 sm:p-8 ${cardCls}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                    <FaCalculator className="text-red-400" size={16} />
                </div>
                <div>
                    <h3 className={`font-black text-lg ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                        PROFIT CALCULATOR
                    </h3>
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Enter your credits — see how many plans you can sell and your profit
                    </p>
                </div>
            </div>
            
            <div className="space-y-8">
                {/* Credit Input Section */}
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Your Credit Balance
                    </label>
                    <div className={`flex rounded-xl border overflow-hidden ${dark ? 'border-white/[0.1] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                        <input
                            type="number"
                            value={credits}
                            min={0}
                            step={200}
                            onChange={e => setCredits(Math.max(0, parseInt(e.target.value) || 0))}
                            className={`flex-1 px-4 py-3 text-lg font-black bg-transparent outline-none ${dark ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        />
                        <span className={`px-3 flex items-center text-xs font-bold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>CREDITS</span>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-2 mt-2">
                        {quickPresets.map(p => (
                            <button
                                key={p.label}
                                onClick={() => setCredits(p.value)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                                    credits === p.value
                                        ? 'bg-red-600 border-red-500 text-white'
                                        : dark
                                            ? 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                                }`}
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        You bought {credits.toLocaleString()} credits at ₹{credits.toLocaleString()} (₹1/credit)
                    </p>
                </div>
                
                {/* Strategy 1: Sell ONLY Week Plans */}
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-blue-600/30 bg-blue-600/5' : 'border-blue-200 bg-blue-50/50'}`}>
                    <div className={`px-4 py-3 ${dark ? 'bg-blue-600/10 border-b border-blue-600/20' : 'bg-blue-100/50 border-b border-blue-200'}`}>
                        <div className="flex items-center gap-2">
                            <FaBolt className="text-blue-400" size={14} />
                            <span className="font-bold text-sm uppercase tracking-wider text-blue-400">Strategy 1: Sell Only Week Plans</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>You Can Sell</p>
                                <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {maxWeeks.toLocaleString()}
                                </p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Week Plans</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Revenue</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(weekRevenue)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Cost</p>
                                <p className="text-xl font-black text-red-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(weekCost)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Profit</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(weekProfit)}
                                </p>
                            </div>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/[0.1]' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: '100%' }} />
                        </div>
                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Each Week plan: Costs you ₹200 → Sell for ₹850 → Profit ₹650 (4.25× return)
                        </p>
                    </div>
                </div>
                
                {/* Strategy 2: Sell ONLY Month Plans */}
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-green-600/30 bg-green-600/5' : 'border-green-200 bg-green-50/50'}`}>
                    <div className={`px-4 py-3 ${dark ? 'bg-green-600/10 border-b border-green-600/20' : 'bg-green-100/50 border-b border-green-200'}`}>
                        <div className="flex items-center gap-2">
                            <FaGem className="text-green-400" size={14} />
                            <span className="font-bold text-sm uppercase tracking-wider text-green-400">Strategy 2: Sell Only Month Plans</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>You Can Sell</p>
                                <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {maxMonths.toLocaleString()}
                                </p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Month Plans</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Revenue</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(monthRevenue)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Cost</p>
                                <p className="text-xl font-black text-red-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(monthCost)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Profit</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(monthProfit)}
                                </p>
                            </div>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/[0.1]' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: '100%' }} />
                        </div>
                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Each Month plan: Costs you ₹400 → Sell for ₹1800 → Profit ₹1400 (4.5× return)
                        </p>
                    </div>
                </div>
                
                {/* Strategy 3: Sell ONLY Season Plans */}
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-yellow-600/30 bg-yellow-600/5' : 'border-yellow-200 bg-yellow-50/50'}`}>
                    <div className={`px-4 py-3 ${dark ? 'bg-yellow-600/10 border-b border-yellow-600/20' : 'bg-yellow-100/50 border-b border-yellow-200'}`}>
                        <div className="flex items-center gap-2">
                            <FaCrown className="text-yellow-400" size={14} />
                            <span className="font-bold text-sm uppercase tracking-wider text-yellow-400">Strategy 3: Sell Only Season Plans</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>You Can Sell</p>
                                <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {maxSeasons.toLocaleString()}
                                </p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Season Plans</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Revenue</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(seasonRevenue)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Cost</p>
                                <p className="text-xl font-black text-red-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(seasonCost)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your Profit</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(seasonProfit)}
                                </p>
                            </div>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/[0.1]' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400" style={{ width: '100%' }} />
                        </div>
                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Each Season plan: Costs you ₹800 → Sell for ₹2500 → Profit ₹1700 (3.125× return)
                        </p>
                    </div>
                </div>
                
                {/* Strategy 4: Balanced Mix (Example) */}
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-purple-600/30 bg-purple-600/5' : 'border-purple-200 bg-purple-50/50'}`}>
                    <div className={`px-4 py-3 ${dark ? 'bg-purple-600/10 border-b border-purple-600/20' : 'bg-purple-100/50 border-b border-purple-200'}`}>
                        <div className="flex items-center gap-2">
                            <FaChartLine className="text-purple-400" size={14} />
                            <span className="font-bold text-sm uppercase tracking-wider text-purple-400">Example: Balanced Mix (Equal numbers)</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Week</p>
                                <p className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {balancedWeeks}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Month</p>
                                <p className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {balancedMonths}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Season</p>
                                <p className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {balancedSeasons}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Profit</p>
                                <p className="text-xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {formatINR(balancedProfit)}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Credits Used</p>
                                <p className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {balancedUsedCredits.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {remainingCredits > 0 && (
                            <p className={`text-[11px] mt-2 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                                ⚡ {remainingCredits.toLocaleString()} credits remaining — you can sell {Math.floor(remainingCredits / 200)} more Week plans or combine with other plans!
                            </p>
                        )}
                        <div className={`h-1.5 rounded-full overflow-hidden mt-2 ${dark ? 'bg-white/[0.1]' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${(balancedUsedCredits / credits) * 100}%` }} />
                        </div>
                    </div>
                </div>
                
                {/* Summary Card */}
                <div className={`rounded-2xl border p-4 text-center ${dark ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Summary with {credits.toLocaleString()} Credits
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-2xl font-black text-blue-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {maxWeeks.toLocaleString()}
                            </p>
                            <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Max Week Plans</p>
                            <p className="text-xs text-green-400">Profit: {formatINR(weekProfit)}</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {maxMonths.toLocaleString()}
                            </p>
                            <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Max Month Plans</p>
                            <p className="text-xs text-green-400">Profit: {formatINR(monthProfit)}</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-yellow-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {maxSeasons.toLocaleString()}
                            </p>
                            <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Max Season Plans</p>
                            <p className="text-xs text-green-400">Profit: {formatINR(seasonProfit)}</p>
                        </div>
                    </div>
                    <div className={`mt-3 pt-3 border-t ${dark ? 'border-white/[0.1]' : 'border-slate-200'}`}>
                        <p className="text-sm font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Highest Profit Strategy: {weekProfit >= monthProfit && weekProfit >= seasonProfit ? 'Week Plans' : monthProfit >= weekProfit && monthProfit >= seasonProfit ? 'Month Plans' : 'Season Plans'}
                        </p>
                        <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {weekProfit >= monthProfit && weekProfit >= seasonProfit 
                                ? `Selling only Week plans gives you ₹${weekProfit.toLocaleString()} profit on ₹${weekCost.toLocaleString()} investment (${((weekProfit / weekCost) * 100).toFixed(0)}% ROI)`
                                : monthProfit >= weekProfit && monthProfit >= seasonProfit
                                    ? `Selling only Month plans gives you ₹${monthProfit.toLocaleString()} profit on ₹${monthCost.toLocaleString()} investment (${((monthProfit / monthCost) * 100).toFixed(0)}% ROI)`
                                    : `Selling only Season plans gives you ₹${seasonProfit.toLocaleString()} profit on ₹${seasonCost.toLocaleString()} investment (${((seasonProfit / seasonCost) * 100).toFixed(0)}% ROI)`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResellerPrices({ toggleTheme, theme }) {
    const dark = theme !== 'light';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!(localStorage.getItem('token') && user.username);

    const headerRef   = useRef(null);
    const packagesRef = useRef(null);
    const plansRef    = useRef(null);
    const calcRef     = useRef(null);
    const benefitsRef = useRef(null);
    const ctaRef      = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            if (headerRef.current) {
                gsap.fromTo(Array.from(headerRef.current.children),
                    { opacity: 0, y: -28 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12, delay: 0.1 }
                );
            }

            const pkgCards = packagesRef.current?.querySelectorAll('.pkg-card') || [];
            const origins = [
                { x: -200, y: -80, r: -15 },
                { x: 0,    y: -180, r: 8  },
                { x: 200,  y: -80, r: 15  },
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

            pkgCards.forEach(card => {
                const bar = card.querySelector('.pkg-bar');
                if (!bar) return;
                gsap.fromTo(bar,
                    { scaleX: 0, transformOrigin: 'left center' },
                    { scaleX: 1, duration: 0.9, ease: 'power2.out',
                      scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 55%', scrub: 1 } }
                );
            });

            gsap.to('.popular-badge', {
                boxShadow: '0 4px 28px rgba(220,38,38,0.65)',
                repeat: -1, yoyo: true, duration: 1.4, ease: 'sine.inOut',
            });

            const planCards = plansRef.current?.querySelectorAll('.plan-card') || [];
            gsap.fromTo(planCards,
                { opacity: 0, y: 30, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.1,
                  scrollTrigger: { trigger: plansRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } }
            );

            if (calcRef.current) {
                gsap.fromTo(calcRef.current,
                    { opacity: 0, y: 40 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
                      scrollTrigger: { trigger: calcRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            }

            const benCards = benefitsRef.current?.querySelectorAll('.ben-card') || [];
            gsap.fromTo(benCards,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1,
                  scrollTrigger: { trigger: benefitsRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
            );

            if (ctaRef.current) {
                gsap.fromTo(ctaRef.current,
                    { opacity: 0, scale: 0.93, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out',
                      scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } }
                );
            }

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

                {/* ── Top Bar ── */}
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
                                <Link to="/dashboard"
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 flex items-center gap-2"
                                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                                    <FaBolt size={13} /> DASHBOARD
                                </Link>
                            ) : (
                                <Link to="/login"
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08]' : 'bg-black/[0.04] hover:bg-black/[0.07] text-slate-600 hover:text-slate-900 border border-black/[0.08]'}`}>
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
                            Buy credits in bulk at <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>₹1/credit</span> and resell plans at fixed customer prices.
                            Earn <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>4×+ profit</span> on every sale — zero credit waste guaranteed.
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

                    {/* ── Reseller Credit Packs (NO BONUS) ── */}
                    <div className="mb-6">
                        <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-6 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Wholesale Credit Packages · 1 Credit = ₹1
                        </p>
                    </div>
                    <div ref={packagesRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-16">
                        {RESELLER_PACKAGES.map((pkg, i) => {
                            const Icon = pkg.icon;
                            const perCredit = (pkg.inr / pkg.credits).toFixed(2);
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

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl border bg-gradient-to-br ${pkg.bg} ${pkg.border} flex items-center justify-center`}>
                                            <Icon className={pkg.color} size={17} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}
                                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>{pkg.label}</p>
                                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Wholesale Pack</p>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-2 mb-4">
                                        <span className={`text-5xl font-black ${pkg.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {pkg.credits.toLocaleString()}
                                        </span>
                                        <span className={`text-sm mb-2.5 font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>credits</span>
                                    </div>

                                    <div className={`w-full h-1.5 rounded-full mb-5 overflow-hidden ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                                        <div className="pkg-bar h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                                            style={{ width: `${(pkg.credits / 20000) * 100}%` }} />
                                    </div>

                                    <div className={`rounded-xl px-4 py-3 mb-5 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Price (INR)</span>
                                            <span className={`text-2xl font-black flex items-center gap-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}
                                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                <FaRupeeSign size={17} />{pkg.inrLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Price (USDT)</span>
                                            <span className={`text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{pkg.usdt}</span>
                                        </div>
                                        <div className={`flex items-center justify-between border-t pt-2 mt-1 ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
                                            <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Per credit</span>
                                            <span className={`text-xs font-bold flex items-center gap-0.5 ${pkg.color}`}>
                                                <FaRupeeSign size={10} />{perCredit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Activations */}
                                    <div className={`rounded-xl px-3 py-2.5 border mb-5 ${dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Activations possible</p>
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            {PLAN_COSTS.map(p => (
                                                <div key={p.name}>
                                                    <p className={`text-base font-black ${dark ? 'text-white' : 'text-slate-900'}`}
                                                        style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                        {Math.floor(pkg.credits / p.cost)}
                                                    </p>
                                                    <p className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{p.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

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
                            Resellers must sell at these fixed prices — undercutting is not allowed. Your profit is built in.
                        </p>
                    </div>

                    <div ref={plansRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
                        {CUSTOMER_PLANS.map((plan, i) => {
                            const Icon = plan.icon;
                            return (
                                <div key={i}
                                    className={`plan-card relative rounded-2xl border p-5 transition-all hover:-translate-y-1 ${cardCls} ${plan.popular ? dark ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-red-300 ring-1 ring-red-100' : ''}`}>
                                    {plan.popular && (
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                                            MOST POPULAR
                                        </span>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl border bg-gradient-to-br ${plan.bg} ${plan.accent} flex items-center justify-center`}>
                                            <Icon className={plan.color} size={17} />
                                        </div>
                                        <div>
                                            <p className={`font-black text-base ${dark ? 'text-white' : 'text-slate-900'}`}
                                                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                                                {plan.label.toUpperCase()} PLAN
                                            </p>
                                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{plan.days} days Pro access</p>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1 mb-4">
                                        <FaRupeeSign className={`${plan.color} mt-1`} size={16} />
                                        <span className={`text-4xl font-black ${plan.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {plan.price.toLocaleString()}
                                        </span>
                                        <span className={`text-sm font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>/ sale</span>
                                    </div>

                                    <div className={`rounded-xl border divide-y ${dark ? 'border-white/[0.07] divide-white/[0.05]' : 'border-slate-200 divide-slate-100'}`}>
                                        <div className={`flex items-center justify-between px-3 py-2 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50'} rounded-t-xl`}>
                                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Credit cost</span>
                                            <span className={`text-sm font-black ${plan.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                {plan.credits} credits
                                            </span>
                                        </div>
                                        <div className={`flex items-center justify-between px-3 py-2 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your cost</span>
                                            <span className={`text-sm font-bold flex items-center gap-0.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                <FaRupeeSign size={10} />{(plan.credits * CREDIT_RATE).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={`flex items-center justify-between px-3 py-2 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Your profit</span>
                                            <span className="text-sm font-bold text-green-400 flex items-center gap-0.5">
                                                <FaRupeeSign size={10} />{plan.profit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={`flex items-center justify-between px-3 py-2 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50'} rounded-b-xl`}>
                                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Profit multiple</span>
                                            <span className="text-sm font-black text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                {plan.multiplier}×
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Profit Calculator ── */}
                    <div className="mb-6 text-center">
                        <p className="bd-section-tag mb-2">Reseller Tool</p>
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Profit <span className="text-gradient-red">Calculator</span>
                        </h2>
                        <p className={`text-xs max-w-md mx-auto ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Enter your credits — see exactly how many plans you can sell and your profit.
                        </p>
                    </div>
                    <div ref={calcRef} className="mb-16">
                        <ProfitCalculator dark={dark} />
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
                                { icon: FaTelegram,   title: 'Contact Admin',    desc: 'Message us on Telegram and choose your reseller credit pack.' },
                                { icon: FaRupeeSign,  title: 'Make Payment',     desc: 'Pay via UPI or USDT. Credits are added to your reseller account instantly.' },
                                { icon: FaUsers,      title: 'Activate Plans',   desc: 'Log in to the reseller panel, search a user, and give them a plan in seconds.' },
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

                    {/* ── Zero Waste Notice ── */}
                    <div className={`rounded-2xl border p-5 flex items-start gap-4 mb-4 ${dark ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <FaCheckCircle className="text-green-400" size={15} />
                        </div>
                        <div>
                            <p className="font-bold text-sm mb-1 text-green-400" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
                                ZERO CREDIT WASTE — MATHEMATICALLY GUARANTEED
                            </p>
                            <p className={`text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Week (200 cr), Month (400 cr), and Season (800 cr) plans share a base unit of 200.
                                All credit packs — 5,000 / 10,000 / 20,000 — are exact multiples of 200.
                                No matter which mix of plans you sell, you will never be left with unusable credits.
                            </p>
                        </div>
                    </div>

                    {/* ── Info note ── */}
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