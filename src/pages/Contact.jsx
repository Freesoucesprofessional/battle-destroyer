import React from 'react';
import {
    FaGem,
    FaTelegram,
    FaBolt,
    FaCrown,
    FaFire,
    FaRupeeSign,
    FaInfoCircle,
    FaShoppingCart,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';

const TELEGRAM_URL = 'https://t.me/BattleDestroyerDDOS_Bot';

const plans = [
    {
        credits: 50,
        price: 499,
        label: 'Starter',
        icon: FaBolt,
        color: 'text-blue-400',
        bg: 'bg-blue-600/10 border-blue-600/20',
        popular: false,
    },
    {
        credits: 150,
        price: 999,
        label: 'Basic',
        icon: FaGem,
        color: 'text-green-400',
        bg: 'bg-green-600/10 border-green-600/20',
        popular: false,
    },
    {
        credits: 250,
        price: 1499,
        label: 'Standard',
        icon: FaFire,
        color: 'text-orange-400',
        bg: 'bg-orange-600/10 border-orange-600/20',
        popular: true,
    },
    {
        credits: 333,
        price: 1999,
        label: 'Advanced',
        icon: FaFire,
        color: 'text-red-400',
        bg: 'bg-red-600/10 border-red-600/20',
        popular: false,
    },
    {
        credits: 400,
        price: 2499,
        label: 'Pro',
        icon: FaCrown,
        color: 'text-yellow-400',
        bg: 'bg-yellow-600/10 border-yellow-600/20',
        popular: false,
    },
    {
        credits: 500,
        price: 2999,
        label: 'Elite',
        icon: FaCrown,
        color: 'text-purple-400',
        bg: 'bg-purple-600/10 border-purple-600/20',
        popular: false,
    },
];

export default function Contact({ toggleTheme, theme }) {
    const bg   = theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50';
    const card = theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
    const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const sub  = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <p className={`text-xs font-medium uppercase tracking-widest mb-2 ${sub}`}>
                        Pricing Plans
                    </p>
                    <h1 className={`text-3xl sm:text-4xl font-black mb-3 ${text}`}>
                        Buy <span className="text-red-500">Credits</span>
                    </h1>
                    <p className={`text-sm max-w-md mx-auto ${sub}`}>
                        Purchase credits to power your attacks. All payments handled securely via Telegram bot.
                    </p>
                    <a
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 text-sm"
                    >
                        <FaTelegram size={18} />
                        Contact via Telegram Bot
                    </a>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col transition-all hover:scale-[1.02] ${card} ${plan.popular ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full tracking-wide shadow-lg flex items-center gap-1">
                                        <FaFire size={11} />
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Plan icon + label */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${plan.bg}`}>
                                    <plan.icon className={plan.color} size={18} />
                                </div>
                                <div>
                                    <p className={`font-black text-sm ${text}`}>{plan.label}</p>
                                    <p className={`text-xs ${sub}`}>Plan</p>
                                </div>
                            </div>

                            {/* Credits */}
                            <div className="flex items-end gap-2 mb-1">
                                <span className={`text-5xl font-black ${plan.color}`}>{plan.credits}</span>
                                <span className={`text-sm mb-2 font-semibold ${sub}`}>credits</span>
                            </div>

                            {/* Credit bar */}
                            <div className={`w-full h-1.5 rounded-full mb-5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                                    style={{ width: `${(plan.credits / 500) * 100}%` }}
                                />
                            </div>

                            {/* Price */}
                            <div className={`rounded-xl px-4 py-3 mb-5 border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${sub}`}>Price</span>
                                    <span className={`text-2xl font-black flex items-center gap-0.5 ${text}`}>
                                        <FaRupeeSign size={18} />
                                        {plan.price}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs ${sub}`}>Per credit</span>
                                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${plan.color}`}>
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
                                className={`w-full py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all active:scale-95 ${plan.popular
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                                    : 'bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 text-blue-400 hover:text-white'
                                }`}
                            >
                                <FaShoppingCart size={14} />
                                Buy Now
                            </a>
                        </div>
                    ))}
                </div>

                {/* Info note */}
                <div className={`mt-8 rounded-2xl border p-5 flex items-start gap-4 ${card}`}>
                    <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                        <FaInfoCircle className="text-blue-400" size={16} />
                    </div>
                    <div>
                        <p className={`font-bold text-sm mb-1 ${text}`}>How to Purchase</p>
                        <p className={`text-xs leading-relaxed ${sub}`}>
                            Click{' '}
                            <span className="text-blue-400 font-semibold">Buy Now</span>
                            {' '}on any plan to open our Telegram bot.
                            Send the plan name and complete payment via UPI/bank transfer.
                            Credits are added to your account within minutes after confirmation.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}