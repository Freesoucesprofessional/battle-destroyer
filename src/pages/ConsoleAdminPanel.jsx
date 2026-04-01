// AdminPanel.js - Fully Responsive with Single Edit Button
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaSearch, FaSignOutAlt, FaLock, FaCheckCircle, FaExclamationTriangle,
    FaEdit, FaTrash, FaTimes, FaSave, FaChevronLeft, FaChevronRight,
    FaCrown, FaGem, FaClock, FaUsers, FaUser,
    FaStar, FaCalendarAlt,FaBullseye  
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 20; // Reduced for better mobile performance

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

// Modal Component - Responsive
function Modal({ title, onClose, children, dark, size = 'md' }) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`relative w-full ${sizeClasses[size]} rounded-2xl border p-5 shadow-2xl max-h-[90vh] overflow-y-auto
                ${dark ? 'bg-surface-800 border-white/[0.1] backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit pb-2">
                    <h2 className={`font-black text-base ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                        {title}
                    </h2>
                    <button onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                            ${dark ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        <FaTimes size={12} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Pagination Component - Mobile Friendly
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

// Updated UserCard Component - Shows credits for all users
function UserCard({ user, onEdit, onDelete, dark }) {
    const isPro = user.isPro;
    const daysLeft = user.subscriptionStatus?.daysLeft || 0;
    const isExpiringSoon = isPro && daysLeft <= 7 && daysLeft > 0;
    const remainingAttacks = isPro ? user.subscription?.dailyCredits || 30 : user.credits || 0;

    return (
        <div className={`rounded-xl border p-4 transition-all ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
            {/* User Header */}
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
                <div className="flex items-center gap-1">
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

            {/* User Stats - Show credits for all users */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Credits Card - Show for ALL users */}
                <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <FaGem className={isPro ? 'text-yellow-500' : 'text-blue-500'} size={10} />
                        <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Credits Balance
                        </span>
                    </div>
                    <p className={`text-lg font-black ${isPro ? 'text-yellow-500' : 'text-blue-500'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {user.credits || 0}
                    </p>
                    {isPro && (
                        <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                            +30 daily attacks
                        </p>
                    )}
                </div>

                {/* Attacks/Subscription Card */}
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
                    {isPro && (
                        <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Resets daily
                        </p>
                    )}
                </div>
            </div>

            {/* Third Row - Subscription Info for Pro, Joined Date for Free */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                {isPro ? (
                    <>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaCalendarAlt className="text-purple-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Plan
                                </span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {user.subscription?.plan || 'Pro'} · {user.subscription?.expiresAt ? `${daysLeft}d left` : 'Active'}
                            </p>
                            {isExpiringSoon && (
                                <p className="text-[10px] text-yellow-500 mt-0.5">⚠️ Expiring soon!</p>
                            )}
                        </div>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaClock className="text-green-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Total Attacks
                                </span>
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
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Joined
                                </span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className={`rounded-lg p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaClock className="text-green-500" size={10} />
                                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Total Attacks
                                </span>
                            </div>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {user.totalAttacks?.toLocaleString() || 0}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Status Badge */}
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

// Main Admin Panel Component
export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');

    // Panel state
    const [stats, setStats] = useState({
        total: 0, pro: 0, free: 0, withCredits: 0, today: 0,
        activeResellers: 0, totalResellers: 0, attacksToday: 0
    });
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('users');
    const [toasts, setToasts] = useState([]);

    // Pagination & Filter
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [userFilter, setUserFilter] = useState('all');

    // Modal state
    const [editUserModal, setEditUserModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Edit form
    const [userForm, setUserForm] = useState({
        username: '',
        email: '',
        credits: 0,
        password: '',
        hasPro: false,
        proPlan: 'month',
        proDays: 30,
        proAction: 'add' // 'add', 'extend', 'remove'
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
                page,
                limit: ITEMS_PER_PAGE,
                ...(query && { search: query }),
                ...(filter !== 'all' && { subscriptionType: filter })
            });

            const { data } = await axios.get(`${API_URL}/api/admin/users?${params}`, {
                headers: { 'x-admin-token': tkn },
                withCredentials: true
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
                const [statsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-token': savedToken }, withCredentials: true }),
                ]);
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
            const [statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-token': data.token }, withCredentials: true }),
            ]);
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
            username: user.username,
            email: user.email,
            credits: user.credits || 0,
            password: '',
            hasPro: user.isPro,
            proPlan: user.subscription?.plan || 'month',
            proDays: 30,
            proAction: 'add'
        });
        setEditUserModal(user);
    };

    const saveUser = async () => {
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const user = editUserModal;

            // 1. Update basic info
            const basicPayload = {
                username: userForm.username,
                email: userForm.email,
                credits: Number(userForm.credits),
            };
            if (userForm.password) basicPayload.password = userForm.password;

            await axios.patch(`${API_URL}/api/admin/users/${user._id}`, basicPayload, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                withCredentials: true
            });

            // 2. Handle Pro subscription changes
            if (userForm.hasPro && !user.isPro) {
                // Give Pro
                const proPayload = {
                    planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                    ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                };
                await axios.post(`${API_URL}/api/admin/users/${user._id}/give-pro`, proPayload, {
                    headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                    withCredentials: true
                });
                toast(`✨ ${user.username} now has Pro access!`);
            } else if (!userForm.hasPro && user.isPro) {
                // Remove Pro
                await axios.delete(`${API_URL}/api/admin/users/${user._id}/remove-pro`, {
                    headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                    withCredentials: true
                });
                toast(`❌ Removed Pro status from ${user.username}`);
            } else if (userForm.hasPro && user.isPro) {
                if (userForm.proAction === 'extend') {
                    // Extend Pro
                    const proPayload = {
                        planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                        ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                    };
                    await axios.post(`${API_URL}/api/admin/users/${user._id}/extend-pro`, proPayload, {
                        headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                        withCredentials: true
                    });
                    toast(`➕ Extended Pro for ${user.username}!`);
                } else if (userForm.proAction === 'replace') {
                    // Replace Pro
                    const proPayload = {
                        planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                        ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                    };
                    await axios.post(`${API_URL}/api/admin/users/${user._id}/replace-pro`, proPayload, {
                        headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                        withCredentials: true
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

    const confirmDelete = (user) => setDeleteConfirm(user);

    const doDelete = async () => {
        if (!deleteConfirm) return;
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            await axios.delete(`${API_URL}/api/admin/users/${deleteConfirm._id}`, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken },
                withCredentials: true
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

    // Login Screen
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
                            <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Admin Secret</label>
                            <input type="password" className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                placeholder="Your ADMIN_SECRET value" value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
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

    // Main Panel
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
                            <button onClick={loadStats} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                                ↻
                            </button>
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
                    {/* Stats Cards - Mobile Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total', value: stats.total, icon: '👥', color: 'text-red-500' },
                            { label: 'Pro', value: stats.pro, icon: '⭐', color: 'text-yellow-500' },
                            { label: 'Free', value: stats.free, icon: '💎', color: 'text-blue-500' },
                            { label: 'Today', value: stats.today, icon: '📅', color: 'text-green-500' },
                        ].map(stat => (
                            <div key={stat.label} className={`rounded-xl p-3 border transition-all ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
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
                        <button onClick={() => { setCurrentTab('users'); setSearchQuery(''); setUserFilter('all'); loadUsers(token, '', 1, 'all'); }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex-1 sm:flex-none ${currentTab === 'users'
                                ? 'bg-red-600 text-white'
                                : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            👥 Users
                        </button>
                        <button onClick={() => setCurrentTab('resellers')}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex-1 sm:flex-none ${currentTab === 'resellers'
                                ? 'bg-red-600 text-white'
                                : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            🤝 Resellers
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className={`rounded-xl p-4 border mb-4 transition-all ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
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

                        {/* Filter Buttons */}
                        <div className="flex gap-2 mt-3">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider self-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Filter:</span>
                            {['all', 'pro', 'free'].map(filter => (
                                <button key={filter}
                                    onClick={() => { setUserFilter(filter); loadUsers(token, searchQuery, 1, filter); }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${userFilter === filter
                                        ? 'bg-red-600 text-white'
                                        : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                    {filter === 'all' ? 'All' : filter === 'pro' ? '⭐ Pro' : '💎 Free'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Users List - Card View (Mobile First) */}
                    {currentTab === 'users' && (
                        <>
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

                    {/* Resellers Section (Simplified) */}
                    {currentTab === 'resellers' && (
                        <div className={`rounded-xl p-6 border text-center ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200'}`}>
                            <FaUsers className="mx-auto mb-3 text-3xl opacity-50" />
                            <p className={dark ? 'text-slate-400' : 'text-slate-500'}>Reseller management coming soon</p>
                        </div>
                    )}
                </div>
            </div>

            {editUserModal && (
                <Modal title={`EDIT USER - ${editUserModal.username}`} onClose={() => setEditUserModal(null)} dark={dark} size="lg">
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Username</label>
                                <input className={`w-full rounded-xl px-3 py-2 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    value={userForm.username} onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Email</label>
                                <input className={`w-full rounded-xl px-3 py-2 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>

                        {/* Credits Section - Show for ALL users */}
                        <div className={`rounded-xl p-4 border ${dark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaGem className="text-blue-500" size={14} />
                                <label className={`font-bold text-sm ${dark ? 'text-blue-400' : 'text-blue-700'}`}>Credits Balance</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Current Credits</label>
                                    <div className={`text-xl font-black ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {editUserModal.credits || 0}
                                    </div>
                                    {editUserModal.isPro && (
                                        <p className="text-[10px] mt-1 text-yellow-500">+30 daily attacks included</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Update Credits</label>
                                    <div className="flex gap-2">
                                        <input className={`flex-1 rounded-xl px-3 py-2 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            type="number" min="0" value={userForm.credits}
                                            onChange={e => setUserForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))}
                                            placeholder="New credit amount" />
                                        <button
                                            onClick={() => {
                                                const amount = parseInt(prompt('Enter amount to add:', '10'));
                                                if (amount && amount > 0) {
                                                    setUserForm(p => ({ ...p, credits: (p.credits || 0) + amount }));
                                                }
                                            }}
                                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all">
                                            + Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                const amount = parseInt(prompt('Enter amount to remove:', '10'));
                                                if (amount && amount > 0) {
                                                    setUserForm(p => ({ ...p, credits: Math.max(0, (p.credits || 0) - amount) }));
                                                }
                                            }}
                                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">
                                            - Remove
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
                            <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">New Password (optional)</label>
                            <input className={`w-full rounded-xl px-3 py-2 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                type="password" placeholder="Leave blank to keep" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                        </div>

                        {/* Pro Subscription Section */}
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

                            {/* Current Pro Status Display */}
                            {editUserModal.isPro && (
                                <div className={`mb-3 p-2 rounded-lg ${dark ? 'bg-white/5' : 'bg-white'} text-xs`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Current Plan:</span>
                                            <span className="ml-2 font-semibold text-yellow-500">{editUserModal.subscription?.plan || 'Pro'}</span>
                                        </div>
                                        <div>
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Days Left:</span>
                                            <span className="ml-2 font-mono">
                                                {editUserModal.subscriptionStatus?.daysLeft || 0} days
                                            </span>
                                        </div>
                                    </div>
                                    {editUserModal.subscription?.expiresAt && (
                                        <div className="mt-1">
                                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Expires:</span>
                                            <span className="ml-2 text-xs">
                                                {new Date(editUserModal.subscription.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pro Settings */}
                            {userForm.hasPro && (
                                <div className="space-y-3">
                                    {/* Action Selection (for existing Pro users) */}
                                    {editUserModal.isPro && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setUserForm(p => ({ ...p, proAction: 'extend' }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${userForm.proAction === 'extend'
                                                    ? 'bg-yellow-500 text-white'
                                                    : dark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                                ➕ Extend
                                            </button>
                                            <button onClick={() => setUserForm(p => ({ ...p, proAction: 'replace' }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${userForm.proAction === 'replace'
                                                    ? 'bg-yellow-500 text-white'
                                                    : dark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                                🔄 Replace
                                            </button>
                                        </div>
                                    )}

                                    {/* Plan Selection */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setUserForm(p => ({ ...p, proPlan: 'week', proDays: 7 }))}
                                            className={`p-2 rounded-lg border transition-all text-xs ${userForm.proPlan === 'week'
                                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                                : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                            <div className="font-bold">7 Days</div>
                                            <div className="text-[10px]">Weekly</div>
                                        </button>
                                        <button onClick={() => setUserForm(p => ({ ...p, proPlan: 'month', proDays: 30 }))}
                                            className={`p-2 rounded-lg border transition-all text-xs ${userForm.proPlan === 'month'
                                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                                : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                            <div className="font-bold">30 Days</div>
                                            <div className="text-[10px]">Monthly</div>
                                        </button>
                                        <button onClick={() => setUserForm(p => ({ ...p, proPlan: 'season', proDays: 90 }))}
                                            className={`p-2 rounded-lg border transition-all text-xs ${userForm.proPlan === 'season'
                                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                                : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                            <div className="font-bold">90 Days</div>
                                            <div className="text-[10px]">Season</div>
                                        </button>
                                        <button onClick={() => setUserForm(p => ({ ...p, proPlan: 'custom' }))}
                                            className={`p-2 rounded-lg border transition-all text-xs ${userForm.proPlan === 'custom'
                                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                                : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                            <div className="font-bold">Custom</div>
                                            <div className="text-[10px]">Set days</div>
                                        </button>
                                    </div>

                                    {userForm.proPlan === 'custom' && (
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500">Number of Days</label>
                                            <input type="number" className={`w-full rounded-xl px-3 py-2 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                                min="1" max="365" value={userForm.proDays}
                                                onChange={e => setUserForm(p => ({ ...p, proDays: parseInt(e.target.value) || 30 }))} />
                                        </div>
                                    )}

                                    <div className={`text-xs text-center ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {!editUserModal.isPro && `✨ Give Pro access for ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 90 }[userForm.proPlan]} days`}
                                        {editUserModal.isPro && userForm.proAction === 'extend' && `➕ Add ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 90 }[userForm.proPlan]} days to existing subscription`}
                                        {editUserModal.isPro && userForm.proAction === 'replace' && `🔄 Replace current plan with ${userForm.proPlan === 'custom' ? userForm.proDays : { week: 7, month: 30, season: 90 }[userForm.proPlan]} day plan`}
                                        {editUserModal.isPro && !userForm.hasPro && `❌ Remove Pro subscription`}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats Summary */}
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

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
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

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteConfirm(null)} dark={dark} size="sm">
                    <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <FaTrash className="text-red-400" size={18} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete user <span className="text-red-400">"{deleteConfirm.username}"</span>?
                        </p>
                        <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            This action cannot be undone.
                        </p>
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

            <Toast toasts={toasts} />
        </div>
    );
}