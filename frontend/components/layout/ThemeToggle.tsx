'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/themeContext';

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { resolvedTheme, toggleTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                    ? 'bg-slate-800 border border-slate-700/80'
                    : 'bg-slate-200/90 hover:bg-slate-300/90 border border-slate-300/60'
            } ${className}`}
            title={`Chuyển sang giao diện ${isDark ? 'Sáng' : 'Tối'}`}
            aria-label="Chuyển đổi giao diện sáng tối"
        >
            {/* Background static icons inside the track */}
            <span className="absolute left-1.5 flex items-center justify-center pointer-events-none">
                <Sun className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-slate-500 opacity-40' : 'text-amber-500 opacity-90'}`} />
            </span>
            <span className="absolute right-1.5 flex items-center justify-center pointer-events-none">
                <Moon className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-indigo-300 opacity-90' : 'text-slate-400 opacity-40'}`} />
            </span>

            {/* Sliding Round Knob */}
            <span
                className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-md ring-0 transition-transform duration-300 ease-spring ${
                    isDark ? 'translate-x-7' : 'translate-x-0'
                }`}
            >
                {isDark ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/30" />
                ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                )}
            </span>
        </button>
    );
}
