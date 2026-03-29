import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaGem, FaUsers, FaCoins, FaKey, FaLink, FaGift, FaBullseye } from 'react-icons/fa';
import Navbar from '../components/Navbar';

export default function Dashboard({ toggleTheme, theme }) {
    const [user, setUser] = useState(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const [copiedId, setCopiedId] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/api/panel/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setUser(r.data);
            localStorage.setItem('user', JSON.stringify(r.data));
        }).catch(() => { localStorage.clear(); navigate('/login'); });
    }, [navigate, API_URL]);

    const copyReferral = () => {
        const link = `${window.location.origin}/signup?ref=${user.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(user.userId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const bg = theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50';
    const card = theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
    const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const sub = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inp = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600';

    if (!user) return (
        <div className={`min-h-screen ${bg} flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${sub}`}>Loading dashboard...</p>
            </div>
        </div>
    );

    const stats = [
        { icon: FaGem, label: 'Credits', value: user.credits, color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
        { icon: FaUsers, label: 'Referrals', value: user.referralCount || 0, color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
        { icon: FaCoins, label: 'Per Refer', value: '+2', color: 'text-yellow-400', bg: 'bg-yellow-600/10 border-yellow-600/20' },
        { icon: FaKey, label: 'User ID', value: user.userId, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-600/20', small: true },
    ];

    const howItWorks = [
        { icon: FaGift, title: 'Signup Bonus', desc: 'Get 3 free credits when you create your account on a new device' },
        { icon: FaLink, title: 'Refer Friends', desc: 'Share your referral link and earn +2 credits per successful signup' },
        { icon: FaBullseye, title: 'Use Credits', desc: 'Spend credits to launch attacks from the Attack page' },
    ];

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* Welcome Banner */}
                <div className={`rounded-2xl p-5 sm:p-7 border mb-5 relative overflow-hidden ${card}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent" />
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${sub}`}>Dashboard</p>
                                <h1 className={`text-2xl sm:text-3xl font-black ${text}`}>
                                    Welcome, <span className="text-red-500">{user.username}</span> 👋
                                </h1>
                                <p className={`text-sm mt-1 ${sub}`}>{user.email}</p>
                            </div>
                            <Link to="/attack"
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 text-sm self-start sm:self-auto">
                                <FaBullseye size={16} />
                                Launch Attack
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
                    {stats.map((stat, i) => {
                        const isUserId = stat.label === 'User ID';
                        return (
                            <div
                                key={i}
                                onClick={isUserId ? copyUserId : undefined}
                                className={`rounded-2xl p-4 sm:p-5 border ${card} ${isUserId ? 'cursor-pointer hover:border-blue-500/50 transition-all' : ''}`}
                            >
                                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border text-lg mb-3 ${stat.bg}`}>
                                    <stat.icon className="text-red-500" />
                                </div>
                                <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${sub}`}>{stat.label}</p>

                                {isUserId ? (
                                    <div className="flex items-center justify-between gap-1">
                                        <p className={`font-black text-sm font-mono ${stat.color} truncate`}>
                                            {user.userId}
                                        </p>
                                        <span className={`text-xs font-bold whitespace-nowrap shrink-0 ${copiedId ? 'text-green-400' : 'text-blue-400'}`}>
                                            {copiedId ? '✓ Copied' : 'Copy'}
                                        </span>
                                    </div>
                                ) : (
                                    <p className={`font-black ${stat.color} ${stat.small ? 'text-sm font-mono' : 'text-2xl sm:text-3xl'}`}>
                                        {stat.value}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Referral Card */}
                <div className={`rounded-2xl p-5 sm:p-6 border mb-5 ${card}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center text-lg">
                            <FaLink className="text-green-500" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${text}`}>Your Referral Link</h3>
                            <p className={`text-xs ${sub}`}>Earn <span className="text-green-400 font-bold">+2 credits</span> for every successful referral</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className={`flex-1 rounded-xl px-4 py-3 text-xs font-mono truncate border ${inp}`}>
                            {window.location.origin}/signup?ref={user.referralCode}
                        </div>
                        <button onClick={copyReferral}
                            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${copied
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}>
                            {copied ? '✅ Copied!' : '📋 Copy Link'}
                        </button>
                    </div>
                </div>

                {/* How it works */}
                <div className={`rounded-2xl p-5 sm:p-6 border ${card}`}>
                    <h3 className={`font-bold text-sm mb-4 ${text}`}>⚡ How Credits Work</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {howItWorks.map((item, i) => (
                            <div key={i} className={`rounded-xl p-4 border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <item.icon className="text-2xl mb-2 text-red-500" />
                                <p className={`font-semibold text-sm mb-1 ${text}`}>{item.title}</p>
                                <p className={`text-xs leading-relaxed ${sub}`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* No credits warning */}
                {user.credits === 0 && (
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-2xl px-5 py-4 flex items-start gap-3">
                        <span className="text-xl mt-0.5">⚠️</span>
                        <div>
                            <p className="font-bold text-sm">No Credits Available</p>
                            <p className="text-yellow-500/70 text-xs mt-1">This device was already used to claim free credits. Share your referral link to earn more!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}