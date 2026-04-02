// AdminPanel.js - Fully Responsive with Single Edit Button
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaSearch, FaSignOutAlt, FaLock, FaCheckCircle, FaExclamationTriangle,
    FaEdit, FaTrash, FaTimes, FaSave, FaChevronLeft, FaChevronRight,
    FaCrown, FaGem, FaClock, FaUsers, FaUser,
    FaStar, FaCalendarAlt, FaBullseye, FaPlus, FaUserTie, FaChartLine
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 20;

// Toast Component
function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs px-4">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-xl animate-slide-up
                    ${t.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {t.type === 'success' ? <FaCheckCircle size={12} /> : <FaExclamationTriangle size={12} />}
                    <span className="flex-1 text-center text-xs">{t.message}</span>
                </div>
            ))}
        </div>
    );
}

// Modal Component - Fully Responsive
function Modal({ title, onClose, children, dark, size = 'md' }) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-3xl'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`relative w-full ${sizeClasses[size]}
                rounded-t-2xl sm:rounded-2xl border shadow-2xl
                flex flex-col
                max-h-[92vh] sm:max-h-[90vh]
                ${dark ? 'bg-surface-800 border-white/[0.1] backdrop-blur-xl' : 'bg-white border-slate-200'}`}
            >
                {/* Sticky Header */}
                <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b shrink-0
                    ${dark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                    <h2 className={`font-black text-sm sm:text-base truncate pr-4 ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                        {title}
                    </h2>
                    <button onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0
                            ${dark ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, dark }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 text-sm ${dark
                    ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <FaChevronLeft size={10} /> Prev
            </button>
            <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentPage} / {totalPages}
            </span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 text-sm ${dark
                    ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Next <FaChevronRight size={10} />
            </button>
        </div>
    );
}

// UserCard Component
function UserCard({ user, onEdit, onDelete, dark }) {
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


// Reseller Detail Modal Component - Add this BEFORE your AdminPanel component
function ResellerDetailModal({ reseller, dark, onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchResellerStats = async () => {
            const token = localStorage.getItem('adminToken');
            if (!reseller?._id) return;

            try {
                const { data } = await axios.get(`${API_URL}/api/admin/resellers/${reseller._id}/stats`, {
                    headers: { 'x-admin-token': token },
                    withCredentials: true
                });
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch reseller stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchResellerStats();
    }, [reseller]);

    const formatINR = (num) => `₹${(num || 0).toLocaleString()}`;
    const formatDate = (date) => new Date(date).toLocaleDateString();

    if (loading) {
        return (
            <Modal title="RESELLER STATISTICS" onClose={onClose} dark={dark} size="xl">
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </Modal>
        );
    }

    if (!stats) return null;

    const { reseller: resellerInfo, statistics, planBreakdown, charts, topCustomers, recentActivity } = stats;

    return (
        <Modal title={`RESELLER: ${resellerInfo.username}`} onClose={onClose} dark={dark} size="xl">
            {/* Tabs */}
            <div className="flex gap-2 border-b mb-4 pb-2">
                {['overview', 'plans', 'customers', 'activity'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab
                            ? 'bg-purple-600 text-white'
                            : dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {/* Reseller Info */}
                    <div className={`rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Username</p>
                                <p className="font-bold text-sm">{resellerInfo.username}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                                <p className="font-bold text-sm truncate">{resellerInfo.email}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Credits Balance</p>
                                <p className="text-lg font-black text-purple-500">{resellerInfo.credits?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Spent</p>
                                <p className="text-lg font-black text-purple-500">{resellerInfo.totalGiven?.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Joined</p>
                                <p className="text-sm">{formatDate(resellerInfo.createdAt)}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Last Login</p>
                                <p className="text-sm">{resellerInfo.lastLogin ? formatDate(resellerInfo.lastLogin) : 'Never'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className={`rounded-xl p-3 text-center border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Sales</p>
                            <p className="text-xl font-black text-green-500">{statistics.totalSales}</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Revenue</p>
                            <p className="text-xl font-black text-green-500">{formatINR(statistics.totalRevenue)}</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Profit</p>
                            <p className="text-xl font-black text-green-500">{formatINR(statistics.totalProfit)}</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>ROI</p>
                            <p className="text-xl font-black text-green-500">{statistics.roi}%</p>
                        </div>
                    </div>

                    {/* Charts */}
                    {charts?.dailySales?.length > 0 && (
                        <div className={`rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-xs font-bold mb-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Last 30 Days Sales</p>
                            <div className="flex items-end gap-1 h-32">
                                {charts.dailySales.map((day, i) => {
                                    const maxAmount = Math.max(...charts.dailySales.map(d => d.amount), 1);
                                    const height = (day.amount / maxAmount) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-purple-500/20 rounded-t" style={{ height: `${height}%`, minHeight: '2px' }}>
                                                <div className="w-full bg-purple-500 rounded-t" style={{ height: `${height}%` }} />
                                            </div>
                                            <span className="text-[8px] mt-1 rotate-45 origin-left">{day.date.slice(5)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top Customers Preview */}
                    {topCustomers?.length > 0 && (
                        <div className={`rounded-xl p-4 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-xs font-bold mb-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Top Customers</p>
                            <div className="space-y-2">
                                {topCustomers.slice(0, 5).map((customer, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-semibold">{customer.username}</p>
                                            <p className="text-[10px] text-slate-500">{customer.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-500">{formatINR(customer.totalSpent)}</p>
                                            <p className="text-[10px] text-slate-500">{customer.totalPurchases} purchases</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { name: 'Week', data: planBreakdown?.week, color: 'text-blue-400' },
                            { name: 'Month', data: planBreakdown?.month, color: 'text-green-400' },
                            { name: 'Season', data: planBreakdown?.season, color: 'text-yellow-400' }
                        ].map(plan => (
                            <div key={plan.name} className={`rounded-xl p-4 border text-center ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`text-lg font-black ${plan.color}`}>{plan.name}</p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm">Sales: <span className="font-bold">{plan.data?.sales || 0}</span></p>
                                    <p className="text-xs">Revenue: {formatINR(plan.data?.revenue || 0)}</p>
                                    <p className="text-xs">Profit: <span className="text-green-500">{formatINR(plan.data?.profit || 0)}</span></p>
                                    <p className="text-xs text-slate-500">Cost: {formatINR(plan.data?.cost || 0)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`rounded-xl p-4 border ${dark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                        <p className={`text-sm font-bold mb-2 ${dark ? 'text-purple-400' : 'text-purple-700'}`}>Summary</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Sales: <span className="font-bold">{statistics?.totalSales || 0}</span></div>
                            <div>Total Customers: <span className="font-bold">{statistics?.totalCustomers || 0}</span></div>
                            <div>Average Profit/Sale: <span className="font-bold text-green-500">{formatINR(statistics?.averageProfitPerSale || 0)}</span></div>
                            <div>ROI: <span className="font-bold text-green-500">{statistics?.roi || 0}%</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!topCustomers || topCustomers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No customers yet</div>
                    ) : (
                        topCustomers.map((customer, i) => (
                            <div key={i} className={`rounded-xl p-3 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">{customer.username}</p>
                                        <p className="text-[10px] text-slate-500">{customer.email}</p>
                                        <p className="text-[10px] text-slate-500">ID: {customer.userId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-green-500">{formatINR(customer.totalSpent)}</p>
                                        <p className="text-[10px] text-slate-500">{customer.totalPurchases} purchases</p>
                                        <p className="text-[10px] text-slate-500">Profit: {formatINR(customer.totalProfit)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!recentActivity || recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No activity yet</div>
                    ) : (
                        recentActivity.map((activity, i) => (
                            <div key={i} className={`rounded-xl p-3 border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <p className="font-bold text-sm capitalize">{activity.plan} Plan</p>
                                        <p className="text-[10px] text-slate-500">
                                            To: {activity.user?.username || 'Unknown'} ({activity.user?.email || 'No email'})
                                        </p>
                                        <p className="text-[10px] text-slate-500">{activity.days} days · {activity.creditsUsed} credits</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-500">{formatINR(activity.profit)} profit</p>
                                        <p className="text-[10px] text-slate-500">{formatINR(activity.customerPrice)} revenue</p>
                                        <p className="text-[10px] text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Modal>
    );
}

// ResellerCard Component
function ResellerCard({ reseller, onEdit, onDelete, onViewStats, dark }) {

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
                    {/* View Stats Button - NEW */}
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
// Main Admin Panel Component
export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');

    const [stats, setStats] = useState({
        total: 0, pro: 0, free: 0, withCredits: 0, today: 0,
        activeResellers: 0, totalResellers: 0, attacksToday: 0
    });
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('users');
    const [toasts, setToasts] = useState([]);

    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [userFilter, setUserFilter] = useState('all');
    // Add these with your other state declarations (around line where you have other useState hooks)
    const [showResellerStatsModal, setShowResellerStatsModal] = useState(false);
    const [selectedResellerForStats, setSelectedResellerForStats] = useState(null);

    // Resellers state
    const [resellers, setResellers] = useState([]);
    const [resellersLoading, setResellersLoading] = useState(false);
    const [resellersPage, setResellersPage] = useState(1);
    const [resellersTotalPages, setResellersTotalPages] = useState(1);
    const [resellerSearch, setResellerSearch] = useState('');


    // Modals
    const [editUserModal, setEditUserModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [addResellerModal, setAddResellerModal] = useState(false);
    const [editResellerModal, setEditResellerModal] = useState(null);
    const [deleteResellerConfirm, setDeleteResellerConfirm] = useState(null);

    const [userForm, setUserForm] = useState({
        username: '', email: '', credits: 0, password: '',
        hasPro: false, proPlan: 'month', proDays: 30, proAction: 'add'
    });

    const [resellerForm, setResellerForm] = useState({
        username: '', email: '', password: '', credits: 0, isBlocked: false
    });

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const getCsrfToken = useCallback(async () => {
        const res = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
        return res.data.csrfToken;
    }, []);

    const logout = useCallback(() => {
        setIsLoggedIn(false);
        setToken('');
        setUsers([]);
        setAdminSecret('');
        localStorage.removeItem('adminToken');
        toast('Logged out successfully');
    }, [toast]);

    const loadUsers = useCallback(async (tkn, query, page = 1, filter = 'all') => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: ITEMS_PER_PAGE,
                ...(query && { search: query }),
                ...(filter !== 'all' && { subscriptionType: filter })
            });
            const { data } = await axios.get(`${API_URL}/api/admin/users?${params}`, {
                headers: { 'x-admin-token': tkn }, withCredentials: true
            });
            setUsers(data.users || []);
            setUsersTotalPages(data.totalPages || 1);
            setUsersPage(page);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load users', 'error');
        } finally {
            setUsersLoading(false);
        }
    }, [logout, toast]);

    const loadResellers = useCallback(async (tkn, query = '', page = 1) => {
        setResellersLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: ITEMS_PER_PAGE,
                ...(query && { search: query })
            });
            const { data } = await axios.get(`${API_URL}/api/admin/resellers?${params}`, {
                headers: { 'x-admin-token': tkn }, withCredentials: true
            });
            setResellers(data.resellers || []);
            setResellersTotalPages(data.totalPages || 1);
            setResellersPage(page);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load resellers', 'error');
        } finally {
            setResellersLoading(false);
        }
    }, [logout, toast]);

    const loadStats = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
                headers: { 'x-admin-token': token }, withCredentials: true
            });
            setStats(data);
        } catch (err) {
            if (err.response?.status === 401) logout();
        }
    }, [token, logout]);

    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (!savedToken) return;
        setToken(savedToken);
        setIsLoggedIn(true);
        const init = async () => {
            try {
                const statsRes = await axios.get(`${API_URL}/api/admin/stats`, {
                    headers: { 'x-admin-token': savedToken }, withCredentials: true
                });
                setStats(statsRes.data);
                loadUsers(savedToken, '', 1, 'all');
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('adminToken');
                    setIsLoggedIn(false);
                    setToken('');
                }
            }
        };
        init();
    }, [loadUsers]);

    const doLogin = async () => {
        setLoginError('');
        if (!adminSecret) { setLoginError('Admin secret is required'); return; }
        setLoginLoading(true);
        try {
            const csrfRes = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
            const { data } = await axios.post(`${API_URL}/api/admin/session`,
                { secret: adminSecret },
                { withCredentials: true, headers: { 'X-CSRF-Token': csrfRes.data.csrfToken } }
            );
            setToken(data.token);
            setIsLoggedIn(true);
            setAdminSecret('');
            localStorage.setItem('adminToken', data.token);
            toast('Login successful!');
            const statsRes = await axios.get(`${API_URL}/api/admin/stats`, {
                headers: { 'x-admin-token': data.token }, withCredentials: true
            });
            setStats(statsRes.data);
            loadUsers(data.token, '', 1, 'all');
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed');
            toast(err.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoginLoading(false);
        }
    };

    const openEditUser = (user) => {
        setUserForm({
            username: user.username, email: user.email,
            credits: user.credits || 0, password: '',
            hasPro: user.isPro, proPlan: user.subscription?.plan || 'month',
            proDays: 30, proAction: 'add'
        });
        setEditUserModal(user);
    };

    const saveUser = async () => {
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const user = editUserModal;
            const basicPayload = {
                username: userForm.username, email: userForm.email,
                credits: Number(userForm.credits),
            };
            if (userForm.password) basicPayload.password = userForm.password;

            await axios.patch(`${API_URL}/api/admin/users/${user._id}`, basicPayload, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                withCredentials: true
            });

            if (userForm.hasPro && !user.isPro) {
                const proPayload = {
                    planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                    ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                };
                await axios.post(`${API_URL}/api/admin/users/${user._id}/give-pro`, proPayload, {
                    headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
                });
                toast(`✨ ${user.username} now has Pro access!`);
            } else if (!userForm.hasPro && user.isPro) {
                await axios.delete(`${API_URL}/api/admin/users/${user._id}/remove-pro`, {
                    headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
                });
                toast(`❌ Removed Pro status from ${user.username}`);
            } else if (userForm.hasPro && user.isPro) {
                if (userForm.proAction === 'extend') {
                    const proPayload = {
                        planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                        ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                    };
                    await axios.post(`${API_URL}/api/admin/users/${user._id}/extend-pro`, proPayload, {
                        headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
                    });
                    toast(`➕ Extended Pro for ${user.username}!`);
                } else if (userForm.proAction === 'replace') {
                    const proPayload = {
                        planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                        ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                    };
                    await axios.post(`${API_URL}/api/admin/users/${user._id}/replace-pro`, proPayload, {
                        headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
                    });
                    toast(`🔄 Replaced Pro plan for ${user.username}!`);
                }
            }

            toast('User updated successfully');
            setEditUserModal(null);
            loadUsers(token, searchQuery, usersPage, userFilter);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update user', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // ─── Reseller CRUD ────────────────────────────────────────
    const openAddReseller = () => {
        setResellerForm({ username: '', email: '', password: '', credits: 0, isBlocked: false });
        setAddResellerModal(true);
    };

    const openEditReseller = (reseller) => {
        setResellerForm({
            username: reseller.username, email: reseller.email,
            password: '', credits: reseller.credits || 0, isBlocked: reseller.isBlocked || false
        });
        setEditResellerModal(reseller);
    };

    const saveNewReseller = async () => {
        if (!resellerForm.username || !resellerForm.email || !resellerForm.password) {
            toast('Username, email and password are required', 'error');
            return;
        }
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            await axios.post(`${API_URL}/api/admin/resellers`, resellerForm, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
            });
            toast(`✅ Reseller ${resellerForm.username} created!`);
            setAddResellerModal(false);
            loadResellers(token, resellerSearch, 1);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to create reseller', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const saveEditReseller = async () => {
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const payload = {
                username: resellerForm.username, email: resellerForm.email,
                credits: Number(resellerForm.credits), isBlocked: resellerForm.isBlocked
            };
            if (resellerForm.password) payload.password = resellerForm.password;
            await axios.patch(`${API_URL}/api/admin/resellers/${editResellerModal._id}`, payload, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
            });
            toast('Reseller updated successfully');
            setEditResellerModal(null);
            loadResellers(token, resellerSearch, resellersPage);
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update reseller', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const doDeleteReseller = async () => {
        if (!deleteResellerConfirm) return;
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            await axios.delete(`${API_URL}/api/admin/resellers/${deleteResellerConfirm._id}`, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
            });
            toast(`Reseller ${deleteResellerConfirm.username} deleted`);
            setDeleteResellerConfirm(null);
            loadResellers(token, resellerSearch, resellersPage);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const confirmDelete = (user) => setDeleteConfirm(user);

    const doDelete = async () => {
        if (!deleteConfirm) return;
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            await axios.delete(`${API_URL}/api/admin/users/${deleteConfirm._id}`, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
            });
            toast(`User ${deleteConfirm.username} deleted successfully`);
            setDeleteConfirm(null);
            loadUsers(token, searchQuery, usersPage, userFilter);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // Reusable input style
    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    // Reseller form UI — called as a function (NOT as <Component />)
    // so React never unmounts/remounts it on re-render, keeping input focus intact
    const resellerFormBody = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>Username</label>
                    <input className={inputCls} value={resellerForm.username}
                        onChange={e => setResellerForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="reseller_name" />
                </div>
                <div>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} type="email" value={resellerForm.email}
                        onChange={e => setResellerForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="email@example.com" />
                </div>
            </div>

            <div>
                <label className={labelCls}>{editResellerModal ? 'New Password (optional)' : 'Password'}</label>
                <input className={inputCls} type="password" value={resellerForm.password}
                    onChange={e => setResellerForm(p => ({ ...p, password: e.target.value }))}
                    placeholder={editResellerModal ? 'Leave blank to keep' : 'Strong password'} />
            </div>

            {/* Credits Section */}
            <div className={`rounded-xl p-4 border ${dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <FaGem className="text-purple-500" size={14} />
                    <label className={`font-bold text-sm ${dark ? 'text-purple-400' : 'text-purple-700'}`}>Credits Balance</label>
                </div>
                <div className="flex gap-2">
                    <input className={inputCls} type="number" min="0" value={resellerForm.credits}
                        onChange={e => setResellerForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))}
                        placeholder="0" />
                    <button
                        onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 100 }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all shrink-0">
                        +100
                    </button>
                    <button
                        onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 1000 }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shrink-0">
                        +1K
                    </button>
                </div>
                <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                    💡 Resellers use credits to create Pro subscriptions for their customers.
                </p>
            </div>

            {/* Block Toggle (edit only) */}
            {editResellerModal && (
                <div className={`rounded-xl p-4 border ${dark ? 'border-red-500/20 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-bold text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>Block Reseller</p>
                            <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Blocked resellers cannot log in</p>
                        </div>
                        <div
                            className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${resellerForm.isBlocked ? 'bg-red-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                            onClick={() => setResellerForm(p => ({ ...p, isBlocked: !p.isBlocked }))}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${resellerForm.isBlocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-1">
                <button onClick={() => { setAddResellerModal(false); setEditResellerModal(null); }}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Cancel
                </button>
                <button
                    onClick={editResellerModal ? saveEditReseller : saveNewReseller}
                    disabled={modalLoading}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                    {editResellerModal ? 'Save Changes' : 'Create Reseller'}
                </button>
            </div>
        </div>
    );

    // ─── Login Screen ─────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
                <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                    {dark ? <MdWbSunny size={18} /> : <MdNightlight size={18} />}
                </button>
                <div className={`relative z-10 w-full max-w-md rounded-3xl border p-6 ${dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="" className="relative w-10 h-10 rounded-xl object-contain" />
                        </div>
                        <div>
                            <p className="text-red-500 font-bold tracking-[0.12em] text-sm">BATTLE-DESTROYER</p>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Panel</p>
                        </div>
                    </div>
                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>ADMIN LOGIN</h1>
                    <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Sign in with your admin secret</p>
                    {loginError && (
                        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-4">
                            <FaExclamationTriangle size={12} /> {loginError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Admin Secret</label>
                            <input type="password" className={inputCls}
                                placeholder="Your ADMIN_SECRET value" value={adminSecret}
                                onChange={e => setAdminSecret(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                        </div>
                        <button onClick={doLogin} disabled={loginLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                            {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaLock size={12} />}
                            {loginLoading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
                <Toast toasts={toasts} />
            </div>
        );
    }

    // ─── Main Panel ───────────────────────────────────────────
    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.3} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10 pb-20">
                {/* Navbar */}
                <header className={`sticky top-0 z-40 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/logo512.png" alt="" className="w-7 h-7 rounded-xl object-contain" />
                            <div className="hidden sm:block">
                                <p className="text-red-500 font-bold tracking-[0.12em] text-xs">BATTLE-DESTROYER</p>
                                <p className="text-[8px] text-slate-500">Admin Panel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={loadStats} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>↻</button>
                            <button onClick={toggleTheme} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={16} /> : <MdNightlight size={16} />}
                            </button>
                            <button onClick={logout} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dark ? 'bg-red-600/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                                <FaSignOutAlt size={10} /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total', value: stats.total, icon: '👥', color: 'text-red-500' },
                            { label: 'Pro', value: stats.pro, icon: '⭐', color: 'text-yellow-500' },
                            { label: 'Free', value: stats.free, icon: '💎', color: 'text-blue-500' },
                            { label: 'Today', value: stats.today, icon: '📅', color: 'text-green-500' },
                        ].map(stat => (
                            <div key={stat.label} className={`rounded-xl p-3 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                                    <span className="text-sm">{stat.icon}</span>
                                </div>
                                <p className={`text-xl font-black ${stat.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stat.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => { setCurrentTab('users'); setSearchQuery(''); setUserFilter('all'); loadUsers(token, '', 1, 'all'); }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex-1 sm:flex-none ${currentTab === 'users' ? 'bg-red-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            👥 Users
                        </button>
                        <button
                            onClick={() => { setCurrentTab('resellers'); loadResellers(token, '', 1); }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex-1 sm:flex-none ${currentTab === 'resellers' ? 'bg-red-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            🤝 Resellers
                        </button>
                    </div>

                    {/* ── USERS TAB ───────────────────────────────────────── */}
                    {currentTab === 'users' && (
                        <>
                            {/* Search & Filter */}
                            <div className={`rounded-xl p-4 border mb-4 ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} size={12} />
                                        <input type="text" placeholder="Search users..." value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && loadUsers(token, searchQuery, 1, userFilter)}
                                            className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                    </div>
                                    <button onClick={() => loadUsers(token, searchQuery, 1, userFilter)}
                                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all">
                                        Go
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider self-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Filter:</span>
                                    {['all', 'pro', 'free'].map(filter => (
                                        <button key={filter}
                                            onClick={() => { setUserFilter(filter); loadUsers(token, searchQuery, 1, filter); }}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${userFilter === filter ? 'bg-red-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                            {filter === 'all' ? 'All' : filter === 'pro' ? '⭐ Pro' : '💎 Free'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className={`text-center py-12 rounded-xl border ${dark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                                    <p className={dark ? 'text-slate-500' : 'text-slate-400'}>No users found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map(user => (
                                        <UserCard key={user._id} user={user} onEdit={openEditUser} onDelete={confirmDelete} dark={dark} />
                                    ))}
                                </div>
                            )}
                            <Pagination currentPage={usersPage} totalPages={usersTotalPages}
                                onPageChange={(page) => loadUsers(token, searchQuery, page, userFilter)} dark={dark} />
                        </>
                    )}

                    {/* ── RESELLERS TAB ────────────────────────────────────── */}
                    {currentTab === 'resellers' && (
                        <>
                            {/* Search + Add Button */}
                            <div className={`rounded-xl p-4 border mb-4 ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} size={12} />
                                        <input type="text" placeholder="Search resellers..." value={resellerSearch}
                                            onChange={e => setResellerSearch(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && loadResellers(token, resellerSearch, 1)}
                                            className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                    </div>
                                    <button onClick={() => loadResellers(token, resellerSearch, 1)}
                                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all">
                                        Go
                                    </button>
                                    <button onClick={openAddReseller}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shrink-0">
                                        <FaPlus size={10} />
                                        <span className="hidden sm:inline">Add Reseller</span>
                                        <span className="sm:hidden">Add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats row for resellers */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className={`rounded-xl p-3 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Resellers</p>
                                    <p className="text-xl font-black text-purple-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stats.totalResellers}</p>
                                </div>
                                <div className={`rounded-xl p-3 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Active</p>
                                    <p className="text-xl font-black text-green-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stats.activeResellers}</p>
                                </div>
                            </div>

                            {resellersLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : resellers.length === 0 ? (
                                <div className={`text-center py-12 rounded-xl border ${dark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                                    <FaUsers className="mx-auto mb-3 text-3xl opacity-30" />
                                    <p className={`mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No resellers yet</p>
                                    <button onClick={openAddReseller}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all">
                                        <FaPlus size={10} /> Add First Reseller
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {resellers.map(r => (
                                        <ResellerCard
                                            key={r._id}
                                            reseller={r}
                                            onEdit={openEditReseller}
                                            onDelete={setDeleteResellerConfirm}
                                            onViewStats={(reseller) => {
                                                setSelectedResellerForStats(reseller);
                                                setShowResellerStatsModal(true);
                                            }}
                                            dark={dark}
                                        />
                                    ))}
                                </div>
                            )}
                            <Pagination currentPage={resellersPage} totalPages={resellersTotalPages}
                                onPageChange={(page) => loadResellers(token, resellerSearch, page)} dark={dark} />
                        </>
                    )}
                </div>
            </div>

            {/* ── EDIT USER MODAL ─────────────────────────────────── */}
            {editUserModal && (
                <Modal title={`EDIT — ${editUserModal.username}`} onClose={() => setEditUserModal(null)} dark={dark} size="lg">
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Username</label>
                                <input className={inputCls} value={userForm.username}
                                    onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input className={inputCls} type="email" value={userForm.email}
                                    onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>

                        {/* Credits */}
                        <div className={`rounded-xl p-4 border ${dark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaGem className="text-blue-500" size={14} />
                                <label className={`font-bold text-sm ${dark ? 'text-blue-400' : 'text-blue-700'}`}>Credits Balance</label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Current Credits</label>
                                    <div className={`text-xl font-black ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {editUserModal.credits || 0}
                                    </div>
                                    {editUserModal.isPro && (
                                        <p className="text-[10px] mt-1 text-yellow-500">+30 daily attacks included</p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelCls}>Update Credits</label>
                                    <input className={inputCls} type="number" min="0" value={userForm.credits}
                                        onChange={e => setUserForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))} />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => setUserForm(p => ({ ...p, credits: p.credits + 10 }))}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all">
                                            +10
                                        </button>
                                        <button
                                            onClick={() => setUserForm(p => ({ ...p, credits: p.credits + 50 }))}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-all">
                                            +50
                                        </button>
                                        <button
                                            onClick={() => setUserForm(p => ({ ...p, credits: Math.max(0, p.credits - 10) }))}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">
                                            -10
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                💡 Credits are used for attacks (1 credit = 1 attack) for free users. Pro users get 30 free attacks daily.
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelCls}>New Password (optional)</label>
                            <input className={inputCls} type="password" placeholder="Leave blank to keep"
                                value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                        </div>

                        {/* Pro Subscription */}
                        <div className={`rounded-xl p-4 border ${dark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FaCrown className="text-yellow-500" size={14} />
                                    <label className={`font-bold text-sm ${dark ? 'text-yellow-400' : 'text-yellow-700'}`}>Pro Subscription</label>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {userForm.hasPro ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${userForm.hasPro ? 'bg-yellow-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                                        onClick={() => setUserForm(p => ({ ...p, hasPro: !p.hasPro, proAction: !p.hasPro ? 'add' : 'remove' }))}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${userForm.hasPro ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </label>
                            </div>

                            {/* Current status */}
                            {editUserModal.isPro && (
                                <div className={`mb-3 p-3 rounded-lg text-xs ${dark ? 'bg-white/5' : 'bg-white'}`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Current Plan:</span>
                                            <span className="ml-2 font-semibold text-yellow-500">{editUserModal.subscription?.plan || 'Pro'}</span>
                                        </div>
                                        <div>
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Days Left:</span>
                                            <span className="ml-2 font-mono">{editUserModal.subscriptionStatus?.daysLeft || 0} days</span>
                                        </div>
                                    </div>
                                    {editUserModal.subscription?.expiresAt && (
                                        <div className="mt-1">
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Expires:</span>
                                            <span className="ml-2">{new Date(editUserModal.subscription.expiresAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {userForm.hasPro && (
                                <div className="space-y-3">
                                    {/* Action (extend / replace) for existing pro */}
                                    {editUserModal.isPro && (
                                        <div className="flex gap-2">
                                            {['extend', 'replace'].map(action => (
                                                <button key={action}
                                                    onClick={() => setUserForm(p => ({ ...p, proAction: action }))}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${userForm.proAction === action
                                                        ? 'bg-yellow-500 text-white'
                                                        : dark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                                    {action === 'extend' ? '➕ Extend' : '🔄 Replace'}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Plan Selection — 4 options, season = 60 days */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'week', label: '7 Days', sub: 'Weekly' },
                                            { key: 'month', label: '30 Days', sub: 'Monthly' },
                                            { key: 'season', label: '60 Days', sub: 'Season' },
                                            { key: 'custom', label: 'Custom', sub: 'Set days' },
                                        ].map(plan => (
                                            <button key={plan.key}
                                                onClick={() => setUserForm(p => ({
                                                    ...p,
                                                    proPlan: plan.key,
                                                    proDays: plan.key === 'week' ? 7 : plan.key === 'month' ? 30 : plan.key === 'season' ? 60 : p.proDays
                                                }))}
                                                className={`p-2.5 rounded-lg border transition-all text-xs ${userForm.proPlan === plan.key
                                                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                                    : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                                <div className="font-bold">{plan.label}</div>
                                                <div className="text-[10px] mt-0.5 opacity-70">{plan.sub}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {userForm.proPlan === 'custom' && (
                                        <div>
                                            <label className={labelCls}>Number of Days</label>
                                            <input type="number" className={inputCls}
                                                min="1" max="365" value={userForm.proDays}
                                                onChange={e => setUserForm(p => ({ ...p, proDays: parseInt(e.target.value) || 30 }))} />
                                        </div>
                                    )}

                                    <p className={`text-xs text-center ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {!editUserModal.isPro && `✨ Give Pro access for ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 60 }[userForm.proPlan]} days`}
                                        {editUserModal.isPro && userForm.proAction === 'extend' && `➕ Add ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 60 }[userForm.proPlan]} days`}
                                        {editUserModal.isPro && userForm.proAction === 'replace' && `🔄 Replace with ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 60 }[userForm.proPlan]} day plan`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className={`rounded-xl p-4 border ${dark ? 'border-green-500/20 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <FaClock className="text-green-500" size={14} />
                                <label className={`font-bold text-sm ${dark ? 'text-green-400' : 'text-green-700'}`}>User Statistics</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Total Attacks</p>
                                    <p className={`text-lg font-black ${dark ? 'text-green-400' : 'text-green-600'}`}>
                                        {editUserModal.totalAttacks?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Member Since</p>
                                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                        {new Date(editUserModal.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1 pb-2">
                            <button onClick={() => setEditUserModal(null)}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Cancel
                            </button>
                            <button onClick={saveUser} disabled={modalLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                                Save All Changes
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── DELETE USER MODAL ──────────────────────────────── */}
            {deleteConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteConfirm(null)} dark={dark} size="sm">
                    <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <FaTrash className="text-red-400" size={18} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete user <span className="text-red-400">"{deleteConfirm.username}"</span>?
                        </p>
                        <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                Cancel
                            </button>
                            <button onClick={doDelete} disabled={modalLoading}
                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {modalLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaTrash size={10} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── ADD RESELLER MODAL ─────────────────────────────── */}
            {addResellerModal && (
                <Modal title="ADD RESELLER" onClose={() => setAddResellerModal(false)} dark={dark} size="md">
                    {resellerFormBody()}
                </Modal>
            )}

            {/* ── EDIT RESELLER MODAL ────────────────────────────── */}
            {editResellerModal && (
                <Modal title={`EDIT — ${editResellerModal.username}`} onClose={() => setEditResellerModal(null)} dark={dark} size="md">
                    {resellerFormBody()}
                </Modal>
            )}

            {/* ── DELETE RESELLER MODAL ──────────────────────────── */}
            {deleteResellerConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteResellerConfirm(null)} dark={dark} size="sm">
                    <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <FaTrash className="text-red-400" size={18} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete reseller <span className="text-red-400">"{deleteResellerConfirm.username}"</span>?
                        </p>
                        <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteResellerConfirm(null)}
                                className={`flex-1 py-2 rounded-xl font-semibold text-sm ${dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                Cancel
                            </button>
                            <button onClick={doDeleteReseller} disabled={modalLoading}
                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {modalLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaTrash size={10} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showResellerStatsModal && selectedResellerForStats && (
                <ResellerDetailModal
                    reseller={selectedResellerForStats}
                    dark={dark}
                    onClose={() => {
                        setShowResellerStatsModal(false);
                        setSelectedResellerForStats(null);
                    }}
                />
            )}

            <Toast toasts={toasts} />
        </div>
    );
}