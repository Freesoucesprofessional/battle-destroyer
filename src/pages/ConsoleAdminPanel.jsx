// AdminPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaSearch, FaSignOutAlt, FaLock, FaExclamationTriangle,
    FaTrash, FaSave, FaCrown, FaGem, FaClock,
    FaUsers, FaPlus
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';

// ── Local admin sub-components ──────────────────────────────────
import Toast               from '../admin/Toast';
import Modal               from '../admin/Modal';
import Pagination          from '../admin/Pagination';
import UserCard            from '../admin/UserCard';
import ResellerCard        from '../admin/ResellerCard';
import ResellerDetailModal from '../admin/ResellerDetailModal';

const API_URL       = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 20;

export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // ── Auth ───────────────────────────────────────────────────
    const [isLoggedIn,   setIsLoggedIn]   = useState(false);
    const [adminSecret,  setAdminSecret]  = useState('');
    const [loginError,   setLoginError]   = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token,        setToken]        = useState('');

    // ── Data ───────────────────────────────────────────────────
    const [stats, setStats] = useState({
        total: 0, pro: 0, free: 0, withCredits: 0, today: 0,
        activeResellers: 0, totalResellers: 0, attacksToday: 0
    });
    const [users,         setUsers]         = useState([]);
    const [usersLoading,  setUsersLoading]  = useState(false);
    const [resellers,     setResellers]     = useState([]);
    const [resellersLoading, setResellersLoading] = useState(false);

    // ── UI ─────────────────────────────────────────────────────
    const [searchQuery,  setSearchQuery]  = useState('');
    const [currentTab,   setCurrentTab]   = useState('users');
    const [toasts,       setToasts]       = useState([]);
    const [userFilter,   setUserFilter]   = useState('all');

    // ── Pagination ─────────────────────────────────────────────
    const [usersPage,          setUsersPage]          = useState(1);
    const [usersTotalPages,    setUsersTotalPages]    = useState(1);
    const [resellersPage,      setResellersPage]      = useState(1);
    const [resellersTotalPages,setResellersTotalPages]= useState(1);
    const [resellerSearch,     setResellerSearch]     = useState('');

    // ── Modals ─────────────────────────────────────────────────
    const [editUserModal,          setEditUserModal]          = useState(null);
    const [deleteConfirm,          setDeleteConfirm]          = useState(null);
    const [addResellerModal,       setAddResellerModal]       = useState(false);
    const [editResellerModal,      setEditResellerModal]      = useState(null);
    const [deleteResellerConfirm,  setDeleteResellerConfirm]  = useState(null);
    const [showResellerStatsModal, setShowResellerStatsModal] = useState(false);
    const [selectedResellerForStats, setSelectedResellerForStats] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // ── Forms ──────────────────────────────────────────────────
    const [userForm, setUserForm] = useState({
        username: '', email: '', credits: 0, password: '',
        hasPro: false, proPlan: 'month', proDays: 30, proAction: 'add'
    });
    const [resellerForm, setResellerForm] = useState({
        username: '', email: '', password: '', credits: 0, isBlocked: false
    });

    // ── Helpers ────────────────────────────────────────────────
    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

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

    // ── Data loaders ───────────────────────────────────────────
    const loadUsers = useCallback(async (tkn, query, page = 1, filter = 'all') => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: ITEMS_PER_PAGE,
                ...(query  && { search: query }),
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
            const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE, ...(query && { search: query }) });
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

    // Auto-restore session
    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (!savedToken) return;
        setToken(savedToken);
        setIsLoggedIn(true);
        axios.get(`${API_URL}/api/admin/stats`, { headers: { 'x-admin-token': savedToken }, withCredentials: true })
            .then(r => { setStats(r.data); loadUsers(savedToken, '', 1, 'all'); })
            .catch(err => {
                if (err.response?.status === 401) {
                    localStorage.removeItem('adminToken');
                    setIsLoggedIn(false);
                    setToken('');
                }
            });
    }, [loadUsers]);

    // ── Login ──────────────────────────────────────────────────
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

    // ── User CRUD ──────────────────────────────────────────────
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
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
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
                toast(`❌ Removed Pro from ${user.username}`);
            } else if (userForm.hasPro && user.isPro) {
                const proPayload = {
                    planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan,
                    ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays })
                };
                const endpoint = userForm.proAction === 'extend' ? 'extend-pro' : 'replace-pro';
                await axios.post(`${API_URL}/api/admin/users/${user._id}/${endpoint}`, proPayload, {
                    headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
                });
                toast(userForm.proAction === 'extend' ? `➕ Extended Pro for ${user.username}!` : `🔄 Replaced Pro for ${user.username}!`);
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

    const doDelete = async () => {
        if (!deleteConfirm) return;
        setModalLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            await axios.delete(`${API_URL}/api/admin/users/${deleteConfirm._id}`, {
                headers: { 'x-admin-token': token, 'X-CSRF-Token': csrfToken }, withCredentials: true
            });
            toast(`User ${deleteConfirm.username} deleted`);
            setDeleteConfirm(null);
            loadUsers(token, searchQuery, usersPage, userFilter);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // ── Reseller CRUD ──────────────────────────────────────────
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
            toast('Username, email and password are required', 'error'); return;
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

    // ── Reseller form body (called as function to keep focus) ──
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

            <div className={`rounded-xl p-4 border ${dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <FaGem className="text-purple-500" size={14} />
                    <label className={`font-bold text-sm ${dark ? 'text-purple-400' : 'text-purple-700'}`}>Credits Balance</label>
                </div>
                <div className="flex gap-2">
                    <input className={inputCls} type="number" min="0" value={resellerForm.credits}
                        onChange={e => setResellerForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))} />
                    <button onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 100 }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all shrink-0">+100</button>
                    <button onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 1000 }))}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shrink-0">+1K</button>
                </div>
                <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                    💡 Resellers use credits to create Pro subscriptions for their customers.
                </p>
            </div>

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

    // ── Login screen ───────────────────────────────────────────
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
                            <input type="password" className={inputCls} placeholder="Your ADMIN_SECRET value"
                                value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
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

    // ── Main panel ─────────────────────────────────────────────
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
                            { label: 'Total', value: stats.total, icon: '👥', color: 'text-red-500'   },
                            { label: 'Pro',   value: stats.pro,   icon: '⭐', color: 'text-yellow-500'},
                            { label: 'Free',  value: stats.free,  icon: '💎', color: 'text-blue-500'  },
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

                    {/* ── USERS TAB ────────────────────────────────────── */}
                    {currentTab === 'users' && (
                        <>
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
                                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all">Go</button>
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
                                        <UserCard key={user._id} user={user} onEdit={openEditUser} onDelete={setDeleteConfirm} dark={dark} />
                                    ))}
                                </div>
                            )}
                            <Pagination currentPage={usersPage} totalPages={usersTotalPages}
                                onPageChange={page => loadUsers(token, searchQuery, page, userFilter)} dark={dark} />
                        </>
                    )}

                    {/* ── RESELLERS TAB ─────────────────────────────────── */}
                    {currentTab === 'resellers' && (
                        <>
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
                                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all">Go</button>
                                    <button onClick={openAddReseller}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shrink-0">
                                        <FaPlus size={10} />
                                        <span className="hidden sm:inline">Add Reseller</span>
                                        <span className="sm:hidden">Add</span>
                                    </button>
                                </div>
                            </div>

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
                                        <ResellerCard key={r._id} reseller={r}
                                            onEdit={openEditReseller}
                                            onDelete={setDeleteResellerConfirm}
                                            onViewStats={reseller => { setSelectedResellerForStats(reseller); setShowResellerStatsModal(true); }}
                                            dark={dark} />
                                    ))}
                                </div>
                            )}
                            <Pagination currentPage={resellersPage} totalPages={resellersTotalPages}
                                onPageChange={page => loadResellers(token, resellerSearch, page)} dark={dark} />
                        </>
                    )}
                </div>
            </div>

            {/* ── EDIT USER MODAL ──────────────────────────────────── */}
            {editUserModal && (
                <Modal title={`EDIT — ${editUserModal.username}`} onClose={() => setEditUserModal(null)} dark={dark} size="lg">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Username</label>
                                <input className={inputCls} value={userForm.username} onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input className={inputCls} type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>

                        <div className={`rounded-xl p-4 border ${dark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaGem className="text-blue-500" size={14} />
                                <label className={`font-bold text-sm ${dark ? 'text-blue-400' : 'text-blue-700'}`}>Credits Balance</label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Current Credits</label>
                                    <div className={`text-xl font-black ${dark ? 'text-blue-400' : 'text-blue-600'}`}>{editUserModal.credits || 0}</div>
                                    {editUserModal.isPro && <p className="text-[10px] mt-1 text-yellow-500">+30 daily attacks included</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Update Credits</label>
                                    <input className={inputCls} type="number" min="0" value={userForm.credits}
                                        onChange={e => setUserForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))} />
                                    <div className="flex gap-2 mt-2">
                                        {[['+ 10', 10, 'bg-green-500 hover:bg-green-600'], ['+ 50', 50, 'bg-green-600 hover:bg-green-700'], ['− 10', -10, 'bg-red-500 hover:bg-red-600']].map(([label, delta, cls]) => (
                                            <button key={label}
                                                onClick={() => setUserForm(p => ({ ...p, credits: Math.max(0, p.credits + delta) }))}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-white ${cls} transition-all`}>{label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>New Password (optional)</label>
                            <input className={inputCls} type="password" placeholder="Leave blank to keep"
                                value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                        </div>

                        <div className={`rounded-xl p-4 border ${dark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FaCrown className="text-yellow-500" size={14} />
                                    <label className={`font-bold text-sm ${dark ? 'text-yellow-400' : 'text-yellow-700'}`}>Pro Subscription</label>
                                </div>
                                <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${userForm.hasPro ? 'bg-yellow-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                                    onClick={() => setUserForm(p => ({ ...p, hasPro: !p.hasPro, proAction: !p.hasPro ? 'add' : 'remove' }))}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${userForm.hasPro ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </div>
                            </div>

                            {editUserModal.isPro && (
                                <div className={`mb-3 p-3 rounded-lg text-xs ${dark ? 'bg-white/5' : 'bg-white'}`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><span className={dark ? 'text-slate-400' : 'text-slate-500'}>Current Plan:</span>
                                            <span className="ml-2 font-semibold text-yellow-500">{editUserModal.subscription?.plan || 'Pro'}</span></div>
                                        <div><span className={dark ? 'text-slate-400' : 'text-slate-500'}>Days Left:</span>
                                            <span className="ml-2 font-mono">{editUserModal.subscriptionStatus?.daysLeft || 0} days</span></div>
                                    </div>
                                </div>
                            )}

                            {userForm.hasPro && (
                                <div className="space-y-3">
                                    {editUserModal.isPro && (
                                        <div className="flex gap-2">
                                            {['extend', 'replace'].map(action => (
                                                <button key={action} onClick={() => setUserForm(p => ({ ...p, proAction: action }))}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${userForm.proAction === action ? 'bg-yellow-500 text-white' : dark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                                    {action === 'extend' ? '➕ Extend' : '🔄 Replace'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'week',   label: '7 Days',  sub: 'Weekly'  },
                                            { key: 'month',  label: '30 Days', sub: 'Monthly' },
                                            { key: 'season', label: '60 Days', sub: 'Season'  },
                                            { key: 'custom', label: 'Custom',  sub: 'Set days'},
                                        ].map(plan => (
                                            <button key={plan.key}
                                                onClick={() => setUserForm(p => ({ ...p, proPlan: plan.key, proDays: { week:7, month:30, season:60 }[plan.key] || p.proDays }))}
                                                className={`p-2.5 rounded-lg border transition-all text-xs ${userForm.proPlan === plan.key ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                                <div className="font-bold">{plan.label}</div>
                                                <div className="text-[10px] mt-0.5 opacity-70">{plan.sub}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {userForm.proPlan === 'custom' && (
                                        <div>
                                            <label className={labelCls}>Number of Days</label>
                                            <input type="number" className={inputCls} min="1" max="365" value={userForm.proDays}
                                                onChange={e => setUserForm(p => ({ ...p, proDays: parseInt(e.target.value) || 30 }))} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={`rounded-xl p-4 border ${dark ? 'border-green-500/20 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <FaClock className="text-green-500" size={14} />
                                <label className={`font-bold text-sm ${dark ? 'text-green-400' : 'text-green-700'}`}>User Statistics</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Total Attacks</p>
                                    <p className={`text-lg font-black ${dark ? 'text-green-400' : 'text-green-600'}`}>{editUserModal.totalAttacks?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Member Since</p>
                                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>{new Date(editUserModal.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

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

            {/* ── DELETE USER MODAL ─────────────────────────────────── */}
            {deleteConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteConfirm(null)} dark={dark} size="sm">
                    <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <FaTrash className="text-red-400" size={18} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete <span className="text-red-400">"{deleteConfirm.username}"</span>?
                        </p>
                        <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className={`flex-1 py-2 rounded-xl font-semibold text-sm ${dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>Cancel</button>
                            <button onClick={doDelete} disabled={modalLoading}
                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {modalLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaTrash size={10} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── ADD / EDIT RESELLER MODAL ─────────────────────────── */}
            {addResellerModal && (
                <Modal title="ADD RESELLER" onClose={() => setAddResellerModal(false)} dark={dark} size="md">
                    {resellerFormBody()}
                </Modal>
            )}
            {editResellerModal && (
                <Modal title={`EDIT — ${editResellerModal.username}`} onClose={() => setEditResellerModal(null)} dark={dark} size="md">
                    {resellerFormBody()}
                </Modal>
            )}

            {/* ── DELETE RESELLER MODAL ─────────────────────────────── */}
            {deleteResellerConfirm && (
                <Modal title="CONFIRM DELETE" onClose={() => setDeleteResellerConfirm(null)} dark={dark} size="sm">
                    <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <FaTrash className="text-red-400" size={18} />
                        </div>
                        <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            Delete <span className="text-red-400">"{deleteResellerConfirm.username}"</span>?
                        </p>
                        <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteResellerConfirm(null)}
                                className={`flex-1 py-2 rounded-xl font-semibold text-sm ${dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>Cancel</button>
                            <button onClick={doDeleteReseller} disabled={modalLoading}
                                className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {modalLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaTrash size={10} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── RESELLER STATS MODAL ──────────────────────────────── */}
            {showResellerStatsModal && selectedResellerForStats && (
                <ResellerDetailModal
                    reseller={selectedResellerForStats}
                    dark={dark}
                    onClose={() => { setShowResellerStatsModal(false); setSelectedResellerForStats(null); }}
                />
            )}

            <Toast toasts={toasts} />
        </div>
    );
}