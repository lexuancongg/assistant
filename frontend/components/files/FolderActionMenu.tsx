'use client';

import React, { useEffect, useRef } from 'react';
import {
    Download,
    Edit3,
    Sparkles,
    UserPlus,
    Info,
    ChevronRight,
    Trash2,
} from 'lucide-react';

export interface FolderMenuData {
    x: number;
    y: number;
    folder: {
        id: string | number;
        name: string;
        [key: string]: any;
    };
}

export interface FolderActionMenuProps {
    menu: FolderMenuData | null;
    onClose: () => void;
    onDownloadFolder?: (folder: any) => void;
    onRenameFolder?: (folder: any) => void;
    onAskGemini?: (folder: any) => void;
    onShareFolder?: (folder: any) => void;
    onFolderInfo?: (folder: any) => void;
    onDeleteFolder?: (folder: any) => void;
}

export function calculateFolderMenuPosition(
    e: React.MouseEvent,
    menuWidth = 280,
    menuHeight = 300
): { x: number; y: number } {
    const targetEl = e.currentTarget as HTMLElement;
    const isButtonClick =
        targetEl?.tagName === 'BUTTON' ||
        targetEl?.classList.contains('folder-menu-trigger') ||
        Boolean(targetEl?.closest('.folder-menu-trigger'));
    const rect = targetEl ? targetEl.getBoundingClientRect() : null;

    let x = e.clientX;
    let y = e.clientY;

    if (rect && (isButtonClick || (e.clientX === 0 && e.clientY === 0))) {
        x = rect.right - menuWidth;
        y = rect.bottom + 4;
    }

    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    if (x + menuWidth > winWidth) {
        x = winWidth - menuWidth - 16;
    }
    if (x < 10) x = 10;

    if (y + menuHeight > winHeight) {
        if (rect && isButtonClick && rect.top - menuHeight > 0) {
            y = rect.top - menuHeight - 4;
        } else {
            y = Math.max(10, winHeight - menuHeight - 16);
        }
    }
    if (y < 10) y = 10;

    return { x, y };
}

export function FolderActionMenu({
    menu,
    onClose,
    onDownloadFolder,
    onRenameFolder,
    onAskGemini,
    onShareFolder,
    onFolderInfo,
    onDeleteFolder,
}: FolderActionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.folder-context-menu-container') && !target.closest('.folder-menu-trigger')) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (menu) {
            window.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [menu, onClose]);

    if (!menu) return null;

    const folder = menu.folder;

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 w-72 text-[12.5px] folder-context-menu-container animate-in fade-in zoom-in-95 duration-100 select-none text-gray-800 dark:text-slate-200"
            style={{ left: menu.x, top: menu.y }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 1. Tải xuống */}
            {onDownloadFolder && (
                <button
                    type="button"
                    onClick={() => {
                        onDownloadFolder(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <Download className="w-4 h-4 text-gray-500" />
                    <span>Tải xuống</span>
                </button>
            )}

            {/* 2. Đổi tên */}
            {onRenameFolder && (
                <button
                    type="button"
                    onClick={() => {
                        onRenameFolder(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                        <span>Đổi tên</span>
                    </div>
                    <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Ctrl+Alt+E</span>
                </button>
            )}

            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

            {/* 3. Hỏi Gemini */}
            {onAskGemini && (
                <button
                    type="button"
                    onClick={() => {
                        onAskGemini(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-blue-400 fill-[#1a73e8]/20" />
                        <span>Hỏi Gemini</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-blue-900/60 dark:text-blue-200">
                        Mới
                    </span>
                </button>
            )}

            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

            {/* 4. Chia sẻ > */}
            {onShareFolder && (
                <button
                    type="button"
                    onClick={() => {
                        onShareFolder(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <UserPlus className="w-4 h-4 text-gray-500" />
                        <span>Chia sẻ</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
            )}

            {/* 5. Thông tin về thư mục > */}
            {onFolderInfo && (
                <button
                    type="button"
                    onClick={() => {
                        onFolderInfo(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Info className="w-4 h-4 text-gray-500" />
                        <span>Thông tin về thư mục</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
            )}

            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

            {/* 6. Chuyển vào thùng rác */}
            {onDeleteFolder && (
                <button
                    type="button"
                    onClick={() => {
                        onDeleteFolder(folder);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4" />
                        <span>Chuyển vào thùng rác</span>
                    </div>
                    <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Delete</span>
                </button>
            )}
        </div>
    );
}

export default FolderActionMenu;
