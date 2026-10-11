'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    FolderPlus,
    Download,
    Edit3,
    UserPlus,
    Folder,
    Info,
    Trash2,
    ChevronRight,
} from 'lucide-react';

export interface FolderContextTarget {
    id: number | string;
    name: string;
    isRoot?: boolean;
}

export interface FolderContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    folder: FolderContextTarget | null;
    onClose: () => void;
    onNewFolder?: (folder: FolderContextTarget) => void;
    onDownload?: (folder: FolderContextTarget) => void;
    onRename?: (folder: FolderContextTarget) => void;
    onAskGemini?: (folder: FolderContextTarget) => void;
    onShare?: (folder: FolderContextTarget) => void;
    onOrganize?: (folder: FolderContextTarget) => void;
    onFolderInfo?: (folder: FolderContextTarget) => void;
    onDelete?: (folder: FolderContextTarget) => void;
}

export default function FolderContextMenu({
    isOpen,
    position,
    folder,
    onClose,
    onNewFolder,
    onDownload,
    onRename,
    onAskGemini,
    onShare,
    onOrganize,
    onFolderInfo,
    onDelete,
}: FolderContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });
    const isRoot = Boolean(folder?.isRoot || folder?.id === 'all' || folder?.id === 'root');

    // Calculate smart position to avoid overflowing screen boundaries
    useEffect(() => {
        if (!isOpen) return;
        const menuWidth = 265;
        const menuHeight = isRoot ? 160 : 360;
        let x = position.x;
        let y = position.y;

        if (typeof window !== 'undefined') {
            if (x + menuWidth > window.innerWidth) {
                x = Math.max(8, window.innerWidth - menuWidth - 10);
            }
            if (y + menuHeight > window.innerHeight) {
                y = Math.max(8, window.innerHeight - menuHeight - 10);
            }
        }

        setAdjustedPos({ x, y });
    }, [isOpen, position, isRoot]);

    // Close on click outside, Escape, or scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !folder) return null;

    const handleAction = (callback?: (f: FolderContextTarget) => void) => {
        onClose();
        if (callback && folder) {
            callback(folder);
        }
    };

    return (
        <div
            ref={menuRef}
            style={{
                top: `${adjustedPos.y}px`,
                left: `${adjustedPos.x}px`,
            }}
            className="fixed z-[9999] w-[265px] bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] border border-[#E0E2EC] dark:border-slate-800 py-2 select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* 1. Thư mục mới */}
            <button
                type="button"
                onClick={() => handleAction(onNewFolder)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <FolderPlus className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    <span>Thư mục mới</span>
                </div>
                <span className="text-[11px] text-[#747775] dark:text-slate-400 font-normal">
                    Alt+C rồi đến F
                </span>
            </button>

            {/* Divider */}
            <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

            {!isRoot && (
                <>
                    {/* 2. Tải xuống */}
                    <button
                        type="button"
                        onClick={() => handleAction(onDownload)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Download className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                            <span>Tải xuống</span>
                        </div>
                    </button>

                    {/* 3. Đổi tên */}
                    <button
                        type="button"
                        onClick={() => handleAction(onRename)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Edit3 className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                            <span>Đổi tên</span>
                        </div>
                        <span className="text-[11px] text-[#747775] dark:text-slate-400 font-normal">
                            Ctrl+Alt+E
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />
                </>
            )}

            {/* 4. Hỏi Gemini */}
            <button
                type="button"
                onClick={() => handleAction(onAskGemini)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-[18px] h-[18px] text-[#1A73E8] dark:text-[#8AB4F8] shrink-0"
                    >
                        <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
                    </svg>
                    <span className="font-normal text-[#1F1F1F] dark:text-white">
                        {isRoot ? 'Hỏi Gemini về Drive' : 'Hỏi Gemini'}
                    </span>
                </div>
            </button>

            {!isRoot && (
                <>
                    {/* Divider */}
                    <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

                    {/* 5. Chia sẻ */}
                    <button
                        type="button"
                        onClick={() => handleAction(onShare)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <UserPlus className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                            <span>Chia sẻ</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#747775] dark:text-slate-400 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    </button>

                    {/* 6. Sắp xếp */}
                    <button
                        type="button"
                        onClick={() => handleAction(onOrganize)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Folder className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                            <span>Sắp xếp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#747775] dark:text-slate-400 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    </button>
                </>
            )}

            {/* Divider */}
            <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

            {/* 7. Thông tin về thư mục */}
            <button
                type="button"
                onClick={() => handleAction(onFolderInfo)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <Info className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                    <span>{isRoot ? 'Thông tin về Drive của tôi' : 'Thông tin về thư mục'}</span>
                </div>
                {!isRoot && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#747775] dark:text-slate-400 group-hover:text-[#1F1F1F] dark:group-hover:text-white shrink-0" />
                )}
            </button>

            {!isRoot && (
                <>
                    {/* Divider */}
                    <div className="h-px bg-[#E0E2EC] dark:bg-slate-800 my-1" />

                    {/* 8. Chuyển vào thùng rác */}
                    <button
                        type="button"
                        onClick={() => handleAction(onDelete)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[13px] hover:bg-red-50/60 dark:hover:bg-red-950/30 text-gray-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-[18px] h-[18px] text-[#444746] dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 shrink-0" />
                            <span>Chuyển vào thùng rác</span>
                        </div>
                        <span className="text-[11px] text-[#747775] dark:text-slate-400 group-hover:text-red-500 font-normal">
                            Delete
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
