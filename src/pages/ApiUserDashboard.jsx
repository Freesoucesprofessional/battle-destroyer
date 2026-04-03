// src/pages/ApiUserDashboard.jsx - WITH ENCRYPTION SUPPORT
import React, { useState, useEffect, useCallback } from 'react';
import {
    FaSignOutAlt, FaKey, FaExclamationTriangle, FaBolt, FaCopy, FaCheck,
    FaCode, FaTerminal, FaPython, FaJs, FaChartLine, FaClock,
    FaCalendarAlt
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import Toast from '../admin/Toast';
import apiUserApiClient from '../utils/apiUserApiClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ApiUserDashboard({ toggleTheme, theme, onLogout }) {
    const dark = theme !== 'light';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeAttacks, setActiveAttacks] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [copied, setCopied] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [activeTab, setActiveTab] = useState('python');
    const [refreshing, setRefreshing] = useState(false);

    const token = localStorage.getItem('apiUserToken');

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const handleLogout = useCallback(async () => {
        localStorage.removeItem('apiUserToken');
        localStorage.removeItem('apiUserData');
        localStorage.removeItem('apiUserApiKey');
        toast('Logged out successfully');
        setTimeout(() => {
            if (onLogout) onLogout();
            window.location.href = '/api';
        }, 500);
    }, [toast, onLogout]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            // Use encrypted API client instead of axios
            const response = await apiUserApiClient.get(`${API_URL}/api/api-auth/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Dashboard response:', response.data);

            // Response is automatically decrypted by apiUserApiClient
            if (response.data.success) {
                setUserData(response.data.user);
                setStats(response.data.stats);
                setActiveAttacks(response.data.activeAttacks || []);

                if (response.data.apiKey) {
                    localStorage.setItem('apiUserApiKey', response.data.apiKey);
                }
            } else {
                setError('Invalid response from server');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                setTimeout(() => handleLogout(), 2000);
            } else if (err.response?.status === 404) {
                setError('Dashboard endpoint not found. Please check backend.');
            } else {
                setError(err.response?.data?.error || 'Failed to fetch dashboard data');
            }
            toast('Failed to fetch dashboard data', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, toast, handleLogout]);

    const refreshData = async () => {
        setRefreshing(true);
        await fetchDashboardData();
    };

    useEffect(() => {
        if (!token) {
            window.location.href = '/api';
            return;
        }

        fetchDashboardData();
        const interval = setInterval(() => fetchDashboardData(), 15000);
        return () => clearInterval(interval);
    }, [token, fetchDashboardData]);

    const copyApiKey = (apiKey) => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            toast('API Key copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Show error state
    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <div className="text-center max-w-md mx-auto p-6">
                    <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Error Loading Dashboard</h2>
                    <p className={`text-sm mb-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
                    <button onClick={refreshData} className="px-4 py-2 bg-cyan-600 text-white rounded-lg mr-2">
                        Retry
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className={dark ? 'text-slate-400' : 'text-slate-500'}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!userData || !stats) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <div className="text-center">
                    <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
                    <p className={dark ? 'text-slate-400' : 'text-slate-500'}>No data available</p>
                    <button onClick={refreshData} className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-lg">
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const limits = userData.limits || { maxConcurrent: 2, maxDuration: 300 };
    const currentActive = stats.currentActiveAttacks || 0;
    const remainingSlots = limits.maxConcurrent - currentActive;
    const totalAttacks = stats.totalAttacks || 0;
    const totalRequests = stats.totalRequests || 0;
    const apiKey = localStorage.getItem('apiUserApiKey') || '';

    // Expiration info
    const isExpired = userData.isExpired || (userData.expiresAt && new Date(userData.expiresAt) < new Date());
    const daysRemaining = userData.daysRemaining || 0;
    const expiresAt = userData.expiresAt;
    const isExpiringSoon = !isExpired && daysRemaining > 0 && daysRemaining <= 7;

    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';

    const progressBar = (used, total, color) => {
        const percent = Math.min(100, (used / total) * 100);
        return (
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
            </div>
        );
    };

    return (
        <div className={`relative min-h-screen transition-colors duration-300 ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.3} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

            <div className="relative z-10 pb-20">
                {/* Header */}
                <header className={`sticky top-0 z-40 border-b ${dark ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl' : 'border-black/[0.07] bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo512.png" alt="" className="w-8 h-8 rounded-xl object-contain" />
                            <div>
                                <p className="text-cyan-500 font-bold tracking-[0.12em] text-sm">API DASHBOARD</p>
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{userData.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={refreshData} disabled={refreshing} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-slate-400 hover:text-white' : 'bg-black/[0.05] text-slate-600 hover:text-slate-900'}`}>
                                <div className={refreshing ? 'animate-spin' : ''}>↻</div>
                            </button>
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'}`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            <button onClick={handleLogout} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-600 hover:text-white'}`}>
                                <FaSignOutAlt size={13} /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* EXPIRATION WARNING BANNER */}
                    {isExpired && (
                        <div className="mb-4 rounded-xl p-3 bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                            <FaExclamationTriangle size={14} />
                            <strong>Account Expired!</strong> Your account has expired. Please contact the administrator to renew.
                        </div>
                    )}

                    {isExpiringSoon && !isExpired && (
                        <div className="mb-4 rounded-xl p-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm flex items-center gap-2">
                            <FaExclamationTriangle size={14} />
                            <strong>⚠️ Account expiring soon!</strong> Your account will expire in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Contact admin to renew.
                        </div>
                    )}

                    {/* Active Attacks Section */}
                    {activeAttacks.length > 0 && (
                        <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <FaBolt className="text-red-500" size={16} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Active Attacks</h3>
                            </div>
                            <div className="space-y-2">
                                {activeAttacks.map(attack => (
                                    <div key={attack.attackId} className={`rounded-lg p-3 border ${dark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className={`text-sm font-mono ${dark ? 'text-white' : 'text-slate-900'}`}>{attack.target}:{attack.port}</p>
                                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Expires in {attack.expiresIn}s</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Requests</p>
                            <p className="text-2xl font-black text-cyan-500">{totalRequests.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Attacks</p>
                            <p className="text-2xl font-black text-red-500">{totalAttacks.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Active Attacks</p>
                            <p className={`text-2xl font-black ${currentActive > 0 ? 'text-green-500' : dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {currentActive} / {limits.maxConcurrent}
                            </p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Account Status</p>
                            <p className={`text-lg font-black ${isExpired ? 'text-red-500' : userData.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                {isExpired ? 'EXPIRED' : userData.status.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* EXPIRATION INFO CARD */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FaCalendarAlt className="text-purple-500" size={16} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Account Expiration</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-purple-500/10">
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Expires On</p>
                                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                                    {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-purple-500/10">
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Days Remaining</p>
                                <p className={`text-lg font-black ${isExpiringSoon ? 'text-yellow-500' : isExpired ? 'text-red-500' : 'text-green-500'}`}>
                                    {isExpired ? 'Expired' : daysRemaining > 0 ? `${daysRemaining} days` : 'Never'}
                                </p>
                                {!isExpired && daysRemaining > 0 && (
                                    <>
                                        {progressBar(daysRemaining, 30, 'bg-purple-500')}
                                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {daysRemaining <= 7 ? '⚠️ Contact admin to renew' : 'Account active'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Simple Demo Code Section */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FaCode className="text-green-500" size={18} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Simple Demo Code</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Language Tabs */}
                            <div className="flex gap-2 border-b pb-2">
                                {['python', 'javascript', 'curl'].map(lang => (
                                    <button key={lang} onClick={() => setActiveTab(lang)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === lang ? 'bg-cyan-600 text-white' : dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                                        {lang === 'python' && <FaPython size={10} />}
                                        {lang === 'javascript' && <FaJs size={10} />}
                                        {lang === 'curl' && <FaTerminal size={10} />}
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Code Display */}
                            <div className={`rounded-lg overflow-hidden ${dark ? 'bg-surface-900' : 'bg-slate-100'}`}>
                                <pre className="p-4 text-xs overflow-x-auto">
                                    <code className={dark ? 'text-slate-300' : 'text-slate-800'}>
                                        {activeTab === 'python' && `import requests

API_KEY = "${apiKey || 'YOUR_API_KEY_HERE'}"
BASE_URL = "${API_URL}"

# Launch attack (30 seconds)
response = requests.post(
    f"{BASE_URL}/api/v1/attack",
    json={"ip": "192.168.1.100", "port": 80, "duration": 30},
    headers={"x-api-key": API_KEY, "Content-Type": "application/json"}
)

print(response.json())`}

                                        {activeTab === 'javascript' && `const axios = require('axios');

const API_KEY = "${apiKey || 'YOUR_API_KEY_HERE'}";
const BASE_URL = "${API_URL}";

// Launch attack (30 seconds)
axios.post(\`\${BASE_URL}/api/v1/attack\`, {
    ip: "192.168.1.100",
    port: 80,
    duration: 30
}, {
    headers: { "x-api-key": API_KEY }
})
.then(res => console.log(res.data))
.catch(err => console.log(err.response?.data || err.message));`}

                                        {activeTab === 'curl' && `# Launch attack (30 seconds)
curl -X POST ${API_URL}/api/v1/attack \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -H "Content-Type: application/json" \\
  -d '{"ip":"192.168.1.100","port":80,"duration":30}'`}
                                    </code>
                                </pre>
                            </div>

                            {/* Copy Button */}
                            <div className="flex justify-end">
                                <button onClick={() => {
                                    let code = '';
                                    if (activeTab === 'python') {
                                        code = `import requests\n\nAPI_KEY = "${apiKey || 'YOUR_API_KEY_HERE'}"\nBASE_URL = "${API_URL}"\n\nresponse = requests.post(\n    f"{BASE_URL}/api/v1/attack",\n    json={"ip": "192.168.1.100", "port": 80, "duration": 30},\n    headers={"x-api-key": API_KEY, "Content-Type": "application/json"}\n)\n\nprint(response.json())`;
                                    } else if (activeTab === 'javascript') {
                                        code = `const axios = require('axios');\n\nconst API_KEY = "${apiKey || 'YOUR_API_KEY_HERE'}";\nconst BASE_URL = "${API_URL}";\n\naxios.post(\`\${BASE_URL}/api/v1/attack\`, {\n    ip: "192.168.1.100",\n    port: 80,\n    duration: 30\n}, {\n    headers: { "x-api-key": API_KEY }\n})\n.then(res => console.log(res.data))\n.catch(err => console.log(err.response?.data || err.message));`;
                                    } else {
                                        code = `curl -X POST ${API_URL}/api/v1/attack \\\n  -H "x-api-key: ${apiKey || 'YOUR_API_KEY_HERE'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"ip":"192.168.1.100","port":80,"duration":30}'`;
                                    }
                                    navigator.clipboard.writeText(code);
                                    setCopiedCode(true);
                                    toast('Code copied!');
                                    setTimeout(() => setCopiedCode(false), 2000);
                                }} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 bg-cyan-600 text-white hover:bg-cyan-500">
                                    {copiedCode ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                    Copy Code
                                </button>
                            </div>

                            {/* Note */}
                            <div className={`p-3 rounded-lg ${dark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                                <p className="text-xs">
                                    💡 <strong>Try it now:</strong> Replace <code className="px-1 rounded bg-slate-700/50">192.168.1.100</code> with your target IP and run the code!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Your Limits Section */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FaChartLine className="text-green-500" size={16} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your Limits</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-cyan-500/10">
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Max Concurrent Attacks</p>
                                <p className="text-2xl font-black text-cyan-500">{limits.maxConcurrent}</p>
                                <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {remainingSlots} slots available
                                </p>
                                {progressBar(currentActive, limits.maxConcurrent, 'bg-cyan-500')}
                            </div>
                            <div className="text-center p-3 rounded-lg bg-red-500/10">
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Max Duration</p>
                                <p className="text-2xl font-black text-red-500">{limits.maxDuration}s</p>
                                <p className={`text-[10px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Maximum attack length
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* API Key Section */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <FaKey className="text-cyan-500" size={16} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your API Key</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className={`text-xs px-3 py-1.5 rounded-lg font-mono break-all ${dark ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                                    {apiKey || 'Click refresh to load'}
                                </code>
                                {apiKey && (
                                    <button onClick={() => copyApiKey(apiKey)} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-slate-100'}`}>
                                        {copied ? <FaCheck className="text-green-500" size={14} /> : <FaCopy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Include this key in all API requests via the <code className="px-1 rounded bg-slate-700/50">x-api-key</code> header
                        </p>
                    </div>

                    {/* Account Info */}
                    <div className={`rounded-xl p-5 border ${cardCls}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FaClock className="text-purple-500" size={16} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Account Info</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Username</p>
                                <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{userData.username}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
                                <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{userData.email}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Member Since</p>
                                <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                                    {new Date(userData.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Attacks</p>
                                <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{totalAttacks}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toast toasts={toasts} />
        </div>
    );
}