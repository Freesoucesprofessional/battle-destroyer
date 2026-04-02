// components/ApiUserStatsMonitor.jsx
import React, { useState, useEffect } from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios'

export default function ApiUserStatsMonitor({ apiUser, token, dark }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL 
    
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/admin/api-users/${apiUser._id}/stats`, {
                    headers: { 'x-admin-token': token }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
        
        return () => clearInterval(interval);
    }, [apiUser._id, token]);
    
    if (loading) return <div>Loading stats...</div>;
    if (!stats) return null;
    
    return (
        <div className="space-y-4">
            {/* Usage Bars */}
            <div className="space-y-2">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Requests (Last Minute)</span>
                        <span className={stats.isRateLimited.minute ? 'text-red-500' : ''}>
                            {stats.currentUsage.requestsLastMinute} / {stats.limits.rateLimits.requestsPerMinute}
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                        <div 
                            className={`h-full transition-all ${stats.usagePercentages.requestsMinute > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, stats.usagePercentages.requestsMinute)}%` }}
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Requests (Last Hour)</span>
                        <span className={stats.isRateLimited.hour ? 'text-red-500' : ''}>
                            {stats.currentUsage.requestsLastHour} / {stats.limits.rateLimits.requestsPerHour}
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                        <div 
                            className={`h-full transition-all ${stats.usagePercentages.requestsHour > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, stats.usagePercentages.requestsHour)}%` }}
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Attacks (Last Hour)</span>
                        <span>
                            {stats.currentUsage.attacksLastHour} / {stats.limits.attackLimits.maxAttacksPerHour}
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                        <div 
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${Math.min(100, (stats.currentUsage.attacksLastHour / stats.limits.attackLimits.maxAttacksPerHour) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Active Alerts */}
            {stats.isRateLimited.minute && (
                <div className="rounded-lg p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <FaExclamationTriangle size={12} />
                    Rate limited! Too many requests in the last minute.
                </div>
            )}
            
            {/* Reset Times */}
            <div className="text-xs space-y-1">
                <p className="flex items-center gap-1">
                    <FaClock size={10} />
                    Resets in: 
                    {stats.resetTimes.minute && (
                        <span className="ml-2">
                            Minute: {Math.ceil((new Date(stats.resetTimes.minute) - new Date()) / 1000)}s
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}