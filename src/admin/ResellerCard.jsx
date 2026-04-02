import React from 'react';
import { FaEdit, FaTrash, FaGem, FaCalendarAlt, FaUserTie, FaChartLine } from 'react-icons/fa';

export default function ResellerCard({ reseller, onEdit, onDelete, onViewStats, dark }) {
    return (
        <div className={`rounded-xl border p-4 transition-all ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${reseller.isBlocked ? 'bg-red-500/10' : 'bg-purple-500/10'}`}>
                        <FaUserTie className={reseller.isBlocked ? 'text-red-500' : 'text-purple-500'} size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller.username}</p>
                        <p className={`text-xs truncate ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{reseller.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => onViewStats(reseller)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                        title="View Statistics">
                        <FaChartLine size={12} />
                    </button>
                    <button onClick={() => onEdit(reseller)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
                        <FaEdit size={12} />
                    </button>
                    <button onClick={() => onDelete(reseller)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                        <FaTrash size={11} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <FaGem className="text-purple-500" size={10} />
                        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Credits</span>
                    </div>
                    <p className="text-lg font-black text-purple-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {reseller.credits?.toLocaleString() || 0}
                    </p>
                </div>
                <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <FaCalendarAlt className="text-blue-500" size={10} />
                        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Joined</span>
                    </div>
                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                        {new Date(reseller.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="mt-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${reseller.isBlocked
                    ? (dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                    : (dark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600')}`}>
                    {reseller.isBlocked ? '🚫 Blocked' : '🤝 Active Reseller'}
                </span>
            </div>
        </div>
    );
}