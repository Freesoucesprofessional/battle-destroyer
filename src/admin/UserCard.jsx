import React from 'react';
import {
    FaEdit, FaTrash, FaCrown, FaGem, FaClock,
    FaUser, FaStar, FaCalendarAlt, FaBullseye
} from 'react-icons/fa';

export default function UserCard({ user, onEdit, onDelete, dark }) {
    const isPro = user.isPro;
    const daysLeft = user.subscriptionStatus?.daysLeft || 0;
    const isExpiringSoon = isPro && daysLeft <= 7 && daysLeft > 0;
    const remainingAttacks = isPro ? user.subscription?.dailyCredits || 30 : user.credits || 0;

    return (
        <div className={`rounded-xl border p-4 transition-all ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPro ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                        {isPro ? <FaCrown className="text-yellow-500" size={14} /> : <FaUser className="text-blue-500" size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{user.username}</p>
                        <p className={`text-xs truncate ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => onEdit(user)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                        title="Edit user">
                        <FaEdit size={12} />
                    </button>
                    <button onClick={() => onDelete(user)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                        title="Delete user">
                        <FaTrash size={11} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <FaGem className={isPro ? 'text-yellow-500' : 'text-blue-500'} size={10} />
                        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Credits Balance</span>
                    </div>
                    <p className={`text-lg font-black ${isPro ? 'text-yellow-500' : 'text-blue-500'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {user.credits || 0}
                    </p>
                    {isPro && <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>+30 daily attacks</p>}
                </div>

                <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        {isPro ? <FaStar className="text-yellow-500" size={10} /> : <FaBullseye className="text-purple-500" size={10} />}
                        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isPro ? 'Daily Attacks' : 'Remaining'}
                        </span>
                    </div>
                    <p className={`text-lg font-black ${isPro ? 'text-yellow-500' : 'text-purple-500'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {isPro ? `${remainingAttacks}/30` : remainingAttacks}
                    </p>
                    {isPro && <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Resets daily</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                {isPro ? (
                    <>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaCalendarAlt className="text-purple-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Plan</span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {user.subscription?.plan || 'Pro'} · {user.subscription?.expiresAt ? `${daysLeft}d left` : 'Active'}
                            </p>
                            {isExpiringSoon && <p className="text-[10px] text-yellow-500 mt-0.5">⚠️ Expiring soon!</p>}
                        </div>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaClock className="text-green-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Attacks</span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {user.totalAttacks?.toLocaleString() || 0}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaCalendarAlt className="text-purple-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Joined</span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaClock className="text-green-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Attacks</span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {user.totalAttacks?.toLocaleString() || 0}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${isPro
                    ? (dark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600')
                    : (dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                    {isPro ? '⭐ Pro Member' : '💎 Free User'}
                    {isPro && user.subscription?.plan && ` · ${user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)} Plan`}
                </span>
            </div>
        </div>
    );
}