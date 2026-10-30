'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    Home,
    FolderTree,
    Bot,
    ShieldCheck,
    Building2,
    ClipboardList,
    Menu,
    LogOut,
    MoreVertical,
    Trash2,
    Users,
    Settings,
    HardDrive,
    Bell,
    Sparkles,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Plus,
    Clock,
    Star,
    Upload,
    FolderPlus,
    FileText,
    BarChart3,
    KeyRound,
} from 'lucide-react';
import authenticationService from '@/services/auth/authenticationService';
import accessRequestService from '@/services/access/accessRequestService';
import forderService from '@/services/forder/forderService';
import fileManagementService from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';
import FolderContextMenu, { FolderContextTarget } from '@/components/common/FolderContextMenu';
import { CreateFolderModal, RenameFolderModal } from '@/components/files/FileModals';
import apiClient from '@/utils/api/apiClientFixed';

interface NavLinkItem {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
}

// Custom-designed modern Enterprise AI Assistant / Docs Logo
function EnterpriseLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="entLogoBg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1D4ED8" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="entDocGrad" x1="9" y1="8" x2="25" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#EEF2FF" />
                </linearGradient>
                <linearGradient id="entFoldGrad" x1="18" y1="7" x2="25" y2="14" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
            </defs>

            {/* Squircle container with subtle border */}
            <rect
                x="1"
                y="1"
                width="34"
                height="34"
                rx="10"
                fill="url(#entLogoBg)"
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth="1"
            />

            {/* Smart Document Base */}
            <path
                d="M10 8.5C10 7.67 10.67 7 11.5 7H19.5L26 13.5V26.5C26 27.33 25.33 28 24.5 28H11.5C10.67 28 10 27.33 10 26.5V8.5Z"
                fill="url(#entDocGrad)"
            />

            {/* Corner Fold Tab */}
            <path
                d="M19.5 7V12C19.5 12.83 20.17 13.5 21 13.5H26"
                fill="url(#entFoldGrad)"
                opacity="0.9"
            />

            {/* Document Content Bars */}
            <rect x="13" y="16" width="6" height="2" rx="1" fill="#2563EB" />
            <rect x="13" y="19.5" width="10" height="2" rx="1" fill="#94A3B8" />
            <rect x="13" y="23" width="7" height="2" rx="1" fill="#CBD5E1" />
        </svg>
    );
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean | ((v: boolean) => boolean)) => void;
}

function SidebarContent({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeFolderId = searchParams?.get('folderId') || null;

    const [user, setUser] = useState<{ name: string; role: string }>({
        name: '',
        role: '',
    });

    // Folder tree state for "Drive của tôi" (default collapsed on initial load)
    const [sidebarFolderTree, setSidebarFolderTree] = useState<any[]>([]);
    const [isDriveExpanded, setIsDriveExpanded] = useState<boolean>(false);
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
    const [showNewMenu, setShowNewMenu] = useState<boolean>(false);
    const [folderContextMenu, setFolderContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        folder: FolderContextTarget | null;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        folder: null,
    });
    const [createFolderTarget, setCreateFolderTarget] = useState<FolderContextTarget | null>(null);
    const [renamingFolder, setRenamingFolder] = useState<FolderContextTarget | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.name) {
                        setUser({
                            name: parsed.name,
                            role: parsed.role || '',
                        });
                    }
                } catch (e) {}
            }
        }
    }, []);

    const userInitials =
        user.name
            .split(' ')
            .map((w) => w[0])
            .filter(Boolean)
            .slice(-2)
            .join('')
            .toUpperCase() || 'AD';

    const handleLogout = async () => {
        try {
            await authenticationService.logout();
            toast.success('Đã đăng xuất thành công!');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    const [pendingCount, setPendingCount] = useState<number>(0);

    const fetchPendingCount = useCallback(async () => {
        try {
            const count = await accessRequestService.getPendingCount();
            setPendingCount(count);
        } catch (e) {
            // ignore
        }
    }, []);

    // Load folder tree from backend
    const loadSidebarFolderTree = useCallback(async () => {
        try {
            const data = await forderService.getFolderTree();
            setSidebarFolderTree(Array.isArray(data) ? data : []);
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        fetchPendingCount();
        loadSidebarFolderTree();

        const interval = setInterval(() => {
            fetchPendingCount();
        }, 25000);

        const handleWs = () => fetchPendingCount();
        const handleTreeUpdated = () => loadSidebarFolderTree();

        window.addEventListener('new_ws_notification', handleWs);
        window.addEventListener('folder_tree_updated', handleTreeUpdated);

        return () => {
            clearInterval(interval);
            window.removeEventListener('new_ws_notification', handleWs);
            window.removeEventListener('folder_tree_updated', handleTreeUpdated);
        };
    }, [fetchPendingCount, loadSidebarFolderTree]);

    // Auto-expand parents ONLY when activeFolderId is a specific subfolder (not root/all)
    useEffect(() => {
        if (!activeFolderId || activeFolderId === 'all' || sidebarFolderTree.length === 0) return;
        const toExpand = new Set<string>();

        const findAndExpandParents = (nodes: any[], targetId: string, parentIds: string[]): boolean => {
            for (const n of nodes) {
                const nId = n.id.toString();
                if (nId === targetId) {
                    parentIds.forEach((pid) => toExpand.add(pid));
                    return true;
                }
                const subs = n.subForders || n.children || [];
                if (subs.length > 0 && findAndExpandParents(subs, targetId, [...parentIds, nId])) {
                    return true;
                }
            }
            return false;
        };

        findAndExpandParents(sidebarFolderTree, activeFolderId, []);
        if (toExpand.size > 0) {
            setIsDriveExpanded(true);
            setExpandedFolderIds((prev) => new Set([...prev, ...toExpand]));
        }
    }, [activeFolderId, sidebarFolderTree]);

    const findSiblingFolders = (tree: any[], parentId: string | number | null): any[] => {
        if (!parentId || parentId === 'all' || parentId === 'root') {
            return tree;
        }
        const search = (nodes: any[]): any[] | null => {
            for (const n of nodes) {
                if (n.id.toString() === parentId.toString()) {
                    return n.subForders || n.children || [];
                }
                const subs = n.subForders || n.children || [];
                if (subs.length > 0) {
                    const found = search(subs);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(tree) || [];
    };

    const handleCreateFolder = async (name: string) => {
        const trimmedName = name.trim();
        const parentId =
            !createFolderTarget ||
            createFolderTarget.id === 'all' ||
            createFolderTarget.id === 'root'
                ? null
                : createFolderTarget.id;

        // Kiểm tra nhanh phía client trong cùng thư mục cha
        const siblings = findSiblingFolders(sidebarFolderTree, parentId);
        const duplicate = siblings.some(
            (s: any) => s.type !== 'file' && s.name?.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
            const parentName = createFolderTarget?.name || 'Drive của tôi';
            const msg = `Thư mục "${trimmedName}" đã tồn tại trong ${parentName}`;
            toast.error(msg);
            throw new Error(msg);
        }

        try {
            await forderService.createForder({
                name: trimmedName,
                parentId,
            });

            toast.success(`Đã tạo thư mục "${trimmedName}" thành công!`);

            // Tự động mở rộng cây thư mục để thấy thư mục mới
            if (!parentId) {
                setIsDriveExpanded(true);
            } else {
                setExpandedFolderIds((prev) => new Set([...prev, parentId.toString()]));
            }

            // Bắn event để cây thư mục sidebar và trang /files cùng cập nhật
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
            loadSidebarFolderTree();
        } catch (err: any) {
            console.error('Failed to create folder:', err);
            const msg = err?.message || 'Tạo thư mục thất bại';
            toast.error(msg);
            throw new Error(msg);
        }
    };

    const handleRenameFolder = async (newName: string) => {
        if (!renamingFolder) return;
        const trimmedName = newName.trim();

        // Tìm thư mục cha của folder đang đổi tên
        const findParentId = (nodes: any[], targetId: string, currentParentId: string | null): string | null => {
            for (const n of nodes) {
                if (n.id.toString() === targetId) return currentParentId;
                const subs = n.subForders || n.children || [];
                if (subs.length > 0) {
                    const found = findParentId(subs, targetId, n.id.toString());
                    if (found !== null) return found;
                }
            }
            return null;
        };
        const parentId = findParentId(sidebarFolderTree, renamingFolder.id.toString(), null);
        const siblings = findSiblingFolders(sidebarFolderTree, parentId);
        const duplicate = siblings.some(
            (s: any) =>
                s.type !== 'file' &&
                s.id.toString() !== renamingFolder.id.toString() &&
                s.name?.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
            const msg = `Thư mục "${trimmedName}" đã tồn tại trong thư mục này`;
            toast.error(msg);
            throw new Error(msg);
        }

        try {
            await forderService.renameFolder(renamingFolder.id, trimmedName);
            toast.success(`Đã đổi tên thư mục thành "${trimmedName}"!`);
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
            loadSidebarFolderTree();
        } catch (err: any) {
            console.error('Failed to rename folder:', err);
            const msg = err?.message || 'Đổi tên thư mục thất bại';
            toast.error(msg);
            throw new Error(msg);
        }
    };

    const handleDeleteFolder = async (folder: FolderContextTarget) => {
        if (!confirm(`Bạn có chắc chắn muốn chuyển thư mục "${folder.name}" vào thùng rác?`)) return;
        try {
            await forderService.deleteFolder(folder.id);
            toast.success(`Đã chuyển thư mục "${folder.name}" vào thùng rác thành công!`);
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
            loadSidebarFolderTree();
        } catch (err: any) {
            console.error('Failed to delete folder:', err);
            toast.error(err?.message || 'Chuyển thư mục vào thùng rác thất bại');
        }
    };

    const toggleFolderExpand = (folderId: string | number) => {
        const idStr = folderId.toString();
        setExpandedFolderIds((prev) => {
            const next = new Set(prev);
            if (next.has(idStr)) {
                next.delete(idStr);
            } else {
                next.add(idStr);
            }
            return next;
        });
    };

    // Close "+ Mới" menu when clicking outside
    useEffect(() => {
        const handleDocClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.new-menu-container')) {
                setShowNewMenu(false);
            }
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, []);

    // Drag & Drop states and hover auto-expand timer
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
    const hoverExpandTimerRef = React.useRef<{ folderId: string; timer: NodeJS.Timeout } | null>(null);

    const clearHoverExpandTimer = () => {
        if (hoverExpandTimerRef.current?.timer) {
            clearTimeout(hoverExpandTimerRef.current.timer);
            hoverExpandTimerRef.current = null;
        }
    };

    const handleFolderDragOver = (node: any, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        const nodeIdStr = node.id.toString();

        if (dragOverFolderId !== nodeIdStr) {
            setDragOverFolderId(nodeIdStr);
        }

        // Tự động mở thư mục nếu đang đóng và có thư mục con khi hover kéo tệp qua (sau 600ms)
        const subNodes = (node.subForders || node.children || []).filter((c: any) => c.type !== 'file');
        if (subNodes.length > 0 && !expandedFolderIds.has(nodeIdStr)) {
            if (hoverExpandTimerRef.current?.folderId !== nodeIdStr) {
                clearHoverExpandTimer();
                const timer = setTimeout(() => {
                    setExpandedFolderIds((prev) => new Set([...prev, nodeIdStr]));
                }, 600);
                hoverExpandTimerRef.current = { folderId: nodeIdStr, timer };
            }
        }
    };

    const handleFolderDragLeave = (node: any, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nodeIdStr = node.id.toString();
        if (hoverExpandTimerRef.current?.folderId === nodeIdStr) {
            clearHoverExpandTimer();
        }
        if (dragOverFolderId === nodeIdStr) {
            setDragOverFolderId(null);
        }
    };

    const handleDriveRootDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverFolderId !== 'root') {
            setDragOverFolderId('root');
        }
        // Tự động mở cây Drive nếu đang đóng
        if (!isDriveExpanded) {
            if (hoverExpandTimerRef.current?.folderId !== 'root') {
                clearHoverExpandTimer();
                const timer = setTimeout(() => {
                    setIsDriveExpanded(true);
                }, 600);
                hoverExpandTimerRef.current = { folderId: 'root', timer };
            }
        }
    };

    const handleDriveRootDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hoverExpandTimerRef.current?.folderId === 'root') {
            clearHoverExpandTimer();
        }
        if (dragOverFolderId === 'root') {
            setDragOverFolderId(null);
        }
    };

    const handleFolderDrop = async (targetFolderId: number | string | null, targetFolderName: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);
        clearHoverExpandTimer();

        let fileIds: (number | string)[] = [];
        let sourceName = '';
        let oldFolderId: number | string | null = null;
        try {
            const jsonStr = e.dataTransfer.getData('application/json');
            if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed.fileIds)) fileIds = parsed.fileIds;
                if (parsed.sourceName) sourceName = parsed.sourceName;
                if (parsed.oldFolderId !== undefined) oldFolderId = parsed.oldFolderId;
            }
        } catch (err) {}

        if (fileIds.length === 0) {
            const plain = e.dataTransfer.getData('text/plain');
            if (plain) fileIds = [plain];
        }

        if (fileIds.length === 0) return;

        try {
            if (fileIds.length > 1) {
                await fileManagementService.moveFilesBatch(fileIds, targetFolderId);
            } else {
                await fileManagementService.moveFile(fileIds[0], targetFolderId);
            }

            if (targetFolderId != null) {
                setExpandedFolderIds((prev) => new Set([...prev, targetFolderId.toString()]));
            }

            window.dispatchEvent(
                new CustomEvent('file_moved', {
                    detail: {
                        fileIds,
                        sourceName,
                        targetFolderId,
                        targetFolderName,
                        oldFolderId,
                    },
                })
            );
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
        } catch (err: any) {
            console.error('Failed to move file:', err);
            let msg = 'Không thể di chuyển tệp. Vui lòng kiểm tra quyền của bạn!';
            if (err?.status === 403 || err?.statusText === 'Forbidden') {
                msg = 'Bạn không có quyền di chuyển tệp này hoặc không có quyền tải lên thư mục đích!';
            } else if (err?.data?.message) {
                msg = err.data.message;
            } else if (err?.message) {
                msg = err.message;
            }
            toast.error(msg);
        }
    };

    const isDriveActive = pathname.startsWith('/files');

    // Recursive render of tree folders in the sidebar with clear visual hierarchy
    const renderSidebarFolderNodes = (nodes: any[], depth = 0): React.ReactNode => {
        if (!Array.isArray(nodes) || nodes.length === 0) return null;

        return nodes.map((node) => {
            const subNodes = (node.subForders || node.children || []).filter((c: any) => c.type !== 'file');
            const hasChildren = subNodes.length > 0;
            const nodeIdStr = node.id.toString();
            const isExpanded = expandedFolderIds.has(nodeIdStr);
            const isCurrentActive = isDriveActive && activeFolderId === nodeIdStr;
            const isDragOver = dragOverFolderId === nodeIdStr;

            return (
                <div key={node.id} className="w-full">
                    <div
                        onClick={() => router.push(`/files?folderId=${node.id}&folderName=${encodeURIComponent(node.name)}`)}
                        onDragOver={(e) => handleFolderDragOver(node, e)}
                        onDragLeave={(e) => handleFolderDragLeave(node, e)}
                        onDrop={(e) => handleFolderDrop(node.id, node.name, e)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFolderContextMenu({
                                isOpen: true,
                                position: { x: e.clientX, y: e.clientY },
                                folder: { id: node.id, name: node.name },
                            });
                        }}
                        className={`flex items-center gap-1.5 py-1 px-2 rounded-full text-[12px] transition-all cursor-pointer select-none group ${
                            isDragOver
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/80 dark:text-blue-100 ring-2 ring-blue-500 scale-[1.01] font-semibold shadow-xs'
                                : isCurrentActive
                                ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                        }`}
                        title={node.name}
                    >
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolderExpand(node.id);
                                }}
                                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition shrink-0 cursor-pointer"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-[#444746] dark:text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-[#444746] dark:text-slate-400" />
                                )}
                            </button>
                        ) : (
                            <span className="w-4 shrink-0" />
                        )}

                        {isDragOver ? (
                            <FolderOpen className="w-4 h-4 shrink-0 text-blue-600 fill-blue-500/30 animate-pulse" />
                        ) : (
                            <Folder
                                className={`w-4 h-4 shrink-0 ${
                                    isCurrentActive
                                        ? 'text-blue-600 fill-blue-500/20'
                                        : 'text-[#444746] dark:text-slate-400 fill-[#444746]/20'
                                }`}
                            />
                        )}
                        <span className="truncate flex-1 text-[12px]">{node.name}</span>
                    </div>

                    {/* Children nested with clear indentation and vertical guide line */}
                    {isExpanded && hasChildren && (
                        <div className="relative ml-3.5 pl-2 border-l border-gray-200 dark:border-slate-700/60 space-y-0.5 mt-0.5">
                            {renderSidebarFolderNodes(subNodes, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800/80 flex flex-col z-20 transition-all duration-300 ease-in-out select-none ${
                isOpen ? 'w-64' : 'w-16'
            }`}
        >
            {/* 1. Header Logo & Collapse Toggle */}
            <div
                className={`h-[52px] flex items-center border-b border-gray-100 dark:border-slate-800/80 shrink-0 ${
                    isOpen ? 'justify-between px-3.5' : 'justify-center px-2'
                }`}
            >
                {isOpen ? (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <EnterpriseLogo className="w-7 h-7 shrink-0 drop-shadow-sm" />
                            <div className="min-w-0 flex flex-col">
                                <span className="font-extrabold text-[13px] text-gray-900 dark:text-slate-100 tracking-tight truncate leading-tight">
                                    Enterprise Docs
                                </span>
                                <span className="text-[9px] font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase truncate">
                                    Google Drive AI
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                            title="Thu gọn thanh bên"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="w-8.5 h-8.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer group"
                        title="Mở rộng thanh bên"
                    >
                        <EnterpriseLogo className="w-6 h-6 shrink-0 group-hover:scale-105 transition-transform drop-shadow-sm" />
                    </button>
                )}
            </div>

            {/* 2. Navigation Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-3.5 scrollbar-thin">
                {/* SECTION 1: RAG LINKS */}
                <div>
                    <div className="space-y-0.5">
                        {/* 1. Home */}
                        <Link
                            href="/home"
                            title={!isOpen ? 'Home' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/home'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Home className={`w-4 h-4 shrink-0 ${pathname === '/home' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Home</span>}
                        </Link>

                        {/* 2. Hỏi Gemini */}
                        <Link
                            href="/ai"
                            title={!isOpen ? 'Hỏi Gemini' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/ai'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Sparkles className={`w-4 h-4 shrink-0 ${pathname === '/ai' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-blue-600 dark:text-blue-400'}`} />
                            {isOpen && <span className="truncate">Hỏi Gemini</span>}
                        </Link>

                        {/* 3. Tổng quan */}
                        <Link
                            href="/"
                            title={!isOpen ? 'Tổng quan' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <LayoutDashboard className={`w-4 h-4 shrink-0 ${pathname === '/' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Tổng quan</span>}
                        </Link>

                        {/* 4. Activity */}
                        <Link
                            href="/activity"
                            title={!isOpen ? 'Activity' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/activity'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Bell className={`w-4 h-4 shrink-0 ${pathname === '/activity' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && (
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                    <span className="truncate">Activity</span>
                                    {pendingCount > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-medium shrink-0 bg-red-500 text-white font-bold animate-pulse">
                                            {pendingCount > 9 ? '9+' : pendingCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>

                        {/* 5. Drive của tôi (Thay thế Kho File & Cây Thư mục) */}
                        {isOpen ? (
                            <div className="w-full">
                                <div
                                    onClick={() => router.push('/files')}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setFolderContextMenu({
                                            isOpen: true,
                                            position: { x: e.clientX, y: e.clientY },
                                            folder: { id: 'all', name: 'Drive của tôi', isRoot: true },
                                        });
                                    }}
                                    onDragOver={handleDriveRootDragOver}
                                    onDragLeave={handleDriveRootDragLeave}
                                    onDrop={(e) => handleFolderDrop(null, 'Drive của tôi', e)}
                                    className={`flex items-center gap-1.5 py-1.5 px-2 rounded-full text-[12px] transition-all cursor-pointer select-none group ${
                                        dragOverFolderId === 'root'
                                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/80 dark:text-blue-100 ring-2 ring-blue-500 scale-[1.01] font-semibold shadow-xs'
                                            : isDriveActive && !activeFolderId
                                            ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                            : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                                    }`}
                                    title="Drive của tôi"
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDriveExpanded((prev) => !prev);
                                        }}
                                        className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition shrink-0 cursor-pointer"
                                    >
                                        {isDriveExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                        )}
                                    </button>
                                    <HardDrive className={`w-4 h-4 shrink-0 ${isDriveActive && !activeFolderId ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                                    <span className="truncate flex-1">Drive của tôi</span>
                                </div>

                                {/* Cây thư mục lồng nhau phân cấp (bắt đầu thu gọn, thụt lề rõ ràng) */}
                                {isDriveExpanded && (
                                    <div className="relative ml-3.5 pl-2 border-l border-gray-200 dark:border-slate-700/60 space-y-0.5 mt-0.5">
                                        {renderSidebarFolderNodes(sidebarFolderTree)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/files"
                                title="Drive của tôi"
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFolderContextMenu({
                                        isOpen: true,
                                        position: { x: e.clientX, y: e.clientY },
                                        folder: { id: 'all', name: 'Drive của tôi', isRoot: true },
                                    });
                                }}
                                className={`flex items-center justify-center h-9 w-9 mx-auto rounded-full text-[12px] transition-colors ${
                                    isDriveActive
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 font-normal'
                                }`}
                            >
                                <HardDrive className={`w-4 h-4 shrink-0 ${isDriveActive ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            </Link>
                        )}

                        {/* 6. Được chia sẻ với tôi */}
                        <Link
                            href="/shared-with-me"
                            title={!isOpen ? 'Được chia sẻ với tôi' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/shared-with-me'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Users className={`w-4 h-4 shrink-0 ${pathname === '/shared-with-me' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Được chia sẻ với tôi</span>}
                        </Link>

                        {/* 7. Có gắn dấu sao */}
                        <Link
                            href="/starred"
                            title={!isOpen ? 'Có gắn dấu sao' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/starred'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Star className={`w-4 h-4 shrink-0 ${pathname === '/starred' ? 'text-[#001d35] dark:text-[#c2e7ff] fill-current' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Có gắn dấu sao</span>}
                        </Link>

                        {/* 7. Thùng rác */}
                        <Link
                            href="/trash"
                            title={!isOpen ? 'Thùng rác' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname === '/trash'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Trash2 className={`w-4 h-4 shrink-0 ${pathname === '/trash' ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Thùng rác</span>}
                        </Link>
                    </div>
                </div>

                {/* SECTION 2: BẢO MẬT & QUẢN TRỊ */}
                <div>
                    {isOpen && (
                        <div className="px-3 mb-1">
                            <span className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-slate-500 uppercase">
                                Bảo mật & Quản trị
                            </span>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {/* Yêu cầu quyền truy cập (Access Requests) */}
                        <Link
                            href="/access-requests"
                            title={!isOpen ? 'Yêu cầu quyền truy cập' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname.startsWith('/access-requests')
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <KeyRound className={`w-4 h-4 shrink-0 ${pathname.startsWith('/access-requests') ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && (
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                    <span className="truncate">Yêu cầu quyền truy cập</span>
                                    {pendingCount > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-medium shrink-0 bg-red-500 text-white font-bold">
                                            {pendingCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>

                        {/* Cấu hình Phân quyền (Chỉ ADMIN) */}
                        {user.role?.toUpperCase() === 'ADMIN' && (
                            <Link
                                href="/files/permissions"
                                title={!isOpen ? 'Cấu hình Phân quyền' : undefined}
                                className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                    isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                                } ${
                                    pathname.startsWith('/files/permissions')
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                                }`}
                            >
                                <ShieldCheck className={`w-4 h-4 shrink-0 ${pathname.startsWith('/files/permissions') ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                                {isOpen && <span className="truncate">Cấu hình Phân quyền</span>}
                            </Link>
                        )}

                        {/* Quản trị Tổ chức (Chỉ ADMIN) */}
                        {user.role?.toUpperCase() === 'ADMIN' && (
                            <Link
                                href="/departments"
                                title={!isOpen ? 'Quản trị Tổ chức' : undefined}
                                className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                    isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                                } ${
                                    pathname.startsWith('/departments')
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                                }`}
                            >
                                <Building2 className={`w-4 h-4 shrink-0 ${pathname.startsWith('/departments') ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                                {isOpen && <span className="truncate">Quản trị Tổ chức</span>}
                            </Link>
                        )}

                        {/* Người dùng & Nhân sự (Chỉ ADMIN) */}
                        {user.role?.toUpperCase() === 'ADMIN' && (
                            <Link
                                href="/users"
                                title={!isOpen ? 'Người dùng & Nhân sự' : undefined}
                                className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                    isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                                } ${
                                    pathname.startsWith('/users')
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                                }`}
                            >
                                <Users className={`w-4 h-4 shrink-0 ${pathname.startsWith('/users') ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                                {isOpen && <span className="truncate">Người dùng & Nhân sự</span>}
                            </Link>
                        )}

                        {/* Cài đặt Hệ thống */}
                        <Link
                            href="/settings"
                            title={!isOpen ? 'Cài đặt Hệ thống' : undefined}
                            className={`flex items-center gap-2.5 py-1.5 rounded-full text-[12px] transition-colors ${
                                isOpen ? 'px-3' : 'px-0 justify-center h-9 w-9 mx-auto'
                            } ${
                                pathname.startsWith('/settings')
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/60 hover:text-[#1f1f1f] dark:hover:text-slate-100 font-normal'
                            }`}
                        >
                            <Settings className={`w-4 h-4 shrink-0 ${pathname.startsWith('/settings') ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-[#444746] dark:text-slate-400'}`} />
                            {isOpen && <span className="truncate">Cài đặt Hệ thống</span>}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 3. Bottom: Storage quota card - Google Drive style */}
            {isOpen && (
                <div className="px-4 pb-2.5">
                    <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 text-[#444746] dark:text-slate-300 font-medium text-[11.5px]">
                            <HardDrive className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                            <span>Bộ nhớ</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1 mt-2 overflow-hidden">
                            <div className="bg-[#0b57d0] dark:bg-blue-400 h-full rounded-full transition-all" style={{ width: '2.5%' }} />
                        </div>
                        <p className="text-[10.5px] text-gray-500 dark:text-slate-400 mt-1.5 font-normal">
                            Đã sử dụng 2,51 GB trong tổng số 5 TB
                        </p>
                    </div>
                </div>
            )}

            {/* 4. Bottom: User Profile & Logout */}
            <div className="p-2 border-t border-gray-100 dark:border-slate-800/80 shrink-0">
                <div className="flex items-center justify-between p-1 rounded-full hover:bg-gray-100/70 dark:hover:bg-slate-800/70 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-medium text-[11px] flex items-center justify-center shrink-0">
                            {userInitials}
                        </div>
                        {isOpen && (
                            <div className="min-w-0">
                                <p className="text-[12px] font-medium text-gray-900 dark:text-slate-100 truncate">
                                    {user.name || 'Người dùng'}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                                    {user.role || 'Thành viên'}
                                </p>
                            </div>
                        )}
                    </div>

                    {isOpen && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-colors mr-1 cursor-pointer"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {folderContextMenu.isOpen && (
                <FolderContextMenu
                    isOpen={folderContextMenu.isOpen}
                    position={folderContextMenu.position}
                    folder={folderContextMenu.folder}
                    onClose={() => setFolderContextMenu((prev) => ({ ...prev, isOpen: false }))}
                    onNewFolder={(f) => setCreateFolderTarget(f)}
                    onRename={(f) => setRenamingFolder(f)}
                    onAskGemini={(f) => {
                        if (f.id === 'all' || f.isRoot) {
                            router.push('/ai');
                        } else {
                            router.push(`/ai?folderId=${f.id}&folderName=${encodeURIComponent(f.name)}`);
                        }
                    }}
                    onShare={(f) => {
                        if (!f.isRoot && f.id !== 'all') {
                            router.push(`/files/permissions?folderId=${f.id}&name=${encodeURIComponent(f.name)}`);
                        }
                    }}
                    onFolderInfo={(f) => {
                        toast(`Thư mục: ${f.name}`, { icon: '📁' });
                    }}
                    onDelete={(f) => handleDeleteFolder(f)}
                />
            )}

            {createFolderTarget && (
                <CreateFolderModal
                    parentFolderName={createFolderTarget.name}
                    onClose={() => setCreateFolderTarget(null)}
                    onCreate={handleCreateFolder}
                />
            )}

            {renamingFolder && (
                <RenameFolderModal
                    currentName={renamingFolder.name}
                    onClose={() => setRenamingFolder(null)}
                    onRename={handleRenameFolder}
                />
            )}
        </aside>
    );
}

export default function Sidebar(props: SidebarProps) {
    return (
        <Suspense fallback={<aside className="fixed left-0 top-0 h-screen w-16 bg-white dark:bg-slate-900 border-r border-gray-100 z-20" />}>
            <SidebarContent {...props} />
        </Suspense>
    );
}