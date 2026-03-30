import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBolt,
  FaBullseye,
  FaGem,
  FaTelegram,
  FaShieldAlt,
  FaServer,
} from 'react-icons/fa';
import { MdSecurity } from 'react-icons/md';

export default function Footer({ theme }) {
  const dark = theme !== 'light';

  const year = new Date().getFullYear();

  return (
    <footer
      className={`relative z-10 mt-12 border-t ${
        dark
          ? 'border-white/[0.06] bg-surface-900/80 backdrop-blur-xl'
          : 'border-black/[0.07] bg-white/80 backdrop-blur-xl'
      }`}
    >
      {/* Top glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-3 mb-3 group">
              <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center">
                <FaBullseye className="text-red-500" size={16} />
              </div>
              <span
                className="text-red-500 tracking-[0.15em] font-display text-lg font-bold"
              >
                BATTLE-DESTROYER
              </span>
            </Link>
            <p className={`text-xs leading-relaxed max-w-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              The ultimate stress testing panel. Precision operations, real-time monitoring, and a credits-based system.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className={`text-xs font-medium ${dark ? 'text-green-400' : 'text-green-600'}`}>
                All systems operational
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Navigation
            </p>
            <ul className="space-y-2.5">
              {[
                { to: '/dashboard', label: 'Dashboard', icon: FaBolt },
                { to: '/attack', label: 'Attack Panel', icon: FaBullseye },
                { to: '/contact', label: 'Buy Credits', icon: FaGem },
              ].map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-2.5 text-sm transition-colors ${
                      dark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="text-red-500/70" size={12} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Security */}
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Support
            </p>
            <a
              href="https://t.me/BattleDestroyerDDOS_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 hover:bg-blue-600/20 transition-all text-sm font-semibold mb-4"
            >
              <FaTelegram size={15} />
              Telegram
            </a>
            <div className="space-y-2 mt-1">
              {[
                { icon: FaShieldAlt, text: 'CAPTCHA protected' },
                { icon: MdSecurity, text: 'Device fingerprinting' },
                { icon: FaServer, text: 'Credits-based access' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Icon className="text-red-500/50" size={11} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          dark ? 'border-white/[0.05]' : 'border-black/[0.06]'
        }`}>
          <p className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            &copy; {year} Battle-Destroyer. All rights reserved.
          </p>
          <p className={`text-xs flex items-center gap-1.5 ${dark ? 'text-slate-700' : 'text-slate-300'}`}>
            <MdSecurity size={11} />
            For authorized use only
          </p>
        </div>
      </div>
    </footer>
  );
}