import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function Modal({ title, onClose, children, dark, size = 'md' }) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-3xl'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`relative w-full ${sizeClasses[size]}
                rounded-t-2xl sm:rounded-2xl border shadow-2xl
                flex flex-col
                max-h-[92vh] sm:max-h-[90vh]
                ${dark ? 'bg-surface-800 border-white/[0.1] backdrop-blur-xl' : 'bg-white border-slate-200'}`}
            >
                {/* Sticky Header */}
                <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b shrink-0
                    ${dark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                    <h2 className={`font-black text-sm sm:text-base truncate pr-4 ${dark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.05em' }}>
                        {title}
                    </h2>
                    <button onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0
                            ${dark ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}