import React from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function Toast({ toasts }) {
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