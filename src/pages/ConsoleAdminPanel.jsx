import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    FaSearch, FaSignOutAlt, FaLock, FaCheckCircle, FaExclamationTriangle,
    FaEdit, FaTrash, FaPlus, FaTimes, FaSave, FaUserShield
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-xl
                    ${t.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {t.type === 'success' ? <FaCheckCircle size={14} /> : <FaExclamationTriangle size={14} />}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ── Modal Component ──
function Modal({ title, onClose, children, dark }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl
                ${dark ? 'bg-surface-800 border-white/[0.1] backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className={`font-black text-lg ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                        {title}
                    </h2>
                    <button onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                            ${dark ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        <FaTimes size={13} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');

    // Panel state
    const [stats, setStats] = useState({ total: 0, pro: 0, withCredits: 0, today: 0, activeResellers: 0, totalResellers: 0 });
    const [users, setUsers] = useState([]);
    const [resellers, setResellers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [resellersLoading, setResellersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('users');
    const [toasts, setToasts] = useState([]);

    // Modal state
    const [editUserModal, setEditUserModal] = useState(null);       // user object
    const [editResellerModal, setEditResellerModal] = useState(null); // reseller object or 'new'
    const [deleteConfirm, setDeleteConfirm] = useState(null);       // { type, id, name }
    const [modalLoading, setModalLoading] = useState(false);

    // Edit forms
    const [userForm, setUserForm] = useState({});
    const [resellerForm, setResellerForm] = useState({});

    const loginRef = useRef(null);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    // ── Restore session from localStorage on mount ──
    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (!savedToken) return;
        setToken(savedToken);
        setIsLoggedIn(true);
        const init = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-token': savedToken }, withCredentials: true }),
                    axios.get(`${API_URL}/api/admin/users`, { headers: { 'x-admin-token': savedToken }, withCredentials: true }),
                ]);
                setStats(statsRes.data);
                setUsers(usersRes.data.users || []);
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('adminToken');
                    setIsLoggedIn(false);
                    setToken('');
                }
            }
        };
        init();
    }, []);

    const getCsrfToken = useCallback(async () => {
        const res = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
        return res.data.csrfToken;
    }, []);

    const logout = useCallback(() => {
        setIsLoggedIn(false);
        setToken('');
        setUsers([]);
        setResellers([]);
        setAdminSecret('');
        localStorage.removeItem('adminToken');
        toast('Logged out successfully');
    }, [toast]);

    const loadUsers = useCallback(async (tkn, query) => {
        const t = tkn ?? token;
        const q = query ?? searchQuery;
        setUsersLoading(true);
        try {
            const url = q
                ? `${API_URL}/api/admin/users?search=${encodeURIComponent(q)}`
                : `${API_URL}/api/admin/users`;
            const { data } = await axios.get(url, { headers: { 'x-admin-token': t }, withCredentials: true });
            setUsers(data.users || []);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load users', 'error');
        } finally {
            setUsersLoading(false);
        }
    }, [token, searchQuery, toast, logout]);

    const loadResellers = useCallback(async (tkn, query) => {
        const t = tkn ?? token;
        const q = query ?? searchQuery;
        setResellersLoading(true);
        try {
            const url = q
                ? `${API_URL}/api/admin/resellers?search=${encodeURIComponent(q)}`
                : `${API_URL}/api/admin/resellers`;
            const { data } = await axios.get(url, { headers: { 'x-admin-token': t }, withCredentials: true });
            setResellers(data.resellers || []);
        } catch (err) {
            if (err.response?.status === 401) logout();
            else toast(err.response?.data?.message || 'Failed to load resellers', 'error');
        } finally {
            setResellersLoading(false);
        }
    }, [token, searchQuery, toast, logout]);

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
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-token': data.token }, withCredentials: true }),
                axios.get(`${API_URL}/api/admin/users`, { headers: { 'x-admin-token': data.token }, withCredentials: true }),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed');
            toast(err.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoginLoading(false);
        }
    };

    // ── Edit User ──
    const openEditUser = (user) => {
        setUserForm({
            username: user.username,
            email: user.email,
            credits: user.credits || 0,
            isPro: user.isPro || false,
            password: '',
        });
        setEditUserModal(user);
    };

    const saveUser = async () => {
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken(); // ← add this

            const payload = {
                username: userForm.username,
                email: userForm.email,
                credits: Number(userForm.credits),
                isPro: userForm.isPro,
            };
            if (userForm.password) payload.password = userForm.password;

            await axios.patch(`${API_URL}/api/admin/users/${editUserModal._id}`, payload, {
                headers: {
                    'x-admin-token': token,
                    'X-CSRF-Token': csrfToken  // ← add this
                },
                withCredentials: true
            });
            toast('User updated successfully');
            setEditUserModal(null);
            loadUsers();
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update user', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // ── Add / Edit Reseller ──
    const openAddReseller = () => {
        setResellerForm({ username: '', email: '', password: '', credits: 0 });
        setEditResellerModal('new');
    };

    const openEditReseller = (reseller) => {
        setResellerForm({
            username: reseller.username,
            email: reseller.email,
            credits: reseller.credits || 0,
            isBlocked: reseller.isBlocked || false,
            password: '',
        });
        setEditResellerModal(reseller);
    };

    const saveReseller = async () => {
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken(); // ← add this

            if (editResellerModal === 'new') {
                const payload = {
                    username: resellerForm.username,
                    email: resellerForm.email,
                    password: resellerForm.password,
                    credits: Number(resellerForm.credits),
                };
                await axios.post(`${API_URL}/api/admin/resellers`, payload, {
                    headers: {
                        'x-admin-token': token,
                        'X-CSRF-Token': csrfToken  // ← add this
                    },
                    withCredentials: true
                });
                toast('Reseller created successfully');
            } else {
                const payload = {
                    username: resellerForm.username,
                    email: resellerForm.email,
                    credits: Number(resellerForm.credits),
                    isBlocked: resellerForm.isBlocked,
                };
                if (resellerForm.password) payload.password = resellerForm.password;

                await axios.patch(`${API_URL}/api/admin/resellers/${editResellerModal._id}`, payload, {
                    headers: {
                        'x-admin-token': token,
                        'X-CSRF-Token': csrfToken  // ← add this
                    },
                    withCredentials: true
                });
                toast('Reseller updated successfully');
            }
            setEditResellerModal(null);
            loadResellers();
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to save reseller', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // ── Delete ──
    const confirmDelete = (type, id, name) => setDeleteConfirm({ type, id, name });

    const doDelete = async () => {
        if (!deleteConfirm) return;
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken(); // ← add this

            const url = deleteConfirm.type === 'user'
                ? `${API_URL}/api/admin/users/${deleteConfirm.id}`
                : `${API_URL}/api/admin/resellers/${deleteConfirm.id}`;

            await axios.delete(url, {
                headers: {
                    'x-admin-token': token,
                    'X-CSRF-Token': csrfToken  // ← add this
                },
                withCredentials: true
            });
            toast(`${deleteConfirm.type === 'user' ? 'User' : 'Reseller'} deleted successfully`);
            setDeleteConfirm(null);
            if (deleteConfirm.type === 'user') loadUsers();
            else loadResellers();
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'}`;

    const modalInputCls = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'}`;

    const labelCls = `block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`;

    // ── LOGIN SCREEN ──
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <AnimatedBackground intensity={0.5} />
                <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
                <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                    {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                </button>
                <div ref={loginRef} className={`relative z-10 w-full max-w-md rounded-3xl border p-8 ${dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                            <img src="/logo512.png" alt="" className="relative w-9 h-9 rounded-xl object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                        </div>
                        <div>
                            <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Panel</p>
                        </div>
                    </div>
                    <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>ADMIN LOGIN</h1>
                    <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Sign in with your admin secret</p>
                    {loginError && (
                        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-4">
                            <FaExclamationTriangle size={13} /> {loginError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Admin Secret</label>
                            <input type="password" className={inputCls} placeholder="Your ADMIN_SECRET value"
                                value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                        </div>
                        <button onClick={doLogin} disabled={loginLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                            {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaLock size={14} />}
                            {loginLoading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
                <Toast toasts={toasts} />
            </div>
        );
    }

    // ── MAIN PANEL ──
    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.3} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10">
                {/* Navbar */}
                <header className={`sticky top-0 z-40 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600/30 rounded-lg blur-md" />
                                <img src="/logo512.png" alt="" className="relative w-8 h-8 rounded-xl object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.5))' }} />
                            </div>
                            <div>
                                <p className="text-red-500 font-bold tracking-[0.12em] text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BATTLE-DESTROYER</p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Panel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={loadStats} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${dark ? 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                                ↻ Refresh
                            </button>
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            <button onClick={logout} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-red-600/10 hover:bg-red-600 border border-red-600/25 text-red-400 hover:text-white' : 'bg-red-50 hover:bg-red-600 border border-red-200 text-red-500 hover:text-white'}`}>
                                <FaSignOutAlt size={13} /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                        {[
                            { label: 'Total Users', value: stats.total, color: 'text-red-500' },
                            { label: 'Pro Users', value: stats.pro, color: 'text-green-400' },
                            { label: 'Have Credits', value: stats.withCredits, color: 'text-blue-400' },
                            { label: 'Today', value: stats.today, color: 'text-yellow-400' },
                            { label: 'Active Resellers', value: stats.activeResellers, color: 'text-purple-400' },
                            { label: 'Total Resellers', value: stats.totalResellers, color: 'text-cyan-400' },
                        ].map(stat => (
                            <div key={stat.label} className={`rounded-2xl p-5 border transition-all ${cardCls}`}>
                                <p className={`text-xs font-semibold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs + Add Reseller button */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="flex gap-2">
                            {[
                                { id: 'users', label: '👥 Users' },
                                { id: 'resellers', label: '🤝 Resellers' },
                            ].map(tab => (
                                <button key={tab.id}
                                    onClick={() => {
                                        setCurrentTab(tab.id);
                                        setSearchQuery('');
                                        if (tab.id === 'resellers') loadResellers(token, '');
                                        else loadUsers(token, '');
                                    }}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${currentTab === tab.id
                                        ? 'bg-red-600 text-white'
                                        : dark ? 'bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]'
                                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {currentTab === 'resellers' && (
                            <button onClick={openAddReseller}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                <FaPlus size={12} /> Add Reseller
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className={`rounded-2xl p-5 border mb-6 transition-all flex gap-3 ${cardCls}`}>
                        <div className="flex-1 relative">
                            <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} size={14} />
                            <input type="text"
                                placeholder={currentTab === 'users' ? 'Search users by name, email, ID...' : 'Search resellers by name, email...'}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (currentTab === 'users' ? loadUsers() : loadResellers())}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition ${dark
                                    ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-red-500/50'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-500'}`}
                            />
                        </div>
                        <button onClick={() => currentTab === 'users' ? loadUsers() : loadResellers()}
                            className="px-4 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all">
                            Search
                        </button>
                    </div>

                    {/* ── Users Table ── */}
                    {currentTab === 'users' && (
                        <div className={`rounded-2xl border overflow-hidden transition-all ${cardCls}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={dark ? 'bg-white/[0.02] border-b border-white/[0.06]' : 'bg-slate-50 border-b border-slate-200'}>
                                            {['Username', 'Email', 'Credits', 'Status', 'Joined', 'Actions'].map(h => (
                                                <th key={h} className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersLoading ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Loading...</span>
                                                </div>
                                            </td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan={6} className={`px-6 py-8 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>No users found</td></tr>
                                        ) : (
                                            users.map(user => (
                                                <tr key={user._id} className={`border-t ${dark ? 'border-white/[0.06] hover:bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50'} transition`}>
                                                    <td className={`px-5 py-4 font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{user.username}</td>
                                                    <td className={`px-5 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{user.email}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                                            💎 {user.credits || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${user.isPro
                                                            ? (dark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600')
                                                            : (dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                                                            {user.isPro ? '⭐ Pro' : 'Free'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-5 py-4 text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => openEditUser(user)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                                                                title="Edit user">
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button onClick={() => confirmDelete('user', user._id, user.username)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                                                                title="Delete user">
                                                                <FaTrash size={11} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Resellers Table ── */}
                    {currentTab === 'resellers' && (
                        <div className={`rounded-2xl border overflow-hidden transition-all ${cardCls}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={dark ? 'bg-white/[0.02] border-b border-white/[0.06]' : 'bg-slate-50 border-b border-slate-200'}>
                                            {['Username', 'Email', 'Credits', 'Given', 'Status', 'Last Login', 'Actions'].map(h => (
                                                <th key={h} className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resellersLoading ? (
                                            <tr><td colSpan={7} className="px-6 py-8 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Loading...</span>
                                                </div>
                                            </td></tr>
                                        ) : resellers.length === 0 ? (
                                            <tr><td colSpan={7} className={`px-6 py-8 text-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>No resellers found</td></tr>
                                        ) : (
                                            resellers.map(reseller => (
                                                <tr key={reseller._id} className={`border-t ${dark ? 'border-white/[0.06] hover:bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50'} transition`}>
                                                    <td className={`px-5 py-4 font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{reseller.username}</td>
                                                    <td className={`px-5 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{reseller.email}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                                            💎 {reseller.credits || 0}
                                                        </span>
                                                    </td>
                                                    <td className={`px-5 py-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>💸 {reseller.totalGiven || 0}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${reseller.isBlocked
                                                            ? (dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                                                            : (dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600')}`}>
                                                            {reseller.isBlocked ? '🔒 Blocked' : '✅ Active'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-5 py-4 text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        {reseller.lastLogin ? new Date(reseller.lastLogin).toLocaleDateString() : 'Never'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => openEditReseller(reseller)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                                                                title="Edit reseller">
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button onClick={() => confirmDelete('reseller', reseller._id, reseller.username)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                                                                title="Delete reseller">
                                                                <FaTrash size={11} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit User Modal ── */}
            {editUserModal && (
                <Modal title="EDIT USER" onClose={() => setEditUserModal(null)} dark={dark}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Username</label>
                                <input className={modalInputCls} value={userForm.username}
                                    onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input className={modalInputCls} type="email" value={userForm.email}
                                    onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Credits</label>
                                <input className={modalInputCls} type="number" min="0" value={userForm.credits}
                                    onChange={e => setUserForm(p => ({ ...p, credits: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>New Password (optional)</label>
                                <input className={modalInputCls} type="password" placeholder="Leave blank to keep"
                                    value={userForm.password}
                                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className={`flex items-center gap-2.5 cursor-pointer select-none text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <div className={`relative w-10 h-5 rounded-full transition-colors ${userForm.isPro ? 'bg-yellow-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                                    onClick={() => setUserForm(p => ({ ...p, isPro: !p.isPro }))}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${userForm.isPro ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </div>
                                Pro Status {userForm.isPro ? '⭐' : ''}
                            </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditUserModal(null)}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Cancel
                            </button>
                            <button onClick={saveUser} disabled={modalLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={13} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Add / Edit Reseller Modal ── */}
            {editResellerModal && (
                <Modal
                    title={editResellerModal === 'new' ? 'ADD RESELLER' : 'EDIT RESELLER'}
                    onClose={() => setEditResellerModal(null)}
                    dark={dark}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Username</label>
                                <input className={modalInputCls} value={resellerForm.username}
                                    onChange={e => setResellerForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input className={modalInputCls} type="email" value={resellerForm.email}
                                    onChange={e => setResellerForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Credits</label>
                                <input className={modalInputCls} type="number" min="0" value={resellerForm.credits}
                                    onChange={e => setResellerForm(p => ({ ...p, credits: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>{editResellerModal === 'new' ? 'Password' : 'New Password (optional)'}</label>
                                <input className={modalInputCls} type="password"
                                    placeholder={editResellerModal === 'new' ? 'Set a strong password' : 'Leave blank to keep'}
                                    value={resellerForm.password}
                                    onChange={e => setResellerForm(p => ({ ...p, password: e.target.value }))} />
                            </div>
                        </div>
                        {editResellerModal !== 'new' && (
                            <div className="flex items-center gap-3">
                                <label className={`flex items-center gap-2.5 cursor-pointer select-none text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <div className={`relative w-10 h-5 rounded-full transition-colors ${resellerForm.isBlocked ? 'bg-red-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                                        onClick={() => setResellerForm(p => ({ ...p, isBlocked: !p.isBlocked }))}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${resellerForm.isBlocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                    {resellerForm.isBlocked ? '🔒 Blocked' : '✅ Active'}
                                </label>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditResellerModal(null)}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Cancel
                            </button>
                            <button onClick={saveReseller} disabled={modalLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaUserShield size={13} />}
                                {editResellerModal === 'new' ? 'Create Reseller' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteConfirm(null)} dark={dark}>
                    <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-400" size={20} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete {deleteConfirm.type === 'user' ? 'user' : 'reseller'} <span className="text-red-400">"{deleteConfirm.name}"</span>?
                        </p>
                        <p className={`text-sm mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Cancel
                            </button>
                            <button onClick={doDelete} disabled={modalLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaTrash size={12} />}
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