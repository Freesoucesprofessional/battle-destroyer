import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { FaSignOutAlt, FaLock, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import HCaptchaWidget from '../components/HCaptchaWidget';

// ── Sub-components ───────────────────────────────────────────────
import Toast from '../admin/Toast';
import ResellerDetailModal from '../admin/ResellerDetailModal';

// ── Tabs ─────────────────────────────────────────────────────────
import UsersTab from '../admin/tabs/UsersTab';
import ResellersTab from '../admin/tabs/ResellersTab';
import ApiUsersTab from '../admin/tabs/ApiUsersTab';
import LiveMonitorTab from '../admin/tabs/LiveMonitorTab';

// ── Modals ────────────────────────────────────────────────────────
import EditUserModal from '../admin/modals/EditUserModal';
import DeleteConfirmModal from '../admin/modals/DeleteConfirmModal';
import ResellerFormModal from '../admin/modals/ResellerFormModal';
import AddApiUserModal from '../admin/modals/AddApiUserModal';
import EditApiUserModal from '../admin/modals/EditApiUserModal';
import ExtendExpiryModal from '../admin/modals/ExtendExpiryModal';
import ViewApiUserStatsModal from '../admin/modals/ViewApiUserStatsModal';
import RegenerateSecretModal from '../admin/modals/RegenerateSecretModal';

// ── Constants ─────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 20;
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

// ── Encryption helpers ────────────────────────────────────────────
function encryptData(data) {
    const jsonString = JSON.stringify({ ...data, timestamp: Date.now() });
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}
function createHash(data) {
    return CryptoJS.SHA256(JSON.stringify(data) + ENCRYPTION_KEY).toString();
}
function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption failed');
    return JSON.parse(decrypted);
}

// ── Axios client ──────────────────────────────────────────────────
const apiClient = axios.create({ withCredentials: true });

apiClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers['x-admin-token'] = token;
    if (config.method !== 'get' && !config.skipCsrf) {
        try {
            const csrfRes = await apiClient.get(`${API_URL}/api/csrf-token`, { skipCsrf: true });
            config.headers['X-CSRF-Token'] = csrfRes.data.csrfToken;
        } catch (err) { console.error('CSRF error:', err); }
    }
    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
    (response) => {
        if (response.data?.encrypted && response.data?.hash) {
            const decrypted = decryptData(response.data.encrypted);
            if (createHash(decrypted) !== response.data.hash) throw new Error('Integrity check failed');
            response.data = decrypted;
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            if (!window.location.pathname.includes('/login')) window.location.reload();
        }
        return Promise.reject(error);
    }
);

// ═════════════════════════════════════════════════════════════════
export default function ConsoleAdminPanel({ toggleTheme, theme }) {
    const dark = theme !== 'light';

    // ── Auth ───────────────────────────────────────────────────
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [token, setToken] = useState('');

    // ── Captcha ────────────────────────────────────────────────
    const [captchaReady, setCaptchaReady] = useState(false);
    const captchaDataRef = useRef(null);
    const captchaRef = useRef(null);

    // ── Data ───────────────────────────────────────────────────
    const [stats, setStats] = useState({ total: 0, pro: 0, free: 0, withCredits: 0, today: 0, activeResellers: 0, totalResellers: 0, attacksToday: 0, totalApiUsers: 0, activeApiUsers: 0 });
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [resellers, setResellers] = useState([]);
    const [resellersLoading, setResellersLoading] = useState(false);
    const [apiUsers, setApiUsers] = useState([]);
    const [apiUsersLoading, setApiUsersLoading] = useState(false);

    // ── UI ─────────────────────────────────────────────────────
    const [currentTab, setCurrentTab] = useState('users');
    const [toasts, setToasts] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // ── Users state ────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);

    // ── Resellers state ────────────────────────────────────────
    const [resellerSearch, setResellerSearch] = useState('');
    const [resellersPage, setResellersPage] = useState(1);
    const [resellersTotalPages, setResellersTotalPages] = useState(1);

    // ── API Users state ────────────────────────────────────────
    const [apiUsersSearch, setApiUsersSearch] = useState('');
    const [apiUsersStatus, setApiUsersStatus] = useState('');
    const [apiUsersPage, setApiUsersPage] = useState(1);
    const [apiUsersTotalPages, setApiUsersTotalPages] = useState(1);

    // ── Modal state ────────────────────────────────────────────
    const [editUserModal, setEditUserModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [addResellerModal, setAddResellerModal] = useState(false);
    const [editResellerModal, setEditResellerModal] = useState(null);
    const [deleteResellerConfirm, setDeleteResellerConfirm] = useState(null);
    const [showResellerStatsModal, setShowResellerStatsModal] = useState(false);
    const [selectedResellerForStats, setSelectedResellerForStats] = useState(null);
    const [addApiUserModal, setAddApiUserModal] = useState(false);
    const [editApiUserModal, setEditApiUserModal] = useState(null);
    const [deleteApiUserConfirm, setDeleteApiUserConfirm] = useState(null);
    const [viewApiUserStatsModal, setViewApiUserStatsModal] = useState(false);
    const [selectedApiUser, setSelectedApiUser] = useState(null);
    const [apiUserStats, setApiUserStats] = useState(null);
    const [extendExpiryModal, setExtendExpiryModal] = useState(null);
    const [extendDays, setExtendDays] = useState(30);
    const [regenerateSecretModal, setRegenerateSecretModal] = useState(false);
    const [newApiSecret, setNewApiSecret] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const [liveAttackCount, setLiveAttackCount] = useState(0);

    // ── Form state ─────────────────────────────────────────────
    const [userForm, setUserForm] = useState({ username: '', email: '', credits: 0, password: '', hasPro: false, proPlan: 'month', proDays: 30, proAction: 'add' });
    const [resellerForm, setResellerForm] = useState({ username: '', email: '', password: '', credits: 0, isBlocked: false });
    const [apiUserForm, setApiUserForm] = useState({ username: '', email: '', maxConcurrent: 2, maxDuration: 300, expirationDays: 30 });

    // ── Helpers ────────────────────────────────────────────────
    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const resetCaptcha = useCallback(() => {
        captchaDataRef.current = null;
        setCaptchaReady(false);
        captchaRef.current?.reset();
    }, []);

    const handleCaptchaVerify = useCallback((data) => {
        captchaDataRef.current = data;
        setCaptchaReady(true);
    }, []);

    const logout = useCallback(async () => {
        try { await apiClient.delete(`${API_URL}/api/admin/session`); } catch (err) { console.error(err); }
        setIsLoggedIn(false); setToken(''); setUsers([]); setAdminSecret('');
        localStorage.removeItem('adminToken');
        toast('Logged out successfully');
    }, [toast]);

    const makeEncryptedRequest = useCallback(async (method, url, data = null, config = {}) => {
        const payload = { ...data, timestamp: Date.now() };
        return apiClient[method](url, { encrypted: encryptData(payload), hash: createHash(payload) }, config);
    }, []);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast(`Copied ${field}!`);
    };

    // ── Data loaders ───────────────────────────────────────────
    const loadUsers = useCallback(async (tkn, query, page = 1, filter = 'all') => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE, ...(query && { search: query }), ...(filter !== 'all' && { subscriptionType: filter }) });
            const { data } = await apiClient.get(`${API_URL}/api/admin/users?${params}`);
            setUsers(data.users || []); setUsersTotalPages(data.totalPages || 1); setUsersPage(page);
        } catch (err) {
            if (err.response?.status === 401) logout(); else toast(err.response?.data?.message || 'Failed to load users', 'error');
        } finally { setUsersLoading(false); }
    }, [logout, toast]);

    const loadResellers = useCallback(async (tkn, query = '', page = 1) => {
        setResellersLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE, ...(query && { search: query }) });
            const { data } = await apiClient.get(`${API_URL}/api/admin/resellers?${params}`);
            setResellers(data.resellers || []); setResellersTotalPages(data.totalPages || 1); setResellersPage(page);
        } catch (err) {
            if (err.response?.status === 401) logout(); else toast(err.response?.data?.message || 'Failed to load resellers', 'error');
        } finally { setResellersLoading(false); }
    }, [logout, toast]);

    const loadApiUsers = useCallback(async (tkn, query = '', page = 1, status = '') => {
        setApiUsersLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
            if (query) params.append('search', query);
            if (status) params.append('status', status);
            const { data } = await apiClient.get(`${API_URL}/api/admin/api-users?${params}`);
            setApiUsers(data.users || []); setApiUsersTotalPages(data.totalPages || 1); setApiUsersPage(page);
        } catch (err) {
            if (err.response?.status === 401) logout(); else toast(err.response?.data?.error || 'Failed to load API users', 'error');
        } finally { setApiUsersLoading(false); }
    }, [logout, toast]);

    const fetchLiveAttackCount = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/attacks/running/summary`, {
                headers: { 'x-admin-token': token }
            });
            if (response.ok) {
                const result = await response.json();
                let data = result;
                // Handle encrypted response
                if (result.encrypted && result.hash) {
                    const decrypted = decryptData(result.encrypted);
                    const calculatedHash = createHash(decrypted);
                    if (calculatedHash === result.hash) {
                        data = decrypted;
                    }
                }
                setLiveAttackCount(data.totalActive || 0);
            }
        } catch (error) {
            console.error('Failed to fetch attack count:', error);
        }
    }, [token]);

    const loadStats = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`${API_URL}/api/admin/stats`);
            const apiRes = await apiClient.get(`${API_URL}/api/admin/api-users?limit=100`);
            setStats({ ...data, totalApiUsers: apiRes.data.total || 0, activeApiUsers: apiRes.data.users?.filter(u => u.status === 'active').length || 0 });
        } catch (err) { if (err.response?.status === 401) logout(); }
    }, [logout]);

    // ── Auto-restore session ───────────────────────────────────
    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        if (!savedToken) return;
        setToken(savedToken); setIsLoggedIn(true);
        apiClient.get(`${API_URL}/api/admin/session/check`)
            .then(async () => {
                const statsRes = await apiClient.get(`${API_URL}/api/admin/stats`);
                setStats(statsRes.data);
                await loadUsers(savedToken, '', 1, 'all');
                await loadApiUsers(savedToken, '', 1, '');
            })
            .catch(() => { localStorage.removeItem('adminToken'); setIsLoggedIn(false); setToken(''); toast('Session expired', 'error'); });
    }, [loadUsers, loadApiUsers, toast]);


    useEffect(() => {
        if (isLoggedIn && currentTab !== 'livemonitor') {
            fetchLiveAttackCount();
            const interval = setInterval(fetchLiveAttackCount, 10000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, currentTab, fetchLiveAttackCount]);

    // ── Login ──────────────────────────────────────────────────
    const doLogin = async () => {
        setLoginError('');
        if (!adminSecret) { setLoginError('Admin secret is required'); return; }
        if (!captchaDataRef.current) { setLoginError('Please complete the human verification'); return; }
        setLoginLoading(true);
        try {
            const response = await makeEncryptedRequest('post', `${API_URL}/api/admin/session`, { secret: adminSecret, captchaData: captchaDataRef.current });
            const { token: newToken } = response.data;
            if (!newToken) throw new Error(response.data.message || 'Login failed');
            setToken(newToken); setIsLoggedIn(true); setAdminSecret('');
            localStorage.setItem('adminToken', newToken);
            toast('Login successful!');
            const statsRes = await apiClient.get(`${API_URL}/api/admin/stats`);
            setStats(statsRes.data);
            await loadUsers(newToken, '', 1, 'all');
            await loadApiUsers(newToken, '', 1, '');
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed');
            toast(err.response?.data?.message || 'Login failed', 'error');
            localStorage.removeItem('adminToken'); setToken(''); resetCaptcha();
        } finally { setLoginLoading(false); }
    };

    // ── User CRUD ──────────────────────────────────────────────
    const openEditUser = (user) => {
        setUserForm({ username: user.username, email: user.email, credits: user.credits || 0, password: '', hasPro: user.isPro, proPlan: user.subscription?.plan || 'month', proDays: 30, proAction: 'add' });
        setEditUserModal(user);
    };

    const saveUser = async () => {
        setModalLoading(true);
        try {
            const user = editUserModal;
            await apiClient.patch(`${API_URL}/api/admin/users/${user._id}`, { username: userForm.username, email: userForm.email, credits: Number(userForm.credits), ...(userForm.password && { password: userForm.password }) });
            if (userForm.hasPro && !user.isPro) {
                await apiClient.post(`${API_URL}/api/admin/users/${user._id}/give-pro`, { planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan, ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays }) });
            } else if (!userForm.hasPro && user.isPro) {
                await apiClient.delete(`${API_URL}/api/admin/users/${user._id}/remove-pro`);
            } else if (userForm.hasPro && user.isPro) {
                const endpoint = userForm.proAction === 'extend' ? 'extend-pro' : 'replace-pro';
                await apiClient.post(`${API_URL}/api/admin/users/${user._id}/${endpoint}`, { planType: userForm.proPlan === 'custom' ? 'custom' : userForm.proPlan, ...(userForm.proPlan === 'custom' && { customDays: userForm.proDays }) });
            }
            toast('User updated successfully');
            setEditUserModal(null);
            loadUsers(token, searchQuery, usersPage, userFilter);
            loadStats();
        } catch (err) { toast(err.response?.data?.message || 'Failed to update user', 'error'); }
        finally { setModalLoading(false); }
    };

    const doDelete = async () => {
        if (!deleteConfirm) return;
        setModalLoading(true);
        try {
            await apiClient.delete(`${API_URL}/api/admin/users/${deleteConfirm._id}`);
            toast(`User ${deleteConfirm.username} deleted`);
            setDeleteConfirm(null); loadUsers(token, searchQuery, usersPage, userFilter); loadStats();
        } catch (err) { toast(err.response?.data?.message || 'Failed to delete', 'error'); }
        finally { setModalLoading(false); }
    };

    // ── API Users CRUD ─────────────────────────────────────────
    const openAddApiUser = () => {
        setApiUserForm({ username: '', email: '', maxConcurrent: 2, maxDuration: 300, expirationDays: 30 });
        setAddApiUserModal(true);
    };

    const openEditApiUser = (apiUser) => {
        setApiUserForm({ username: apiUser.username, email: apiUser.email, maxConcurrent: apiUser.limits?.maxConcurrent || 2, maxDuration: apiUser.limits?.maxDuration || 300 });
        setEditApiUserModal(apiUser);
    };

    const viewApiUserStats = async (apiUser) => {
        setSelectedApiUser(apiUser); setApiUserStats(null); setViewApiUserStatsModal(true);
        try {
            const { data } = await apiClient.get(`${API_URL}/api/admin/api-users/${apiUser._id}/stats`);
            setApiUserStats(data);
        } catch (err) { toast(err.response?.data?.message || 'Failed to load stats', 'error'); setViewApiUserStatsModal(false); }
    };

    const updateApiUserStatus = async (apiUserId, newStatus) => {
        try {
            await apiClient.patch(`${API_URL}/api/admin/api-users/${apiUserId}/limits`, { status: newStatus });
            toast(`API User status updated to ${newStatus}`);
            loadApiUsers(token, apiUsersSearch, apiUsersPage, apiUsersStatus);
        } catch (err) { toast(err.response?.data?.message || 'Failed to update status', 'error'); }
    };

    const saveNewApiUser = async () => {
        if (!apiUserForm.username || !apiUserForm.email) { toast('Username and email are required', 'error'); return; }
        const sanitized = apiUserForm.username.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
        if (sanitized.length < 3) { toast('Username must be at least 3 characters', 'error'); return; }
        setModalLoading(true);
        try {
            const response = await apiClient.post(`${API_URL}/api/admin/api-users`, { username: sanitized, email: apiUserForm.email, maxConcurrent: apiUserForm.maxConcurrent, maxDuration: apiUserForm.maxDuration, expirationDays: apiUserForm.expirationDays || 30 });
            const { user } = response.data;
            toast(`✅ API User ${user.username} created!`);
            setNewApiSecret(user.apiSecret); setSelectedApiUser(user);
            setRegenerateSecretModal(true); setAddApiUserModal(false);
            loadApiUsers(token, apiUsersSearch, apiUsersPage, apiUsersStatus); loadStats();
        } catch (err) { toast(err.response?.data?.message || 'Failed to create API user', 'error'); }
        finally { setModalLoading(false); }
    };

    const saveEditApiUser = async () => {
        setModalLoading(true);
        try {
            await apiClient.patch(`${API_URL}/api/admin/api-users/${editApiUserModal._id}/limits`, { maxConcurrent: apiUserForm.maxConcurrent, maxDuration: apiUserForm.maxDuration });
            toast('API User updated successfully');
            setEditApiUserModal(null); loadApiUsers(token, apiUsersSearch, apiUsersPage, apiUsersStatus);
        } catch (err) { toast(err.response?.data?.message || 'Failed to update API user', 'error'); }
        finally { setModalLoading(false); }
    };

    const regenerateApiSecret = async () => {
        if (!selectedApiUser) return;
        setModalLoading(true);
        try {
            const { data } = await apiClient.post(`${API_URL}/api/admin/api-users/${selectedApiUser._id}/regenerate-secret`);
            setNewApiSecret(data.apiSecret); setRegenerateSecretModal(true); toast('API Secret regenerated!');
        } catch (err) { toast(err.response?.data?.message || 'Failed to regenerate secret', 'error'); }
        finally { setModalLoading(false); }
    };

    const handleExtend = (apiUser) => {
        setSelectedApiUser(apiUser); setExtendExpiryModal(apiUser); setExtendDays(30);
    };

    const extendApiUserExpiry = async (apiUserId, days) => {
        setModalLoading(true);
        try {
            const { data } = await makeEncryptedRequest(
                'post',
                `${API_URL}/api/admin/api-users/${apiUserId}/extend`,
                { days: parseInt(days) }
            );
            toast(`✅ Expiration extended by ${days} days! New expiry: ${new Date(data.expiresAt).toLocaleDateString()}`);
            setExtendExpiryModal(null);
            loadApiUsers(token, apiUsersSearch, apiUsersPage, apiUsersStatus);
            loadStats();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to extend expiration', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const doDeleteApiUser = async () => {
        if (!deleteApiUserConfirm) return;
        setModalLoading(true);
        try {
            await apiClient.delete(`${API_URL}/api/admin/api-users/${deleteApiUserConfirm._id}`);
            toast(`API User ${deleteApiUserConfirm.username} deleted`);
            setDeleteApiUserConfirm(null); loadApiUsers(token, apiUsersSearch, apiUsersPage, apiUsersStatus); loadStats();
        } catch (err) { toast(err.response?.data?.error || 'Failed to delete', 'error'); }
        finally { setModalLoading(false); }
    };

    // ── Reseller CRUD ──────────────────────────────────────────
    const openAddReseller = () => { setResellerForm({ username: '', email: '', password: '', credits: 0, isBlocked: false }); setAddResellerModal(true); };
    const openEditReseller = (r) => { setResellerForm({ username: r.username, email: r.email, password: '', credits: r.credits || 0, isBlocked: r.isBlocked || false }); setEditResellerModal(r); };

    const saveNewReseller = async () => {
        if (!resellerForm.username || !resellerForm.email || !resellerForm.password) { toast('Username, email and password are required', 'error'); return; }
        setModalLoading(true);
        try {
            await apiClient.post(`${API_URL}/api/admin/resellers`, resellerForm);
            toast(`✅ Reseller ${resellerForm.username} created!`);
            setAddResellerModal(false); loadResellers(token, resellerSearch, 1); loadStats();
        } catch (err) { toast(err.response?.data?.message || 'Failed to create reseller', 'error'); }
        finally { setModalLoading(false); }
    };

    const saveEditReseller = async () => {
        setModalLoading(true);
        try {
            const payload = { username: resellerForm.username, email: resellerForm.email, credits: Number(resellerForm.credits), isBlocked: resellerForm.isBlocked };
            if (resellerForm.password) payload.password = resellerForm.password;
            await apiClient.patch(`${API_URL}/api/admin/resellers/${editResellerModal._id}`, payload);
            toast('Reseller updated successfully');
            setEditResellerModal(null); loadResellers(token, resellerSearch, resellersPage);
        } catch (err) { toast(err.response?.data?.message || 'Failed to update reseller', 'error'); }
        finally { setModalLoading(false); }
    };

    const doDeleteReseller = async () => {
        if (!deleteResellerConfirm) return;
        setModalLoading(true);
        try {
            await apiClient.delete(`${API_URL}/api/admin/resellers/${deleteResellerConfirm._id}`);
            toast(`Reseller ${deleteResellerConfirm.username} deleted`);
            setDeleteResellerConfirm(null); loadResellers(token, resellerSearch, resellersPage); loadStats();
        } catch (err) { toast(err.response?.data?.message || 'Failed to delete', 'error'); }
        finally { setModalLoading(false); }
    };

    // ── Tab switching ──────────────────────────────────────────
    const switchTab = (tab) => {
        setCurrentTab(tab);
        if (tab === 'users') { setSearchQuery(''); setUserFilter('all'); loadUsers(token, '', 1, 'all'); }
        if (tab === 'resellers') loadResellers(token, '', 1);
        if (tab === 'apiusers') loadApiUsers(token, '', 1, '');
    };

    // ─────────────────────────────────────────────────────────────
    // LOGIN SCREEN
    // ─────────────────────────────────────────────────────────────
    if (!isLoggedIn) {
        const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
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
                            <input type="password" className={inputCls} placeholder="Your ADMIN_SECRET value"
                                value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                        </div>

                        <div>
                            <label className={`flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                <FaShieldAlt size={10} className="text-red-500/70" />
                                Human Verification
                            </label>
                            <HCaptchaWidget ref={captchaRef} onVerify={handleCaptchaVerify} onExpire={resetCaptcha} onError={resetCaptcha} theme={theme} />
                        </div>

                        <button onClick={doLogin} disabled={loginLoading || !captchaReady}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaLock size={12} />}
                            {loginLoading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
                <Toast toasts={toasts} />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // MAIN PANEL
    // ─────────────────────────────────────────────────────────────
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
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                        {[
                            { label: 'Total', value: stats.total, icon: '👥', color: 'text-red-500' },
                            { label: 'Pro', value: stats.pro, icon: '⭐', color: 'text-yellow-500' },
                            { label: 'Free', value: stats.free, icon: '💎', color: 'text-blue-500' },
                            { label: 'Today', value: stats.today, icon: '📅', color: 'text-green-500' },
                            { label: 'API Users', value: stats.totalApiUsers || 0, icon: '🔑', color: 'text-cyan-500' },
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

                    {/* Tab bar */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        {[
                            { key: 'users', label: '👥 Users' },
                            { key: 'resellers', label: '🤝 Resellers' },
                            { key: 'apiusers', label: '🔑 API Users' },
                            { key: 'livemonitor', label: '🎯 Live Monitor' },
                        ].map(({ key, label }) => (
                            <button key={key}
                                onClick={() => switchTab(key)}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${currentTab === key ? 'bg-red-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                {label}
                                {key === 'livemonitor' && liveAttackCount > 0 && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                                        {liveAttackCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {currentTab === 'users' && (
                        <UsersTab
                            dark={dark} token={token}
                            users={users} usersLoading={usersLoading}
                            usersPage={usersPage} usersTotalPages={usersTotalPages}
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            userFilter={userFilter} setUserFilter={setUserFilter}
                            loadUsers={loadUsers} onEdit={openEditUser} onDelete={setDeleteConfirm}
                        />
                    )}
                    {currentTab === 'resellers' && (
                        <ResellersTab
                            dark={dark} token={token} stats={stats}
                            resellers={resellers} resellersLoading={resellersLoading}
                            resellersPage={resellersPage} resellersTotalPages={resellersTotalPages}
                            resellerSearch={resellerSearch} setResellerSearch={setResellerSearch}
                            loadResellers={loadResellers} onAdd={openAddReseller}
                            onEdit={openEditReseller} onDelete={setDeleteResellerConfirm}
                            onViewStats={(r) => { setSelectedResellerForStats(r); setShowResellerStatsModal(true); }}
                        />
                    )}
                    {currentTab === 'apiusers' && (
                        <ApiUsersTab
                            dark={dark} token={token} stats={stats}
                            apiUsers={apiUsers} apiUsersLoading={apiUsersLoading}
                            apiUsersPage={apiUsersPage} apiUsersTotalPages={apiUsersTotalPages}
                            apiUsersSearch={apiUsersSearch} setApiUsersSearch={setApiUsersSearch}
                            apiUsersStatus={apiUsersStatus} setApiUsersStatus={setApiUsersStatus}
                            loadApiUsers={loadApiUsers} onAdd={openAddApiUser}
                            onEdit={openEditApiUser} onViewStats={viewApiUserStats}
                            onExtend={handleExtend}
                            onRegenerate={(apiUser) => { setSelectedApiUser(apiUser); regenerateApiSecret(); }}
                            onDelete={setDeleteApiUserConfirm}
                        />
                    )}
                    {currentTab === 'livemonitor' && (
                        <LiveMonitorTab
                            dark={dark}
                            token={token}
                            showToast={toast}
                        />
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <EditUserModal
                editUserModal={editUserModal} setEditUserModal={setEditUserModal}
                userForm={userForm} setUserForm={setUserForm}
                dark={dark} modalLoading={modalLoading} onSave={saveUser}
            />
            <DeleteConfirmModal
                item={deleteConfirm} entityLabel="User"
                onClose={() => setDeleteConfirm(null)} onConfirm={doDelete}
                dark={dark} modalLoading={modalLoading}
            />

            {/* Reseller modals */}
            {(addResellerModal || editResellerModal) && (
                <ResellerFormModal
                    isEdit={!!editResellerModal}
                    editResellerModal={editResellerModal} setEditResellerModal={setEditResellerModal}
                    setAddResellerModal={setAddResellerModal}
                    resellerForm={resellerForm} setResellerForm={setResellerForm}
                    dark={dark} modalLoading={modalLoading}
                    onSave={editResellerModal ? saveEditReseller : saveNewReseller}
                />
            )}
            <DeleteConfirmModal
                item={deleteResellerConfirm} entityLabel="Reseller"
                onClose={() => setDeleteResellerConfirm(null)} onConfirm={doDeleteReseller}
                dark={dark} modalLoading={modalLoading}
            />

            {/* API User modals */}
            {addApiUserModal && (
                <AddApiUserModal
                    apiUserForm={apiUserForm} setApiUserForm={setApiUserForm}
                    onClose={() => setAddApiUserModal(false)}
                    dark={dark} modalLoading={modalLoading} onSave={saveNewApiUser}
                />
            )}
            <EditApiUserModal
                editApiUserModal={editApiUserModal} setEditApiUserModal={setEditApiUserModal}
                apiUserForm={apiUserForm} setApiUserForm={setApiUserForm}
                dark={dark} modalLoading={modalLoading}
                onSave={saveEditApiUser} onUpdateStatus={updateApiUserStatus}
            />
            <ExtendExpiryModal
                extendExpiryModal={extendExpiryModal} setExtendExpiryModal={setExtendExpiryModal}
                extendDays={extendDays} setExtendDays={setExtendDays}
                dark={dark} modalLoading={modalLoading} onExtend={extendApiUserExpiry}
            />
            <DeleteConfirmModal
                item={deleteApiUserConfirm} entityLabel="API User"
                onClose={() => setDeleteApiUserConfirm(null)} onConfirm={doDeleteApiUser}
                dark={dark} modalLoading={modalLoading}
            />
            <ViewApiUserStatsModal
                selectedApiUser={viewApiUserStatsModal ? selectedApiUser : null}
                apiUserStats={apiUserStats}
                dark={dark} copiedField={copiedField}
                onClose={() => { setViewApiUserStatsModal(false); setSelectedApiUser(null); setApiUserStats(null); }}
                onEditLimits={() => { setViewApiUserStatsModal(false); openEditApiUser(selectedApiUser); }}
                onCopy={copyToClipboard}
                onRegenerate={regenerateApiSecret}
            />
            <RegenerateSecretModal
                newApiSecret={regenerateSecretModal ? newApiSecret : ''}
                dark={dark} copiedField={copiedField} onCopy={copyToClipboard}
                onClose={() => { setRegenerateSecretModal(false); setNewApiSecret(''); }}
            />

            {showResellerStatsModal && selectedResellerForStats && (
                <ResellerDetailModal
                    reseller={selectedResellerForStats} dark={dark}
                    onClose={() => { setShowResellerStatsModal(false); setSelectedResellerForStats(null); }}
                />
            )}

            <Toast toasts={toasts} />
        </div>
    );
}