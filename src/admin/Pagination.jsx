import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ currentPage, totalPages, onPageChange, dark }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 text-sm ${dark
                    ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <FaChevronLeft size={10} /> Prev
            </button>
            <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentPage} / {totalPages}
            </span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 text-sm ${dark
                    ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Next <FaChevronRight size={10} />
            </button>
        </div>
    );
}