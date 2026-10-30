'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Settings, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import authenticationService from '@/services/auth/authenticationService';
import toast from 'react-hot-toast';

interface UserInfo {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

export default function UserDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: '',
        email: '',
        role: '',
        avatarUrl: ''
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadUser = () => {
            try {
                if (typeof window !== 'undefined') {
                    const storedUser = window.localStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        setUserInfo({
                            id: parsed.id,
                            name: parsed.name || 'Admin',
                            email: parsed.email || '',
                            role: parsed.role || 'ADMIN',
                            avatarUrl: parsed.avatarUrl || ''
                        });
                    } else {
                        const authUsername = window.localStorage.getItem('authUsername');
                        if (authUsername) {
                            setUserInfo({
                                name: authUsername,
                                email: '',
                                role: 'ADMIN',
                                avatarUrl: ''
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('Cannot read user from localStorage', e);
            }
        };

        loadUser();
        window.addEventListener('user-profile-updated', loadUser);
        window.addEventListener('storage', loadUser);
        return () => {
            window.removeEventListener('user-profile-updated', loadUser);
            window.removeEventListener('storage', loadUser);
        };
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

    // Extract clean display name (strip "(Admin)" or brackets) and clean initial letter
    const cleanDisplayName = (userInfo.name || 'Người dùng').replace(/\s*\([^)]*\)\s*/g, '').trim() || userInfo.name || 'Người dùng';
    const initial = cleanDisplayName ? cleanDisplayName.split(' ').slice(-1)[0][0].toUpperCase() : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button - Google Drive style circular avatar */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="p-0.5 rounded-full ring-2 ring-[#1a73e8] hover:ring-blue-600 transition-all focus:outline-none cursor-pointer shrink-0"
                aria-expanded={isOpen}
                aria-haspopup="true"
                title={`Tài khoản: ${cleanDisplayName} (${userInfo.email || userInfo.role || 'ADMIN'})`}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
                    {userInfo.avatarUrl ? (
                        <img src={userInfo.avatarUrl} alt={cleanDisplayName} className="w-full h-full object-cover" />
                    ) : (
                        initial
                    )}
                </div>
            </button>

            {/* Dropdown Menu - Sleek & Compact Context Menu Style */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] border border-[#E0E2EC] dark:border-slate-800 py-1.5 select-none animate-in fade-in zoom-in-95 duration-100 font-sans z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Compact User Header Profile */}
                    <div className="px-3.5 py-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs overflow-hidden">
                                {userInfo.avatarUrl ? (
                                    <img src={userInfo.avatarUrl} alt={cleanDisplayName} className="w-full h-full object-cover" />
                                ) : (
                                    initial
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] truncate leading-tight">
                                    {cleanDisplayName}
                                </p>
                                <p className="text-[11.5px] text-[#747775] dark:text-slate-400 truncate mt-0.5 font-normal">
                                    {userInfo.email || 'admin@enterprise.ai'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

                    {/* 1. Cài đặt */}
                    <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0 stroke-[1.8]" />
                            <span className="text-[#1F1F1F] dark:text-[#E3E3E3]">Cài đặt</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#747775] dark:text-slate-400 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    </Link>

                    {/* 2. Nhật ký */}
                    <Link
                        href="/activity"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <ClipboardList className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0 stroke-[1.8]" />
                            <span className="text-[#1F1F1F] dark:text-[#E3E3E3]">Nhật ký</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#747775] dark:text-slate-400 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    </Link>

                    {/* Divider */}
                    <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

                    {/* 3. Đăng xuất */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer group disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            {isLoggingOut ? (
                                <Loader2 className="w-[18px] h-[18px] animate-spin text-red-600 dark:text-red-400 shrink-0" />
                            ) : (
                                <LogOut className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors shrink-0 stroke-[1.8]" />
                            )}
                            <span className="text-[#1F1F1F] dark:text-[#E3E3E3] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                            </span>
                        </div>
                        <span className="text-[11px] text-[#747775] dark:text-slate-400 font-normal group-hover:text-red-500">
                            Alt+Q
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
