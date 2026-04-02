import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ResellerDetailModal({ reseller, dark, onClose }) {
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

    const formatINR  = (num)  => `₹${(num || 0).toLocaleString()}`;
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
                            : dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Sales',   value: statistics.totalSales,              color: 'text-green-500' },
                            { label: 'Total Revenue', value: formatINR(statistics.totalRevenue),  color: 'text-green-500' },
                            { label: 'Total Profit',  value: formatINR(statistics.totalProfit),   color: 'text-green-500' },
                            { label: 'ROI',           value: `${statistics.roi}%`,               color: 'text-green-500' },
                        ].map(m => (
                            <div key={m.label} className={`rounded-xl p-3 text-center border ${dark ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`text-[10px] uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{m.label}</p>
                                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                            </div>
                        ))}
                    </div>

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
                            { name: 'Week',   data: planBreakdown?.week,   color: 'text-blue-400'   },
                            { name: 'Month',  data: planBreakdown?.month,  color: 'text-green-400'  },
                            { name: 'Season', data: planBreakdown?.season, color: 'text-yellow-400' },
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
                            <div>Avg Profit/Sale: <span className="font-bold text-green-500">{formatINR(statistics?.averageProfitPerSale || 0)}</span></div>
                            <div>ROI: <span className="font-bold text-green-500">{statistics?.roi || 0}%</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!topCustomers?.length ? (
                        <div className="text-center py-8 text-slate-500">No customers yet</div>
                    ) : topCustomers.map((customer, i) => (
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
                    ))}
                </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!recentActivity?.length ? (
                        <div className="text-center py-8 text-slate-500">No activity yet</div>
                    ) : recentActivity.map((activity, i) => (
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
                    ))}
                </div>
            )}
        </Modal>
    );
}