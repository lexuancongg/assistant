'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
    const [mounted, setMounted] = useState<boolean>(false);

    // Tính toán theme thực tế (resolvedTheme) dựa trên theme được chọn
    const getSystemTheme = (): ResolvedTheme => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (targetTheme: Theme) => {
        if (typeof document === 'undefined') return;

        const effective = targetTheme === 'system' ? getSystemTheme() : targetTheme;
        const root = document.documentElement;

        // Bật animation chuyển theme mượt mà
        root.classList.add('theme-transition');

        if (effective === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            root.style.colorScheme = 'light';
        }

        setResolvedTheme(effective);

        // Tắt animation sau khi đổi xong để không ảnh hưởng hiệu năng
        setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 300);
    };

    // Khởi tạo theme khi mount lần đầu
    useEffect(() => {
        setMounted(true);
        let savedTheme = 'light' as Theme;
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                savedTheme = stored;
            }
        } catch (e) {
            console.warn('Cannot read theme from localStorage', e);
        }

        setThemeState(savedTheme);
        applyTheme(savedTheme);

        // Lắng nghe sự thay đổi chế độ hệ điều hành (OS Dark/Light mode)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const currentSaved = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system';
            if (currentSaved === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.warn('Cannot save theme to localStorage', e);
        }
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
