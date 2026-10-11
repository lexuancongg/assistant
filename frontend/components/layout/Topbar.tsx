'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    HelpCircle,
    Settings,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import UserDropdown from './UserDropdown';
import toast from 'react-hot-toast';

interface TopbarProps {
    breadcrumb?: string[];
}

export default function Topbar({ breadcrumb = [] }: TopbarProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/ai?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="sticky top-0 right-0 h-[52px] bg-white dark:bg-slate-900 z-20 border-b border-gray-100 dark:border-slate-800 transition-colors duration-200 select-none">
            <div className="h-full flex items-center justify-between gap-4 px-5">
                {/* 1. Google Drive Capsule Omni-Search Bar (Aligned with content below) */}
                <div className="flex-1 max-w-[720px]">
                    <form onSubmit={handleSearch} className="w-full">
                        <div className="flex items-center bg-[#edf2fc] hover:bg-[#e1e9f5] focus-within:bg-white focus-within:shadow-md dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:focus-within:bg-slate-900 border border-transparent focus-within:border-blue-400 rounded-full h-[38px] px-3 transition-all">
                            {/* Standard Search Icon */}
                            <div className="pl-0.5 pr-2.5 flex items-center justify-center text-[#444746] dark:text-slate-300 shrink-0 pointer-events-none">
                                <Search className="w-4.5 h-4.5 stroke-[1.8]" />
                            </div>

                            {/* Search input */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhận câu trả lời từ Drive"
                                className="w-full bg-transparent outline-none text-[13.5px] text-[#1f1f1f] dark:text-slate-100 placeholder:text-[#444746] dark:placeholder:text-slate-400 font-normal"
                            />

                            {/* Clear search text */}
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 mr-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* Right icons inside search capsule */}
                            <div className="flex items-center gap-0.5 shrink-0 text-[#444746] dark:text-slate-300">
                                <button
                                    type="button"
                                    onClick={() => router.push('/files')}
                                    className="p-1.5 rounded-full hover:bg-gray-300/50 dark:hover:bg-slate-700 transition cursor-pointer"
                                    title="Duyệt tệp lưu trữ"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="16" rx="2" />
                                        <path d="M7 8h10" />
                                        <path d="M7 12h10" />
                                        <circle cx="17" cy="16" r="2" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/assistant')}
                                    className="p-1.5 rounded-full hover:bg-gray-300/50 dark:hover:bg-slate-700 transition cursor-pointer"
                                    title="Tùy chọn tìm kiếm"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* 3. Right: Exact 5 Google Drive Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Help (?) */}
                    <button
                        type="button"
                        onClick={() => toast('Trung tâm hỗ trợ Google Drive', { icon: 'ℹ️' })}
                        className="p-2 rounded-full text-[#444746] dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Hỗ trợ"
                    >
                        <HelpCircle className="w-4.5 h-4.5 stroke-[1.8]" />
                    </button>

                    {/* Settings (⚙) */}
                    <button
                        type="button"
                        onClick={() => router.push('/settings')}
                        className="p-2 rounded-full text-[#444746] dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Cài đặt"
                    >
                        <Settings className="w-4.5 h-4.5 stroke-[1.8]" />
                    </button>

                    {/* Gemini AI Multi-color Sparkle Star */}
                    <button
                        type="button"
                        onClick={() => router.push('/ai')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer group"
                        title="Hỏi trợ lý AI Gemini"
                    >
                        <svg className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
                                fill="url(#topbar-gemini-gradient)"
                            />
                            <defs>
                                <linearGradient id="topbar-gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#1a73e8" />
                                    <stop offset="35%" stopColor="#8ab4f8" />
                                    <stop offset="70%" stopColor="#c58af9" />
                                    <stop offset="100%" stopColor="#ea4335" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </button>

                    {/* Google Apps 9-dots menu */}
                    <button
                        type="button"
                        onClick={() => router.push('/files')}
                        className="p-2 rounded-full text-[#444746] dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Các ứng dụng của Google"
                    >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                            <path d="M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        </svg>
                    </button>

                    {/* User profile avatar with Google blue ring */}
                    <div className="ml-1">
                        <UserDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
}
