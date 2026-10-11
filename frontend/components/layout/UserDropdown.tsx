'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, Settings, ChevronDown, ShieldCheck, ClipboardList, Loader2 } from 'lucide-react';
import authenticationService from '@/services/auth/authenticationService';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

interface UserInfo {
    id?: string;
    name: string;
    email: string;
    role: string;
}

export default function UserDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: '',
        email: '',
        role: ''
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const storedUser = window.localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUserInfo({
                        id: parsed.id,
                        name: parsed.name || 'Admin',
                        email: parsed.email || '',
                        role: parsed.role || 'ADMIN'
                    });
                } else {
                    const authUsername = window.localStorage.getItem('authUsername');
                    if (authUsername) {
                        setUserInfo({
                            name: authUsername,
                            email: '',
                            role: 'ADMIN'
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Cannot read user from localStorage', e);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await authenticationService.logout();
            toast.success('Đã đăng xuất thành công!');
            setIsOpen(false);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Đang chuyển hướng về trang đăng nhập...');
            window.location.href = '/login';
        } finally {
            setIsLoggingOut(false);
        }
    };

    const initial = userInfo.name ? userInfo.name.trim().split(' ').slice(-1)[0][0].toUpperCase() : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button - Google Drive style circular avatar with blue ring */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="p-0.5 rounded-full ring-2 ring-[#1a73e8] hover:ring-blue-600 transition-all focus:outline-none cursor-pointer shrink-0"
                aria-expanded={isOpen}
                aria-haspopup="true"
                title={`Tài khoản: ${userInfo.name || 'Admin'} (${userInfo.email || userInfo.role || 'ADMIN'})`}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {initial}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                    {/* User Header Profile Card */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                {initial}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {userInfo.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                    {userInfo.email}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                                    <ShieldCheck className="w-3 h-3" />
                                    {userInfo.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="px-2 py-1.5 space-y-0.5">
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300">
                            <span className="text-gray-500 dark:text-slate-400">Chế độ hiển thị</span>
                            <ThemeToggle />
                        </div>
                        <Link
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <Settings className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                            Cài đặt tài khoản
                        </Link>
                        <Link
                            href="/activity"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ClipboardList className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                            Nhật ký hoạt động
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-slate-800 my-1" />

                    {/* Logout Button */}
                    <div className="px-2 pt-0.5">
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" />
                            ) : (
                                <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                            )}
                            <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất khỏi hệ thống'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
