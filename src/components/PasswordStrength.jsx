import React from 'react';
import { FaCheck, FaCircle } from 'react-icons/fa';

const checks = [
  { label: 'Min 8 characters',     test: p => p.length >= 8 },
  { label: 'Uppercase letter',      test: p => /[A-Z]/.test(p) },
  { label: 'Number',                test: p => /[0-9]/.test(p) },
  { label: 'Special character',     test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password, theme }) {
  if (!password) return null;
  const passed = checks.filter(c => c.test(password)).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passed ? colors[passed - 1] : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${passed <= 1 ? 'text-red-400' : passed === 2 ? 'text-orange-400' : passed === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
        {labels[passed - 1] || 'Too weak'}
      </p>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-xs ${c.test(password) ? 'text-green-400' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {c.test(password) ? (
              <FaCheck size={12} />
            ) : (
              <FaCircle size={8} />
            )}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}