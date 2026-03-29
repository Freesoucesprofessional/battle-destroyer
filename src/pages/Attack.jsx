import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaGem, FaClipboard, FaExclamationTriangle, FaCheckCircle, FaCrown } from 'react-icons/fa';
import Navbar from '../components/Navbar';

export default function Attack({ toggleTheme, theme }) {
  const [user, setUser]           = useState(null);
  const [form, setForm]           = useState({ ip: '', port: '', duration: '' });
  const [errors, setErrors]       = useState({});
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);
  const [launchError, setLaunchError] = useState('');
  const navigate = useNavigate();
  const API_URL  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ── Load user ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/panel/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      setUser(r.data);
      localStorage.setItem('user', JSON.stringify(r.data));
    }).catch(() => { localStorage.clear(); navigate('/login'); });
  }, [navigate]);

  const handle = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setLaunchError('');
  };

  // ── Client-side validation (mirrors backend) ────────────────────────────────
  const validate = () => {
    const errs  = {};
    const MAX   = user?.isPro ? 300 : 60;

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!form.ip)                       errs.ip = 'IP address is required';
    else if (!ipRegex.test(form.ip))    errs.ip = 'Enter a valid IP address';

    const port = parseInt(form.port);
    if (!form.port)                          errs.port = 'Port is required';
    else if (isNaN(port) || port < 1 || port > 65535) errs.port = 'Port must be 1–65535';

    const dur = parseInt(form.duration);
    if (!form.duration)                      errs.duration = 'Duration is required';
    else if (isNaN(dur) || dur < 1)          errs.duration = 'Duration must be at least 1 second';
    else if (dur > MAX)                      errs.duration = `Max duration is ${MAX}s${!user?.isPro ? ' (upgrade to Pro for 300s)' : ''}`;

    return errs;
  };

  // ── Launch ──────────────────────────────────────────────────────────────────
  const launch = async () => {
    setLaunchError('');
    setLaunched(false);

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLaunching(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/api/panel/attack`,
        { ip: form.ip, port: form.port, duration: form.duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local credit count from server response (source of truth)
      setUser(prev => ({ ...prev, credits: data.credits }));
      localStorage.setItem('user', JSON.stringify({ ...user, credits: data.credits }));

      setLaunched(true);
      setTimeout(() => setLaunched(false), 4000);

    } catch (err) {
      const msg = err.response?.data?.message || 'Launch failed. Please try again.';
      setLaunchError(msg);

      // If server says credits changed (e.g. ran out), sync locally
      if (err.response?.data?.credits !== undefined) {
        setUser(prev => ({ ...prev, credits: err.response.data.credits }));
      }
    } finally {
      setLaunching(false);
    }
  };

  const MAX_DURATION = user?.isPro ? 300 : 60;

  const bg   = theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const sub  = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inp  = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';

  if (!user) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className={`text-sm ${sub}`}>Loading...</p>
      </div>
    </div>
  );

  const rules = [
    'Valid public IP address required',
    'Port range: 1 – 65535',
    `Duration: 1 – ${MAX_DURATION} seconds`,
    '1 credit per attack launch',
    'No concurrent attacks',
  ];

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <Navbar toggleTheme={toggleTheme} theme={theme} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${sub}`}>Attack Module</p>
          <h1 className={`text-2xl sm:text-3xl font-black ${text}`}>
            ⚔️ Battle <span className="text-red-500">Attack Hub</span>
          </h1>
          <p className={`text-sm mt-1 ${sub}`}>Configure and launch your attack below</p>
        </div>

        {/* Pro / Free tier banner */}
        {user.isPro ? (
          <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <FaCrown className="text-yellow-400 text-lg shrink-0" />
            <p className="text-yellow-400 text-sm font-semibold">
              Pro Account — up to <span className="font-black">300 second</span> attacks unlocked
            </p>
          </div>
        ) : (
          <div className="mb-5 bg-gray-500/10 border border-gray-500/20 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
            <p className={`text-sm ${sub}`}>
              Free Account — attacks limited to <span className="font-bold text-white">60 seconds</span>
            </p>
            <span className="text-xs bg-red-600/20 border border-red-600/30 text-red-400 px-3 py-1 rounded-lg font-semibold whitespace-nowrap">
              Upgrade to Pro
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Attack Form */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border overflow-hidden ${card}`}>

              {/* Form header */}
              <div className={`px-5 sm:px-6 py-4 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                  <FaClipboard className="text-red-500 text-sm" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${text}`}>Attack Configuration</h2>
                  <p className={`text-xs ${sub}`}>Fill in target details below</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">

                {/* IP */}
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Target IP Address</label>
                  <input
                    name="ip" value={form.ip} onChange={handle}
                    placeholder="e.g. 203.0.113.1"
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.ip ? 'border-red-500' : ''}`}
                  />
                  {errors.ip && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.ip}</p>}
                </div>

                {/* Port + Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Port</label>
                    <input
                      name="port" type="number" value={form.port} onChange={handle}
                      placeholder="e.g. 8080" min="1" max="65535"
                      className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.port ? 'border-red-500' : ''}`}
                    />
                    {errors.port && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.port}</p>}
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                      Duration (seconds)
                      <span className={`ml-2 normal-case font-normal ${user.isPro ? 'text-yellow-500' : 'text-gray-500'}`}>
                        max {MAX_DURATION}s
                      </span>
                    </label>
                    <input
                      name="duration" type="number" value={form.duration} onChange={handle}
                      placeholder={`1 – ${MAX_DURATION}`} min="1" max={MAX_DURATION}
                      className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.duration ? 'border-red-500' : ''}`}
                    />
                    {errors.duration && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.duration}</p>}
                  </div>
                </div>

                {/* Preview */}
                {(form.ip || form.port || form.duration) && (
                  <div className={`rounded-xl p-4 border font-mono text-xs space-y-1 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={sub}>Attack Preview:</p>
                    <p className="text-green-400">Target: <span className="text-white">{form.ip || '—'}:{form.port || '—'}</span></p>
                    <p className="text-green-400">Duration: <span className="text-white">{form.duration ? `${form.duration}s` : '—'}</span></p>
                    <p className="text-green-400">Mode: <span className={user.isPro ? 'text-yellow-400' : 'text-white'}>{user.isPro ? '👑 Pro (300s max)' : 'Free (60s max)'}</span></p>
                  </div>
                )}

                {/* Error */}
                {launchError && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <FaExclamationTriangle size={16} />{launchError}
                  </div>
                )}

                {/* Success */}
                {launched && (
                  <div className="bg-green-500/10 border border-green-500/40 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <FaCheckCircle size={16} />
                    Attack launched on {form.ip}:{form.port} for {form.duration}s — {user.credits} credits remaining
                  </div>
                )}

                {/* Launch Button */}
                <button
                  onClick={launch}
                  disabled={launching || user.credits < 1}
                  className={`w-full py-4 rounded-xl font-black text-base tracking-wider transition-all flex items-center justify-center gap-3 ${
                    user.credits < 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : launching
                        ? 'bg-red-700 text-white cursor-wait'
                        : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xl shadow-red-900/30'
                  }`}>
                  {launching ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Launching Attack...</>
                  ) : user.credits < 1 ? (
                    '⛔ Insufficient Credits'
                  ) : (
                    '🚀 Launch Attack'
                  )}
                </button>

                {user.credits < 1 && (
                  <p className={`text-xs text-center ${sub}`}>
                    You need at least 1 credit to launch. Share your referral link to earn more.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Credits card */}
            <div className={`rounded-2xl p-5 border ${card}`}>
              <div className="flex items-center gap-2 mb-3">
                <FaGem className="text-lg text-red-500" />
                <h3 className={`font-bold text-sm ${text}`}>Available Credits</h3>
              </div>
              <p className={`font-black text-5xl mb-1 ${user.credits > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                {user.credits}
              </p>
              <p className={`text-xs ${sub}`}>credits remaining</p>
              <div className={`mt-4 h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
                  style={{ width: `${Math.min((user.credits / 10) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Rules */}
            <div className={`rounded-2xl p-5 border ${card}`}>
              <div className="flex items-center gap-2 mb-3">
                <FaClipboard className="text-red-500" />
                <h3 className={`font-bold text-sm ${text}`}>Attack Rules</h3>
              </div>
              <ul className="space-y-2">
                {rules.map((rule, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${sub}`}>
                    <span className="text-red-500 mt-0.5">▸</span>{rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <p className="text-yellow-400 font-bold text-xs mb-1 flex items-center gap-2">
                <FaExclamationTriangle size={14} /> Warning
              </p>
              <p className="text-yellow-500/70 text-xs leading-relaxed">
                Only use this tool on servers you own or have explicit permission to test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}