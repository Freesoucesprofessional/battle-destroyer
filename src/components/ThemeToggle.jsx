import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle({ toggleTheme, theme }) {
  return (
    <button onClick={toggleTheme}
      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center gap-2">
      {theme === 'dark' ? (
        <>
          <FaSun size={14} />
          Light
        </>
      ) : (
        <>
          <FaMoon size={14} />
          Dark
        </>
      )}
    </button>
  );
}