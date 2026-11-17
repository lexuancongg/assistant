'use client';

import React, { useState, useEffect } from 'react';
import {
    ExternalLink,
    Download,
    Edit3,
    Copy,
    Sparkles,
    UserPlus,
    Star,
    Info,
    ChevronRight,
    Trash2,
    FileText,
    Activity,
    History,
    Tag,
} from 'lucide-react';

export interface FileContextMenuData {
    x: number;
    y: number;
    file: {
        id: string | number;
        name: string;
        fileType?: string;
        folderId?: string | number | null;
        [key: string]: any;
    };
}

export interface FileContextMenuProps {
    contextMenu: FileContextMenuData | null;
    onClose: () => void;
    onOpenWithGoogleDocs?: (file: any) => void;
    onOpenWithOnlyOffice?: (file: any) => void;
    onDownload?: (file: any) => void;
    onRename?: (file: any) => void;
    onCopy?: (file: any) => void;
    onAskGemini?: (file: any) => void;
    onShare?: (file: any) => void;
    onToggleStar?: (file: any, e: React.MouseEvent) => void;
    isStarred?: boolean;
    onViewDetails?: (file: any) => void;
    onViewActivity?: (file: any) => void;
    onManageVersions?: (file: any) => void;
    onManageTags?: (file: any) => void;
    onDelete?: (file: any) => void;
    selectedCount?: number;
}

export function calculateMenuPosition(
    e: React.MouseEvent,
    menuWidth = 280,
    menuHeight = 440
): { x: number; y: number } {
    const targetEl = e.currentTarget as HTMLElement;
    const isButtonClick =
        targetEl?.tagName === 'BUTTON' ||
        targetEl?.classList.contains('menu-trigger-btn') ||
        Boolean(targetEl?.closest('.menu-trigger-btn'));
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

export function FileContextMenu({
    contextMenu,
    onClose,
    onOpenWithGoogleDocs,
    onOpenWithOnlyOffice,
    onDownload,
    onRename,
    onCopy,
    onAskGemini,
    onShare,
    onToggleStar,
    isStarred = false,
    onViewDetails,
    onViewActivity,
    onManageVersions,
    onManageTags,
    onDelete,
    selectedCount = 1,
}: FileContextMenuProps) {
    const [showOpenWithSubmenu, setShowOpenWithSubmenu] = useState(false);
    const [showFileInfoSubmenu, setShowFileInfoSubmenu] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.context-menu-container') && !target.closest('.menu-trigger-btn')) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (contextMenu) {
            window.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [contextMenu, onClose]);

    if (!contextMenu) return null;

    const file = contextMenu.file;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isSubmenuLeft = contextMenu.x + 288 + 250 > winWidth;

    return (
        <div
            className="fixed z-[100] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 w-72 text-[12.5px] context-menu-container animate-in fade-in zoom-in-95 duration-100 select-none text-gray-800 dark:text-slate-200"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 1. Mở bằng > */}
            <div
                className="relative"
                onMouseEnter={() => setShowOpenWithSubmenu(true)}
                onMouseLeave={() => setShowOpenWithSubmenu(false)}
            >
                <button
                    type="button"
                    onClick={() => {
                        if (onOpenWithGoogleDocs) {
                            onOpenWithGoogleDocs(file);
                        }
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span>Mở bằng</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Submenu for Mở bằng */}
                {showOpenWithSubmenu && (
                    <div
                        className={`absolute top-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 w-64 z-50 text-[12.5px] animate-in fade-in zoom-in-95 duration-75 text-gray-800 dark:text-slate-200 ${
                            isSubmenuLeft ? 'right-full mr-1.5' : 'left-full ml-1.5'
                        }`}
                    >
                        {/* Google Tài liệu */}
                        <button
                            type="button"
                            onClick={() => {
                                if (onOpenWithGoogleDocs) onOpenWithGoogleDocs(file);
                                onClose();
                                setShowOpenWithSubmenu(false);
                            }}
                            className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-[#0b57d0] dark:text-blue-400" />
                                <span>Google Tài liệu</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {/* ONLYOFFICE Editor */}
                        <button
                            type="button"
                            onClick={() => {
                                if (onOpenWithOnlyOffice) onOpenWithOnlyOffice(file);
                                onClose();
                                setShowOpenWithSubmenu(false);
                            }}
                            className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                <span>ONLYOFFICE Editor</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">Trực tuyến</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

            {/* 2. Tải xuống */}
            {onDownload && (
                <button
                    type="button"
                    onClick={() => {
                        onDownload(file);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <Download className="w-4 h-4 text-gray-500" />
                    <span>Tải xuống</span>
                </button>
            )}

            {/* 3. Đổi tên */}
            {onRename && (
                <button
                    type="button"
                    disabled={selectedCount > 1}
                    onClick={() => {
                        onRename(file);
                        onClose();
                    }}
                    className={`w-full px-3.5 py-1.5 flex items-center justify-between transition ${
                        selectedCount > 1
                            ? 'opacity-40 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none'
                            : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer'
                    }`}
                    title={selectedCount > 1 ? 'Không thể đổi tên cùng lúc nhiều tệp' : 'Đổi tên (Ctrl+Alt+E)'}
                >
                    <div className="flex items-center gap-2.5">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                        <span>Đổi tên</span>
                    </div>
                    <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Ctrl+Alt+E</span>
                </button>
            )}

            {/* 4. Tạo bản sao */}
            {onCopy && (
                <button
                    type="button"
                    onClick={() => {
                        onCopy(file);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span>Tạo bản sao</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono tracking-tight">Ctrl+C rồi đến Ctrl+V</span>
                </button>
            )}

            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

            {/* 5. Hỏi Gemini */}
            {onAskGemini && (
                <button
                    type="button"
                    onClick={() => {
                        onAskGemini(file);
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

            {/* 6. Chia sẻ */}
            {onShare && (
                <button
                    type="button"
                    onClick={() => {
                        onShare(file);
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

            {/* 7. Gắn / Xóa dấu sao */}
            {onToggleStar && (
                <button
                    type="button"
                    onClick={(e) => {
                        onToggleStar(file, e);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <Star
                        className={`w-4 h-4 ${
                            isStarred
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-gray-500'
                        }`}
                    />
                    <span>
                        {isStarred
                            ? 'Xóa khỏi mục có gắn dấu sao'
                            : 'Thêm vào mục có gắn dấu sao'}
                    </span>
                </button>
            )}

            {/* Quản lý nhãn (Tags) */}
            {onManageTags && (
                <button
                    type="button"
                    onClick={() => {
                        onManageTags(file);
                        onClose();
                    }}
                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span>Quản lý nhãn (Tags)</span>
                </button>
            )}

            {/* 8. Thông tin về tệp > */}
            {(onViewDetails || onViewActivity || onManageVersions) && (
                <div
                    className="relative"
                    onMouseEnter={() => setShowFileInfoSubmenu(true)}
                    onMouseLeave={() => setShowFileInfoSubmenu(false)}
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (onViewDetails) onViewDetails(file);
                            onClose();
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-gray-500" />
                            <span>Thông tin về tệp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* Submenu for Thông tin về tệp */}
                    {showFileInfoSubmenu && (
                        <div
                            className={`absolute top-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 w-64 z-50 text-[12.5px] animate-in fade-in zoom-in-95 duration-75 text-gray-800 dark:text-slate-200 ${
                                isSubmenuLeft ? 'right-full mr-1.5' : 'left-full ml-1.5'
                            }`}
                        >
                            {/* Thông tin chi tiết */}
                            {onViewDetails && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onViewDetails(file);
                                        onClose();
                                        setShowFileInfoSubmenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Info className="w-4 h-4 text-gray-500" />
                                        <span>Thông tin chi tiết</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono tracking-tight">Alt+V rồi đến D</span>
                                </button>
                            )}

                            {/* Hoạt động */}
                            {onViewActivity && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onViewActivity(file);
                                        onClose();
                                        setShowFileInfoSubmenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Activity className="w-4 h-4 text-gray-500" />
                                        <span>Hoạt động</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono tracking-tight">Alt+V rồi đến A</span>
                                </button>
                            )}

                            {onManageVersions && (
                                <>
                                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                                    {/* Quản lý phiên bản */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onManageVersions(file);
                                            onClose();
                                            setShowFileInfoSubmenu(false);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        <History className="w-4 h-4 text-gray-500" />
                                        <span>Quản lý phiên bản</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 10. Chuyển vào thùng rác */}
            {onDelete && (
                <>
                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                    <button
                        type="button"
                        onClick={() => {
                            onDelete(file);
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
                </>
            )}
        </div>
    );
}

export default FileContextMenu;
