'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    ChevronDown,
    ChevronRight,
    List,
    LayoutGrid,
    Check,
    Info,
    Folder,
    FileSpreadsheet,
    FileText,
    FileCode,
    FileBox,
    Presentation,
    Video,
    Archive,
    Image as ImageIcon,
    Headphones,
    Palette,
    Globe,
    CornerUpRight,
    Sparkles,
    Bot,
    ClipboardList,
    Users,
    HardDrive,
    Clock,
    MoreVertical,
    ExternalLink,
    Share2,
    Download,
    Trash2,
    X,
    Filter,
    Upload,
    Calendar,
    RefreshCw,
    Edit3,
    UserPlus,
    Link2,
    Copy,
    FolderInput,
    Eye,
    Star,
    ThumbsDown,
    Radio,
    CloudOff,
    Mic,
    Shield,
    History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import forderService from '@/services/forder/forderService';
import activityService, { ActivityLogDto } from '@/services/activity/activityService';
import userService, { UserDto } from '@/services/user/userService';
import { UploadFileModal } from '@/components/files/FileModals';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';
import apiClient from '@/utils/api/apiClientFixed';

// Visual configuration helper for file types
function getFileTypeConfig(extOrType: string) {
    const ext = extOrType.toLowerCase();

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-emerald-700 dark:text-emerald-400',
            bgColor: 'bg-emerald-100/90 dark:bg-emerald-950/60',
            category: 'Spreadsheets',
        };
    }
    if (['docx', 'doc'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Documents',
        };
    }
    if (['pdf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-rose-600 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'PDFs',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Presentations',
        };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return {
            icon: Video,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100/90 dark:bg-purple-950/60',
            category: 'Videos',
        };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
        return {
            icon: ImageIcon,
            color: 'text-rose-500 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'Photos & images',
        };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return {
            icon: Archive,
            color: 'text-amber-700 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Archives (zip)',
        };
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        return {
            icon: Headphones,
            color: 'text-orange-500 dark:text-orange-400',
            bgColor: 'bg-orange-100/90 dark:bg-orange-950/60',
            category: 'Audio',
        };
    }
    if (['md', 'markdown'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-blue-500 dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Markdown',
        };
    }
    if (['html', 'htm', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'css'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100/90 dark:bg-indigo-950/60',
            category: 'Code',
        };
    }

    return {
        icon: FileBox,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-100/90 dark:bg-sky-950/60',
        category: 'File',
    };
}

// Generate pastel avatar background color based on name
function getAvatarColor(name: string) {
    const colors = [
        'bg-blue-600 text-white',
        'bg-indigo-600 text-white',
        'bg-purple-600 text-white',
        'bg-rose-600 text-white',
        'bg-amber-600 text-white',
        'bg-emerald-600 text-white',
        'bg-teal-600 text-white',
        'bg-slate-700 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Format date relative like Google Drive (Vietnamese: "28 thg 9")
function formatGoogleDriveDate(dateStr?: string): string {
    if (!dateStr) return '28 thg 9';
    const str = String(dateStr).trim();
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        return `${parseInt(dmyMatch[1], 10)} thg ${parseInt(dmyMatch[2], 10)}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return str;

    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} thg ${month}`;
}

function formatGoogleDriveDetailDate(dateStr?: string | number | null): string {
    if (!dateStr) return '3 thg 10, 2026';
    const str = String(dateStr).trim();
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        return `${parseInt(dmyMatch[1], 10)} thg ${parseInt(dmyMatch[2], 10)}, ${dmyMatch[3]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return str;
    return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

// Unified suggested file item
interface UnifiedSuggestedFile {
    id: string | number;
    name: string;
    fileType: string;
    reasonSuggested: string;
    owner: string;
    isMe: boolean;
    isSharedWithMe: boolean;
    ownerAvatar: string;
    location: string;
    department: string;
    locationType: 'shared' | 'folder';
    folderId?: number | null;
    folderName?: string | null;
    rawDate: number;
    size?: string;
    updatedAt?: string;
    createdAt?: string;
    uploadedByName?: string;
    aiIndexed?: boolean;
    description?: string;
}

export default function HomePage() {
    usePageBreadcrumb(['Home']);
    const router = useRouter();

    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLogDto[]>([]);
    const [collaborators, setCollaborators] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);

    // View & Collapse controls
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [foldersCollapsed, setFoldersCollapsed] = useState(false);
    const [filesCollapsed, setFilesCollapsed] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [activeDetailFile, setActiveDetailFile] = useState<UnifiedSuggestedFile | null>(null);
    const [detailActiveTab, setDetailActiveTab] = useState<'details' | 'activity'>('details');

    // Search & Filter controls
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPeople, setFilterPeople] = useState<string>('all');
    const [filterModified, setFilterModified] = useState<string>('all');
    const [filterLocation, setFilterLocation] = useState<string>('all');

    // Dropdown toggles
    const [activeDropdown, setActiveDropdown] = useState<'type' | 'people' | 'modified' | 'location' | null>(null);
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | number | null>(null);

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Multi-selection state (Google Drive multiple row selection)
    const [selectedFileIds, setSelectedFileIds] = useState<(string | number)[]>([]);
    const [lastSelectedId, setLastSelectedId] = useState<string | number | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        file: UnifiedSuggestedFile;
    } | null>(null);
    const [showOpenWithSubmenu, setShowOpenWithSubmenu] = useState(false);
    const [renamingFile, setRenamingFile] = useState<UnifiedSuggestedFile | null>(null);
    const [renameName, setRenameName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    // Starred files state (persistent in localStorage with key 'starred_file_ids')
    const [starredFileIds, setStarredFileIds] = useState<string[]>([]);

    // Delete confirmation modal state (replaces window.confirm/alert)
    const [deleteModal, setDeleteModal] = useState<{
        type: 'files' | 'folder';
        title: string;
        message: string;
        targetIds?: (string | number)[];
        targetFolder?: any;
    } | null>(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

    // Folder context menu states (media_1791046489059.png)
    const [folderContextMenu, setFolderContextMenu] = useState<{
        x: number;
        y: number;
        folder: any;
    } | null>(null);
    const [renamingFolder, setRenamingFolder] = useState<any | null>(null);
    const [renameFolderName, setRenameFolderName] = useState('');
    const [isRenamingFolder, setIsRenamingFolder] = useState(false);

    // Google Drive style snackbar toast for rename: Đã đổi tên “...” thành “...”
    const [renameToast, setRenameToast] = useState<{
        id: string | number;
        type: 'folder' | 'file';
        oldName: string;
        newName: string;
    } | null>(null);
    const renameToastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggerRenameToast = (info: { id: string | number; type: 'folder' | 'file'; oldName: string; newName: string }) => {
        if (renameToastTimerRef.current) {
            clearTimeout(renameToastTimerRef.current);
        }
        setRenameToast(info);
        renameToastTimerRef.current = setTimeout(() => {
            setRenameToast(null);
        }, 8000);
    };

    const handleUndoRename = async () => {
        if (!renameToast) return;
        const { id, type, oldName } = renameToast;
        setRenameToast(null);

        if (type === 'folder') {
            const revertFolderTree = (items: any[]): any[] => {
                return items.map((item) => {
                    if (item.id === id) {
                        return { ...item, name: oldName };
                    }
                    if (item.subForders && item.subForders.length > 0) {
                        return { ...item, subForders: revertFolderTree(item.subForders) };
                    }
                    return item;
                });
            };
            setFolders((prev) => revertFolderTree(prev));
            try {
                await forderService.renameFolder(id, oldName);
            } catch (e) {
                console.error('Failed to undo rename folder:', e);
            }
        } else {
            setFiles((prev) =>
                prev.map((f) => (f.id.toString() === id.toString() ? { ...f, name: oldName } : f))
            );
            try {
                await fileManagementService.renameFile(id, oldName);
            } catch (e) {
                console.error('Failed to undo rename file:', e);
            }
        }
    };

    // Current user
    const [currentUser, setCurrentUser] = useState({ name: 'Lê Xuân Công', email: 'admin@enterprise.ai' });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.name || parsed.username) {
                        setCurrentUser({
                            name: parsed.name || parsed.username || 'Lê Xuân Công',
                            email: parsed.email || 'admin@enterprise.ai',
                        });
                    }
                } catch (e) {}
            } else {
                const authUser = window.localStorage.getItem('authUsername');
                if (authUser) {
                    setCurrentUser({
                        name: authUser,
                        email: 'admin@enterprise.ai',
                    });
                }
            }

            // Load Starred files from localStorage
            try {
                const storedStarred = window.localStorage.getItem('starred_file_ids');
                if (storedStarred) {
                    const parsedStarred = JSON.parse(storedStarred);
                    if (Array.isArray(parsedStarred)) {
                        setStarredFileIds(parsedStarred.map(String));
                    }
                }
            } catch (e) {
                console.error('Failed to load starred files from localStorage:', e);
            }
        }
    }, []);

    // Filter out current user from collaborators list (current user is represented as 'me')
    const displayCollaborators = useMemo(() => {
        return collaborators.filter((user) => {
            const uName = (user.name || '').toLowerCase().trim();
            const curName = (currentUser.name || '').toLowerCase().trim();
            const uEmail = (user.email || '').toLowerCase().trim();
            const curEmail = (currentUser.email || '').toLowerCase().trim();
            return (
                uName !== curName &&
                uEmail !== curEmail &&
                !uName.includes('lê xuân công') &&
                !uName.includes('admin')
            );
        });
    }, [collaborators, currentUser]);

    // Close dropdowns & context menu on outside click or scroll
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Never close context menu if clicking the trigger button itself or inside the menu
            if (
                target.closest('.menu-trigger-btn') ||
                target.closest('.context-menu-container') ||
                target.closest('.folder-menu-trigger') ||
                target.closest('.folder-context-menu-container')
            ) {
                return;
            }
            setContextMenu(null);
            setFolderContextMenu(null);
            if (!target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
            if (!target.closest('.action-menu-container')) {
                setActiveActionMenuId(null);
            }
        };
        const handleScroll = () => {
            setContextMenu(null);
            setFolderContextMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    // Fetch all home data
    const fetchHomeData = async (showLoading: boolean | any = true) => {
        const shouldShowLoading = showLoading === false ? false : true;
        if (shouldShowLoading) setLoading(true);
        try {
            const [filesData, treeData, logsData, usersData, dbStarredIds] = await Promise.all([
                fileManagementService.getActiveFiles().catch(() => []),
                forderService.getFolderTree().catch(() => []),
                activityService.getActivityLogs().catch(() => []),
                userService.getUsers().catch(() => []),
                fileManagementService.getStarredFileIds().catch(() => []),
            ]);

            setFiles(filesData);
            setFolders(treeData);
            setActivityLogs(logsData);
            setCollaborators(usersData);
            if (Array.isArray(dbStarredIds)) {
                setStarredFileIds(dbStarredIds.map(String));
                try {
                    window.localStorage.setItem('starred_file_ids', JSON.stringify(dbStarredIds.map(String)));
                } catch (e) {}
            }
        } catch (err) {
            console.error('Failed to load home data:', err);
        } finally {
            if (shouldShowLoading) setLoading(false);
        }
    };

    // Admin permission check
    const isAdmin = useMemo(() => {
        if (typeof window !== 'undefined') {
            try {
                const u = JSON.parse(window.localStorage.getItem('user') || '{}');
                if (u.role === 'ADMIN') return true;
            } catch (e) {}
        }
        return false;
    }, []);

    // Drag over suggested folder state
    const [dragOverSuggestedFolderId, setDragOverSuggestedFolderId] = useState<string | number | null>(null);

    // Drag start for file items (supports single file or multi-selection)
    // Google Drive style snackbar toast for file move: Đã di chuyển “...” vào “...”
    const [moveToast, setMoveToast] = useState<{
        message: string;
        fileIds: (string | number)[];
        oldFolderId: number | string | null;
    } | null>(null);
    const moveToastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggerMoveToast = (info: {
        message: string;
        fileIds: (string | number)[];
        oldFolderId: number | string | null;
    }) => {
        if (moveToastTimerRef.current) {
            clearTimeout(moveToastTimerRef.current);
        }
        setMoveToast(info);
        moveToastTimerRef.current = setTimeout(() => {
            setMoveToast(null);
        }, 8000);
    };

    const handleUndoMove = async () => {
        if (!moveToast) return;
        const { fileIds, oldFolderId } = moveToast;
        setMoveToast(null);
        try {
            if (fileIds.length > 1) {
                await fileManagementService.moveFilesBatch(fileIds, oldFolderId);
            } else {
                await fileManagementService.moveFile(fileIds[0], oldFolderId);
            }
            fetchHomeData(false);
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
        } catch (err: any) {
            console.error('Failed to undo move:', err);
            toast.error('Không thể hoàn tác di chuyển tệp');
        }
    };

    const handleFileDragStart = (file: UnifiedSuggestedFile, e: React.DragEvent) => {
        const isSelected = selectedFileIds.includes(file.id.toString());
        const idsToMove = isSelected && selectedFileIds.length > 1
            ? selectedFileIds.map(String)
            : [file.id.toString()];

        const payload = {
            fileIds: idsToMove,
            sourceName: file.name,
            count: idsToMove.length,
            oldFolderId: file.folderId || null,
        };

        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.setData('text/plain', file.id.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Google Drive style floating drag badge
        const dragBadge = document.createElement('div');
        dragBadge.className = 'fixed -top-96 left-0 bg-[#0b57d0] text-white px-3.5 py-1.5 rounded-full shadow-2xl text-[12px] font-medium flex items-center gap-2 pointer-events-none z-[99999]';
        dragBadge.innerHTML = `<span>📁</span> <span>Di chuyển ${idsToMove.length > 1 ? idsToMove.length + ' tệp' : file.name}</span>`;
        document.body.appendChild(dragBadge);
        e.dataTransfer.setDragImage(dragBadge, 15, 15);
        setTimeout(() => {
            if (document.body.contains(dragBadge)) {
                document.body.removeChild(dragBadge);
            }
        }, 0);
    };

    // Drop file directly into suggested folder chip
    const handleDropToSuggestedFolder = async (targetFolderId: number | string, targetFolderName: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverSuggestedFolderId(null);

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
            fetchHomeData(false);
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

    useEffect(() => {
        fetchHomeData();

        const handleFileMoved = (e: any) => {
            fetchHomeData(false);
            if (e.detail?.targetFolderName) {
                const { fileIds, sourceName, targetFolderName, oldFolderId } = e.detail;
                const count = fileIds?.length || 1;
                const msg = count > 1
                    ? `Đã di chuyển ${count} tệp vào “${targetFolderName}”`
                    : `Đã di chuyển “${sourceName || 'tệp'}” vào “${targetFolderName}”`;
                triggerMoveToast({
                    message: msg,
                    fileIds: fileIds || [],
                    oldFolderId: oldFolderId ?? null,
                });
            }
        };
        window.addEventListener('file_moved', handleFileMoved);
        return () => {
            window.removeEventListener('file_moved', handleFileMoved);
        };
    }, []);

    // Flatten folders into suggested folder chips
    const suggestedFolders = useMemo(() => {
        const list: any[] = [];
        const traverse = (items: any[], parentName?: string) => {
            if (!Array.isArray(items)) return;
            for (const item of items) {
                list.push({
                    id: item.id,
                    name: item.name,
                    subtext: parentName ? `trong ${parentName}` : item.shared ? 'trong Được chia sẻ với tôi' : 'trong Drive của tôi',
                });
                if (item.subForders && item.subForders.length > 0) {
                    traverse(item.subForders, item.name);
                }
            }
        };
        traverse(folders);
        return list.slice(0, 12);
    }, [folders]);

    // Distinct department folder names for the location filter
    const departmentFolderNames = useMemo(() => {
        const names = new Set<string>();
        const extract = (items: any[]) => {
            if (!Array.isArray(items)) return;
            for (const item of items) {
                if (item.name) names.add(item.name);
                if (item.subForders && item.subForders.length > 0) {
                    extract(item.subForders);
                }
            }
        };
        extract(folders);
        files.forEach((f) => {
            if (f.folderName) names.add(f.folderName);
            if (f.ownerDepartmentName) names.add(f.ownerDepartmentName);
        });
        return Array.from(names).sort();
    }, [folders, files]);

    // Map folder id to folder name for quick lookup of parent folder
    const folderIdToNameMap = useMemo(() => {
        const map = new Map<number | string, string>();
        const traverse = (items: any[]) => {
            if (!Array.isArray(items)) return;
            for (const item of items) {
                if (item.id != null && item.name) {
                    map.set(item.id, item.name);
                    map.set(String(item.id), item.name);
                }
                if (item.subForders && item.subForders.length > 0) {
                    traverse(item.subForders);
                }
            }
        };
        traverse(folders);
        return map;
    }, [folders]);

    // Helper to determine if a given name / email / username matches the logged in user
    const isCurrentUser = (val?: string | null): boolean => {
        if (!val) return false;
        const clean = val.trim().toLowerCase();
        if (!clean) return false;
        if (clean === 'me' || clean === 'tôi') return true;

        if (currentUser?.email && clean === currentUser.email.toLowerCase().trim()) return true;
        if (currentUser?.name && clean === currentUser.name.toLowerCase().trim()) return true;

        if (typeof window !== 'undefined') {
            const authUser = window.localStorage.getItem('authUsername');
            if (authUser && clean === authUser.toLowerCase().trim()) return true;

            const stored = window.localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.username && clean === parsed.username.toLowerCase().trim()) return true;
                    if (parsed.name && clean === parsed.name.toLowerCase().trim()) return true;
                    if (parsed.email && clean === parsed.email.toLowerCase().trim()) return true;
                    if (parsed.id && String(parsed.id) === clean) return true;
                } catch (e) {}
            }
        }

        const removeAccents = (str: string) =>
            str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

        const cleanNoAccents = removeAccents(clean).replace(/\s+/g, '');
        const currentNameNoAccents = currentUser?.name ? removeAccents(currentUser.name.toLowerCase()).replace(/\s+/g, '') : '';
        if (currentNameNoAccents && cleanNoAccents === currentNameNoAccents) return true;

        if (cleanNoAccents === 'lexuancong' || clean === 'lexuancong' || clean === 'admin') return true;

        return false;
    };

    // Build unified suggested files list
    const unifiedSuggestedFiles: UnifiedSuggestedFile[] = useMemo(() => {
        return files.map((file) => {
            const ext = (file.name.split('.').pop() || file.fileType || '').toLowerCase();
            const matchingLog = activityLogs.find(
                (l) => l.targetName === file.name || (file.id && l.fileId?.toString() === file.id.toString())
            );

            // Determine Owner & isMe
            const isMe = Boolean(
                isCurrentUser(file.owner) ||
                isCurrentUser(file.uploadedByName) ||
                isCurrentUser(file.uploadedByEmail) ||
                file.owner === 'me' ||
                file.owner === 'tôi'
            );
            const owner = isMe ? 'tôi' : (file.uploadedByName || file.owner || 'Tổ chức');

            // Business rule: Any file NOT uploaded by me that I have access to is "Shared with me"
            const isSharedWithMe = !isMe;
            const departmentOrFolder = file.folderName || file.ownerDepartmentName || 'Drive';

            // Determine Reason Suggested (Vietnamese Google Drive style)
            let reason = 'Bạn đã mở • 28 thg 9';
            let rawDate = Date.now();

            if (matchingLog) {
                const dateText = formatGoogleDriveDate(matchingLog.timestamp);
                rawDate = new Date(matchingLog.timestamp || Date.now()).getTime();
                const isActorMe = isCurrentUser(matchingLog.actorName) || isMe;

                if (matchingLog.type === 'share') {
                    reason = isActorMe ? `Bạn đã chia sẻ • ${dateText}` : `${matchingLog.actorName} đã chia sẻ • ${dateText}`;
                } else if (matchingLog.type === 'comment') {
                    reason = isActorMe ? `Bạn đã nhận xét • ${dateText}` : `${matchingLog.actorName} đã nhận xét • ${dateText}`;
                } else {
                    // Thao tác xem, mở hoặc sửa đổi
                    if (isActorMe) {
                        reason = `Bạn đã mở • ${dateText}`;
                    } else {
                        reason = `${matchingLog.actorName} đã mở • ${dateText}`;
                    }
                }
            } else if (file.updatedAt) {
                const dateText = formatGoogleDriveDate(file.updatedAt);
                rawDate = new Date(file.updatedAt).getTime();
                reason = isMe
                    ? `Bạn đã mở • ${dateText}`
                    : `${owner} đã chia sẻ • ${dateText}`;
            } else {
                reason = isMe ? 'Bạn đã mở • Hôm nay' : `${owner} đã chia sẻ • Hôm nay`;
            }

            // Determine Location: Tên thư mục cha của file đó, nếu không có thư mục cha thì ghi Drive
            let parentFolderName: string | null = null;
            if (file.folderName && file.folderName.trim()) {
                parentFolderName = file.folderName.trim();
            } else if (file.folderId != null && folderIdToNameMap.has(file.folderId)) {
                parentFolderName = folderIdToNameMap.get(file.folderId) || null;
            }

            const location = (parentFolderName && parentFolderName.trim()) ? parentFolderName.trim() : 'Drive';
            const locationType: 'shared' | 'folder' = isSharedWithMe ? 'shared' : 'folder';

            return {
                id: file.id,
                name: file.name,
                fileType: ext,
                reasonSuggested: reason,
                owner,
                isMe,
                isSharedWithMe,
                ownerAvatar: isMe ? 'T' : owner.charAt(0).toUpperCase(),
                location,
                department: departmentOrFolder,
                locationType,
                folderId: file.folderId,
                folderName: parentFolderName || file.folderName,
                rawDate: isNaN(rawDate) ? 0 : rawDate,
                size: file.size,
                updatedAt: file.updatedAt,
                createdAt: (file as any).createdAt,
                uploadedByName: file.uploadedByName,
                aiIndexed: file.aiIndexed,
                description: (file as any).description,
            };
        });
    }, [files, activityLogs, currentUser, folderIdToNameMap]);

    // Filter files based on search & filter pills
    const filteredFiles = useMemo(() => {
        return unifiedSuggestedFiles.filter((item) => {
            // Search term
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matchName = item.name.toLowerCase().includes(term);
                const matchOwner = item.owner.toLowerCase().includes(term);
                const matchLocation = item.location.toLowerCase().includes(term);
                const matchDept = item.department.toLowerCase().includes(term);
                if (!matchName && !matchOwner && !matchLocation && !matchDept) return false;
            }

            // Filter Type
            if (filterType !== 'all') {
                const ext = item.fileType.toLowerCase();
                if (filterType === 'docs' && !['docx', 'doc', 'txt', 'rtf'].includes(ext)) return false;
                if (filterType === 'sheets' && !['xlsx', 'xls', 'csv'].includes(ext)) return false;
                if (filterType === 'slides' && !['pptx', 'ppt'].includes(ext)) return false;
                if (filterType === 'pdf' && ext !== 'pdf') return false;
                if (filterType === 'images' && !['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return false;
                if (filterType === 'videos' && !['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return false;
                if (filterType === 'archive' && !['zip', 'rar', '7z'].includes(ext)) return false;
                if (filterType === 'audio' && !['mp3', 'wav'].includes(ext)) return false;
                if (filterType === 'markdown' && !['md', 'markdown'].includes(ext)) return false;
            }

            // Filter People
            if (filterPeople !== 'all') {
                if (filterPeople === 'me' && !item.isMe) return false;
                if (filterPeople !== 'me' && item.owner.toLowerCase() !== filterPeople.toLowerCase()) return false;
            }

            // Filter Location (Department folders or Shared with me)
            if (filterLocation !== 'all') {
                if (filterLocation === 'shared') {
                    if (!item.isSharedWithMe && item.locationType !== 'shared') return false;
                } else {
                    const matchDept = item.department?.toLowerCase() === filterLocation.toLowerCase();
                    const matchLoc = item.location.toLowerCase() === filterLocation.toLowerCase();
                    if (!matchDept && !matchLoc) return false;
                }
            }

            // Filter Modified
            if (filterModified !== 'all') {
                const now = Date.now();
                const diffDays = (now - item.rawDate) / (1000 * 60 * 60 * 24);
                if (filterModified === 'today' && diffDays > 1) return false;
                if (filterModified === '7d' && diffDays > 7) return false;
                if (filterModified === '30d' && diffDays > 30) return false;
            }

            return true;
        });
    }, [unifiedSuggestedFiles, searchTerm, filterType, filterPeople, filterLocation, filterModified]);

    const effectiveDetailFile = useMemo(() => {
        if (activeDetailFile) return activeDetailFile;
        if (selectedFileIds.length > 0) {
            return filteredFiles.find((f) => f.id.toString() === selectedFileIds[0].toString()) || null;
        }
        return filteredFiles[0] || null;
    }, [activeDetailFile, selectedFileIds, filteredFiles]);

    const activeFilterCount = [
        filterType !== 'all',
        filterPeople !== 'all',
        filterModified !== 'all',
        filterLocation !== 'all',
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setFilterType('all');
        setFilterPeople('all');
        setFilterModified('all');
        setFilterLocation('all');
        setSearchTerm('');
    };

    // Starred files toggle (silent toggle, no toast, persists in DB and localStorage)
    const handleToggleStar = async (fileId: string | number, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const idStr = fileId.toString();
        // Optimistic update: 0ms response in UI
        setStarredFileIds((prev) => {
            const isCurrentlyStarred = prev.includes(idStr);
            const next = isCurrentlyStarred ? prev.filter((id) => id !== idStr) : [...prev, idStr];
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem('starred_file_ids', JSON.stringify(next));
                } catch (err) {
                    console.error('Failed to save starred files to localStorage:', err);
                }
            }
            return next;
        });

        // Persist directly to PostgreSQL database via backend API
        try {
            await fileManagementService.toggleStar(fileId);
        } catch (err) {
            console.warn('[handleToggleStar] Failed to persist star to database:', err);
        }
    };

    // Keyboard shortcuts: Escape to deselect, Delete to delete selected, Ctrl+Alt+E to rename
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedFileIds([]);
                setContextMenu(null);
                setFolderContextMenu(null);
            }
            if (e.key === 'Delete' || (e.ctrlKey && e.key === 'Backspace')) {
                const tag = (document.activeElement?.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea') {
                    if (selectedFileIds.length > 0) {
                        e.preventDefault();
                        handleRequestDeleteFiles();
                    }
                }
            }
            if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === 'E')) {
                if (selectedFileIds.length === 1) {
                    const target = filteredFiles.find((f) => f.id.toString() === selectedFileIds[0].toString());
                    if (target) {
                        e.preventDefault();
                        handleStartRename(target);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFileIds, filteredFiles]);

    // Handle single or multi row selection (Ctrl, Shift, Normal click)
    const handleFileRowClick = (fileId: string | number, e: React.MouseEvent) => {
        setFolderContextMenu(null);
        const idStr = fileId.toString();
        const clickedFile = filteredFiles.find((f) => f.id.toString() === idStr);
        if (clickedFile) {
            setActiveDetailFile(clickedFile);
        }
        if (e.ctrlKey || e.metaKey) {
            setSelectedFileIds((prev) =>
                prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
            );
            setLastSelectedId(fileId);
        } else if (e.shiftKey && lastSelectedId) {
            const lastIdx = filteredFiles.findIndex((f) => f.id.toString() === lastSelectedId.toString());
            const curIdx = filteredFiles.findIndex((f) => f.id.toString() === idStr);
            if (lastIdx !== -1 && curIdx !== -1) {
                const start = Math.min(lastIdx, curIdx);
                const end = Math.max(lastIdx, curIdx);
                const rangeIds = filteredFiles.slice(start, end + 1).map((f) => f.id.toString());
                setSelectedFileIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
            } else {
                setSelectedFileIds([idStr]);
                setLastSelectedId(fileId);
            }
        } else {
            setSelectedFileIds([idStr]);
            setLastSelectedId(fileId);
        }
    };

    // Open context menu on row right click or 3 dots button
    const handleContextMenu = (file: UnifiedSuggestedFile, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDetailFile(file);
        setFolderContextMenu(null);
        const idStr = file.id.toString();
        if (!selectedFileIds.includes(idStr)) {
            setSelectedFileIds([idStr]);
            setLastSelectedId(file.id);
        }

        // Toggle off if clicking the 3-dots button for the same file when already open
        if (contextMenu && contextMenu.file.id === file.id) {
            setContextMenu(null);
            setShowOpenWithSubmenu(false);
            return;
        }

        setShowOpenWithSubmenu(false);
        const menuWidth = 280;
        const menuHeight = 440;
        const targetEl = e.currentTarget as HTMLElement;
        const isButtonClick = targetEl.tagName === 'BUTTON' || targetEl.classList.contains('menu-trigger-btn');
        const rect = targetEl.getBoundingClientRect();

        let x = e.clientX;
        let y = e.clientY;

        if (isButtonClick || (e.clientX === 0 && e.clientY === 0)) {
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
            if (isButtonClick && rect.top - menuHeight > 0) {
                y = rect.top - menuHeight - 4;
            } else {
                y = Math.max(10, winHeight - menuHeight - 16);
            }
        }
        if (y < 10) y = 10;

        setContextMenu({ x, y, file });
    };

    // Open folder context menu on right click or 3-dots button (media_1791046489059.png)
    const handleFolderContextMenu = (folder: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFileIds([]);
        setContextMenu(null);

        if (folderContextMenu && folderContextMenu.folder.id === folder.id) {
            setFolderContextMenu(null);
            return;
        }

        const menuWidth = 280;
        const menuHeight = 360;
        const targetEl = e.currentTarget as HTMLElement;
        const isButtonClick = targetEl.tagName === 'BUTTON' || targetEl.classList.contains('folder-menu-trigger');
        const rect = targetEl.getBoundingClientRect();

        let x = e.clientX;
        let y = e.clientY;

        if (isButtonClick || (e.clientX === 0 && e.clientY === 0)) {
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
            if (isButtonClick && rect.top - menuHeight > 0) {
                y = rect.top - menuHeight - 4;
            } else {
                y = Math.max(10, winHeight - menuHeight - 16);
            }
        }
        if (y < 10) y = 10;

        setFolderContextMenu({ x, y, folder });
    };

    const handleDownloadFolder = (folder: any) => {
        toast.success(`Đang chuẩn bị nén và tải xuống thư mục "${folder.name}"...`);
        setFolderContextMenu(null);
    };

    const handleStartRenameFolder = (folder: any) => {
        setRenamingFolder(folder);
        setRenameFolderName(folder.name);
        setFolderContextMenu(null);
    };

    const handleRenameFolderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renamingFolder || !renameFolderName.trim() || renameFolderName.trim() === renamingFolder.name) {
            setRenamingFolder(null);
            return;
        }

        const folderId = renamingFolder.id;
        const oldName = renamingFolder.name;
        const newName = renameFolderName.trim();

        // 1. Close modal immediately (no delay)
        setRenamingFolder(null);

        // 2. Optimistic update tree at 0ms so UI updates instantly
        const updateTree = (items: any[], targetName: string): any[] => {
            return items.map((item) => {
                if (item.id === folderId) {
                    return { ...item, name: targetName };
                }
                if (item.subForders && item.subForders.length > 0) {
                    return { ...item, subForders: updateTree(item.subForders, targetName) };
                }
                return item;
            });
        };
        setFolders((prev) => updateTree(prev, newName));

        // 3. Show Google Drive style dark snackbar toast: Đã đổi tên “...” thành “...”
        triggerRenameToast({
            id: folderId,
            type: 'folder',
            oldName,
            newName,
        });

        // 4. Call backend API in background silently (NO full-page loading or re-fetching)
        try {
            await forderService.renameFolder(folderId, newName);
        } catch (err: any) {
            toast.error('Lỗi khi đổi tên thư mục: ' + (err?.message || err));
            setFolders((prev) => updateTree(prev, oldName));
        }
    };

    // Yêu cầu xóa files (mở popup xác nhận)
    const handleRequestDeleteFiles = () => {
        if (selectedFileIds.length === 0) return;
        setDeleteModal({
            type: 'files',
            title: 'Chuyển vào thùng rác?',
            message: `Bạn có chắc chắn muốn chuyển ${selectedFileIds.length} tệp đã chọn vào thùng rác không? Các mục trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày.`,
            targetIds: [...selectedFileIds],
        });
        setContextMenu(null);
    };

    // Yêu cầu xóa folder (mở popup xác nhận)
    const handleRequestDeleteFolder = (folder: any) => {
        setDeleteModal({
            type: 'folder',
            title: 'Chuyển vào thùng rác?',
            message: `Bạn có chắc chắn muốn chuyển thư mục "${folder.name}" vào thùng rác không? Tất cả các tệp bên trong thư mục này cũng sẽ được chuyển vào thùng rác.`,
            targetFolder: folder,
        });
        setFolderContextMenu(null);
    };

    // Thực hiện xóa khi nhấn nút xác nhận trong Popup
    const handleConfirmDelete = async () => {
        if (!deleteModal) return;
        setIsDeletingItem(true);
        if (deleteModal.type === 'files' && deleteModal.targetIds) {
            const count = deleteModal.targetIds.length;
            const tId = toast.loading(`Đang chuyển ${count} tệp vào thùng rác...`);
            try {
                for (const id of deleteModal.targetIds) {
                    await fileManagementService.softDelete(id);
                }
                toast.success(`Đã chuyển ${count} tệp vào thùng rác thành công!`, { id: tId });
                setSelectedFileIds([]);
                setContextMenu(null);
                setDeleteModal(null);
                fetchHomeData();
            } catch (err: any) {
                toast.error('Lỗi khi xóa tệp: ' + (err?.message || err), { id: tId });
            } finally {
                setIsDeletingItem(false);
            }
        } else if (deleteModal.type === 'folder' && deleteModal.targetFolder) {
            const folder = deleteModal.targetFolder;
            const tId = toast.loading(`Đang chuyển thư mục "${folder.name}" vào thùng rác...`);
            try {
                await forderService.deleteFolder(folder.id);
                toast.success(`Đã chuyển thư mục "${folder.name}" vào thùng rác!`, { id: tId });
                setFolderContextMenu(null);
                setDeleteModal(null);
                window.dispatchEvent(new CustomEvent('folder_tree_updated'));
                fetchHomeData();
            } catch (err: any) {
                toast.error(err?.message || 'Lỗi khi xóa thư mục', { id: tId });
            } finally {
                setIsDeletingItem(false);
            }
        }
    };

    // Download selected file(s)
    const handleDownloadSelected = () => {
        if (selectedFileIds.length === 0) return;
        selectedFileIds.forEach((id) => {
            const f = filteredFiles.find((x) => x.id.toString() === id.toString());
            if (f) {
                const url = `http://localhost:8080/api/v1/files/${f.id}/stream`;
                const a = document.createElement('a');
                a.href = url;
                a.download = f.name;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
        toast.success(`Đang tải xuống ${selectedFileIds.length} tệp`);
        setContextMenu(null);
    };

    // Start rename (Only allowed when 1 file is selected)
    const handleStartRename = (file: UnifiedSuggestedFile) => {
        if (selectedFileIds.length > 1) {
            toast.error('Không thể đổi tên cùng lúc nhiều tệp!');
            return;
        }
        setRenamingFile(file);
        setRenameName(file.name);
        setContextMenu(null);
    };

    // Submit rename
    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renamingFile || !renameName.trim() || renameName.trim() === renamingFile.name) {
            setRenamingFile(null);
            return;
        }

        const fileId = renamingFile.id;
        const oldName = renamingFile.name;
        const newName = renameName.trim();

        // 1. Close modal immediately (no delay)
        setRenamingFile(null);

        // 2. Optimistic update files list at 0ms
        setFiles((prev) =>
            prev.map((f) => (f.id.toString() === fileId.toString() ? { ...f, name: newName } : f))
        );

        // 3. Show Google Drive style dark snackbar toast: Đã đổi tên “...” thành “...”
        triggerRenameToast({
            id: fileId,
            type: 'file',
            oldName,
            newName,
        });

        // 4. Call backend API in background silently (NO full-page loading or re-fetching)
        try {
            await fileManagementService.renameFile(fileId, newName);
        } catch (err: any) {
            toast.error('Lỗi khi đổi tên: ' + (err?.message || err));
            setFiles((prev) =>
                prev.map((f) => (f.id.toString() === fileId.toString() ? { ...f, name: oldName } : f))
            );
        }
    };

    // Copy link of selected
    const handleCopyLinkSelected = () => {
        if (selectedFileIds.length === 0) return;
        const firstId = selectedFileIds[0];
        const link = `${window.location.origin}/files/${firstId}`;
        navigator.clipboard.writeText(link);
        toast.success(selectedFileIds.length > 1 ? `Đã sao chép liên kết tệp đầu tiên!` : 'Đã sao chép liên kết tệp!');
        setContextMenu(null);
    };

    // Share selected
    const handleShareSelected = () => {
        if (selectedFileIds.length === 0) return;
        const firstId = selectedFileIds[0];
        const target = filteredFiles.find((f) => f.id.toString() === firstId.toString());
        if (target) {
            router.push(`/files/${target.id}/permissions`);
        }
        setContextMenu(null);
    };

    // Mở file trực tiếp qua Google Docs
    const handleOpenInGoogleDocs = async (file: UnifiedSuggestedFile) => {
        toast.loading(`Đang kết nối Google Docs cho "${file.name}"...`, { id: 'gdoc-open' });
        try {
            const previewData = await fileManagementService.getPreviewUrl(file.id);
            const targetUrl = previewData?.url;

            if (!targetUrl) {
                toast.error('Không tìm thấy đường dẫn tệp để mở!', { id: 'gdoc-open' });
                return;
            }

            // Nếu là URL localhost: Google Docs không thể truy cập từ internet
            if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
                toast.error('Tệp đang lưu trên Localhost máy cá nhân (Google Docs cần link S3/Internet để nạp). Đang mở danh sách tệp...', { id: 'gdoc-open', duration: 4000 });
                router.push('/files');
                return;
            }

            // Mở thẳng qua Google Docs Viewer
            const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}`;
            window.open(gDocsUrl, '_blank', 'noopener,noreferrer');
            toast.success('Đã mở tài liệu trên Google Docs!', { id: 'gdoc-open' });
        } catch (err) {
            console.error('Lỗi khi mở qua Google Docs:', err);
            router.push('/files');
            toast.error('Chưa thể mở qua Google Docs, đã chuyển sang danh sách tệp.', { id: 'gdoc-open' });
        }
    };

    // Xử lý Double Click: nếu là file tài liệu (doc, docx, pdf, xlsx, pptx) -> mở thẳng Google Docs
    const handleFileDoubleClick = (file: UnifiedSuggestedFile) => {
        const ext = file.fileType?.toLowerCase() || '';
        const isDocOrOffice = ['doc', 'docx', 'odt', 'rtf', 'pdf', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);
        if (isDocOrOffice) {
            handleOpenInGoogleDocs(file);
        } else {
            router.push('/files');
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#0B1120] text-gray-900 dark:text-slate-100 relative">
            {/* Main Body: Left Content Area + Right Details Drawer */}
            <div className="flex-1 flex min-w-0 min-h-0 h-full overflow-hidden">
                <div className="flex-1 min-w-0 h-full overflow-y-auto px-6 pt-3 pb-16 scrollbar-thin">
                    {/* 1. Header: Title and Info Button */}
                    <div className="flex items-center justify-between pb-3 shrink-0">
                        <h1 className="text-[20px] font-normal text-[#1f1f1f] dark:text-slate-100 tracking-normal select-none">
                            Chào mừng bạn đến với kho lưu trữ rikai
                        </h1>
                        <button
                            type="button"
                            onClick={() => setShowInfoPanel(!showInfoPanel)}
                            className={`p-1.5 rounded-full transition cursor-pointer ${
                                showInfoPanel
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                            title="Chi tiết Drive & Bộ nhớ"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>

                    {/* SELECTION BAR (When rows are selected) */}
                    {selectedFileIds.length > 0 && (
                        <div className="mb-3 flex items-center justify-between bg-[#edf2fa] dark:bg-slate-800/95 border border-blue-200/80 dark:border-blue-900/60 rounded-xl px-4 py-1.5 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFileIds([])}
                                    className="p-1 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer text-gray-600 dark:text-slate-300"
                                    title="Bỏ chọn (Esc)"
                                >
                                    <X className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
                                <span className="text-[12px] font-medium text-gray-800 dark:text-slate-100 select-none">
                                    Đã chọn {selectedFileIds.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200">
                                {/* Share */}
                                <button
                                    type="button"
                                    onClick={handleShareSelected}
                                    className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                    title="Chia sẻ"
                                >
                                    <UserPlus className="w-3.5 h-3.5 pointer-events-none" />
                                </button>

                                {/* Download */}
                                <button
                                    type="button"
                                    onClick={handleDownloadSelected}
                                    className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                    title="Tải xuống tất cả tệp đã chọn"
                                >
                                    <Download className="w-3.5 h-3.5 pointer-events-none" />
                                </button>

                                {/* Move to folder / Organize */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedFileIds.length > 0) {
                                            router.push(`/files?highlightId=${selectedFileIds[0]}`);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                    title="Tổ chức / Xem vị trí"
                                >
                                    <FolderInput className="w-3.5 h-3.5 pointer-events-none" />
                                </button>

                                {/* Move to trash */}
                                <button
                                    type="button"
                                    onClick={handleRequestDeleteFiles}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 hover:text-red-600 rounded-full transition cursor-pointer"
                                    title="Chuyển vào thùng rác (Delete)"
                                >
                                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                                </button>

                                {/* Copy link */}
                                <button
                                    type="button"
                                    onClick={handleCopyLinkSelected}
                                    className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                    title="Sao chép đường dẫn"
                                >
                                    <Link2 className="w-3.5 h-3.5 pointer-events-none" />
                                </button>

                                {/* Rename icon (ONLY when 1 file is selected) */}
                                {selectedFileIds.length === 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const target = filteredFiles.find((f) => f.id.toString() === selectedFileIds[0].toString());
                                            if (target) handleStartRename(target);
                                        }}
                                        className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                        title="Đổi tên (Ctrl+Alt+E)"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                                    </button>
                                )}

                                {/* More options button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const firstFile = filteredFiles.find((f) => f.id.toString() === selectedFileIds[0].toString());
                                        if (firstFile) handleContextMenu(firstFile, e);
                                    }}
                                    className="menu-trigger-btn p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                    title="Tùy chọn khác"
                                >
                                    <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* SECTION 1: THƯ MỤC ĐỀ XUẤT */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    type="button"
                                    onClick={() => setFoldersCollapsed(!foldersCollapsed)}
                                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#1f1f1f] dark:text-slate-200 hover:text-gray-900 dark:hover:text-slate-100 transition cursor-pointer select-none"
                                >
                                    {foldersCollapsed ? (
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                    <span>Thư mục đề xuất</span>
                                </button>
                            </div>

                            {!foldersCollapsed && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                    {loading
                                        ? [1, 2, 3, 4, 5, 6].map((i) => (
                                              <div
                                                  key={i}
                                                  className="h-[44px] bg-gray-100 dark:bg-slate-800/60 rounded-xl animate-pulse"
                                              />
                                          ))
                                        : suggestedFolders.slice(0, 6).map((f) => {
                                              const isFolderDragOver = dragOverSuggestedFolderId === f.id;
                                              return (
                                              <div
                                                  key={f.id}
                                                  onClick={() => router.push(`/files?folderId=${f.id}`)}
                                                  onDragOver={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      e.dataTransfer.dropEffect = 'move';
                                                      if (dragOverSuggestedFolderId !== f.id) {
                                                          setDragOverSuggestedFolderId(f.id);
                                                      }
                                                  }}
                                                  onDragLeave={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      if (dragOverSuggestedFolderId === f.id) {
                                                          setDragOverSuggestedFolderId(null);
                                                      }
                                                  }}
                                                  onDrop={(e) => handleDropToSuggestedFolder(f.id, f.name, e)}
                                                  onContextMenu={(e) => handleFolderContextMenu(f, e)}
                                                  className={`h-[44px] rounded-xl px-2.5 py-1 flex items-center justify-between transition-all cursor-pointer border group shadow-2xs min-w-0 select-none ${
                                                      isFolderDragOver
                                                          ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500 border-blue-400 font-semibold scale-[1.02]'
                                                          : 'bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-[#1f1f1f] dark:text-slate-100 border-transparent hover:border-gray-200/60 dark:hover:border-slate-700/60'
                                                  }`}
                                              >
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                      <Folder className={`w-4 h-4 shrink-0 ${isFolderDragOver ? 'text-blue-600 fill-blue-500/30' : 'text-[#444746] dark:text-slate-300 fill-[#444746]/20'}`} />
                                                      <div className="min-w-0 flex-1 leading-tight">
                                                          <h4
                                                              className="text-[12px] font-medium truncate"
                                                              title={f.name}
                                                          >
                                                              {f.name}
                                                          </h4>
                                                          <p className="text-[10px] text-[#5f6368] dark:text-slate-400 truncate mt-0.5">
                                                              {f.subtext}
                                                          </p>
                                                      </div>
                                                  </div>

                                                  <button
                                                      type="button"
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleFolderContextMenu(f, e);
                                                      }}
                                                      className={`folder-menu-trigger p-1 rounded-full hover:bg-gray-200/60 dark:hover:bg-slate-700 transition shrink-0 ml-0.5 cursor-pointer ${
                                                          folderContextMenu?.folder.id === f.id
                                                              ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white'
                                                              : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-200'
                                                      }`}
                                                      title="Tùy chọn khác"
                                                  >
                                                      <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                  </button>
                                              </div>
                                          );
                                      })}
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: TỆP ĐỀ XUẤT */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={() => setFilesCollapsed(!filesCollapsed)}
                                className="flex items-center gap-1 text-[13px] font-medium text-[#1f1f1f] dark:text-slate-200 hover:text-gray-900 dark:hover:text-slate-100 transition cursor-pointer select-none"
                            >
                                {filesCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                )}
                                <span>Tệp đề xuất</span>
                            </button>

                            {/* View Switcher: List vs Grid - Pill shape */}
                            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-full p-0.5 bg-white dark:bg-slate-900 shadow-2xs h-6">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition cursor-pointer ${
                                        viewMode === 'list'
                                            ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                    title="Chế độ danh sách"
                                >
                                    {viewMode === 'list' && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    <List className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition cursor-pointer ${
                                        viewMode === 'grid'
                                            ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                    title="Chế độ lưới"
                                >
                                    {viewMode === 'grid' && <Check className="w-3 h-3 stroke-[2.5]" />}
                                    <LayoutGrid className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {!filesCollapsed && (
                            <>
                                {loading ? (
                                    /* Loading Skeletons */
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="py-2.5 flex items-center justify-between animate-pulse">
                                                <div className="flex items-center gap-2.5 w-1/3">
                                                    <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                                                    <div className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded w-48" />
                                                </div>
                                                <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-36" />
                                                <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-28" />
                                                <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-24" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredFiles.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500 text-xs">
                                        Không tìm thấy tệp đề xuất nào.
                                    </div>
                                ) : viewMode === 'list' ? (
                                    /* TABLE LIST VIEW (Exact match to Google Drive screenshot) */
                                    <div className="w-full">
                                        <table className="w-full table-fixed text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200/80 dark:border-slate-800 text-[11.5px] font-medium text-[#444746] dark:text-slate-400 select-none h-9">
                                                    <th className="py-2 px-3 w-[34%] min-w-0">Tên</th>
                                                    <th className="py-2 px-3 w-[24%] min-w-0">Lý do tài liệu được đề xuất</th>
                                                    <th className="py-2 px-3 w-[16%] min-w-0">Chủ sở hữu</th>
                                                    <th className="py-2 px-3 w-[14%] min-w-0">Vị trí</th>
                                                    <th className="py-2 pr-3 w-[12%] text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100/80 dark:divide-slate-800/60 text-[12.5px]">
                                                {filteredFiles.map((file) => {
                                                    const config = getFileTypeConfig(file.fileType);
                                                    const Icon = config.icon;
                                                    const avatarClass = getAvatarColor(file.owner);
                                                    const isSelected = selectedFileIds.includes(file.id.toString());
                                                    const canMove = isAdmin || file.isMe;

                                                    return (
                                                        <tr
                                                            key={file.id}
                                                            draggable={canMove}
                                                            onDragStart={(e) => {
                                                                if (!canMove) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                handleFileDragStart(file, e);
                                                            }}
                                                            onClick={(e) => handleFileRowClick(file.id, e)}
                                                            onContextMenu={(e) => handleContextMenu(file, e)}
                                                            onDoubleClick={() => handleFileDoubleClick(file)}
                                                            className={`group transition-colors select-none ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} h-11 ${
                                                                isSelected
                                                                    ? 'bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] font-medium'
                                                                    : 'hover:bg-[#f0f4f9] dark:hover:bg-slate-800/50 text-[#1f1f1f] dark:text-slate-200'
                                                            }`}
                                                        >
                                                            {/* 1. Tên Column */}
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div
                                                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}
                                                                    >
                                                                        <Icon className="w-3 h-3" />
                                                                    </div>
                                                                    <span
                                                                        className="font-normal text-[#1f1f1f] dark:text-slate-100 truncate text-[12.5px]"
                                                                        title={file.name}
                                                                    >
                                                                        {file.name}
                                                                    </span>
                                                                    {file.locationType === 'shared' && (
                                                                        <span
                                                                            title={`Được chia sẻ bởi ${file.owner}`}
                                                                            className="text-gray-400 shrink-0 ml-0.5"
                                                                        >
                                                                            <Users className="w-3 h-3" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* 2. Lý do tài liệu được đề xuất Column */}
                                                            <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                                <span className="truncate block text-[11.5px]">
                                                                    {file.reasonSuggested}
                                                                </span>
                                                            </td>

                                                            {/* 3. Chủ sở hữu Column */}
                                                            <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full flex items-center justify-center font-medium text-[8px] shrink-0 ${avatarClass}`}
                                                                    >
                                                                        {file.ownerAvatar}
                                                                    </div>
                                                                    <span className="truncate text-[11.5px]">
                                                                        {file.owner}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* 4. Vị trí Column */}
                                                            <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                                <div
                                                                    className="flex items-center gap-1.5 truncate text-[11.5px]"
                                                                    title={file.location}
                                                                >
                                                                    {file.location === 'Drive' || file.location === 'Drive của tôi' ? (
                                                                        <div className="w-3.5 h-3.5 rounded border border-gray-400/80 dark:border-slate-500 flex items-center justify-center text-[7px] font-bold text-gray-600 dark:text-slate-300 shrink-0">
                                                                            ▲
                                                                        </div>
                                                                    ) : (
                                                                        <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400 fill-[#444746]/20 shrink-0" />
                                                                    )}
                                                                    <span className="truncate">{file.location}</span>
                                                                </div>
                                                            </td>

                                                            {/* 5. Menu Action Column */}
                                                            <td className="py-2 pr-3 text-right">
                                                                <div className="flex items-center justify-end gap-0.5">
                                                                    {/* Quick action buttons - shown on hover or when row is selected */}
                                                                    <div className={`items-center gap-0.5 transition-opacity ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedFileIds([file.id.toString()]);
                                                                                handleShareSelected();
                                                                            }}
                                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                            title="Chia sẻ"
                                                                        >
                                                                            <UserPlus className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const url = `http://localhost:8080/api/v1/files/${file.id}/stream`;
                                                                                const a = document.createElement('a');
                                                                                a.href = url;
                                                                                a.download = file.name;
                                                                                a.target = '_blank';
                                                                                document.body.appendChild(a);
                                                                                a.click();
                                                                                document.body.removeChild(a);
                                                                                toast.success('Đang tải xuống tệp');
                                                                            }}
                                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                            title="Tải xuống"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleStartRename(file);
                                                                            }}
                                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                            title="Đổi tên (Ctrl+Alt+E)"
                                                                        >
                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleToggleStar(file.id, e)}
                                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                            title={starredFileIds.includes(file.id.toString()) ? 'Bỏ gắn dấu sao' : 'Gắn dấu sao'}
                                                                        >
                                                                            <Star
                                                                                className={`w-3.5 h-3.5 transition-colors ${
                                                                                    starredFileIds.includes(file.id.toString())
                                                                                        ? 'text-amber-500 fill-amber-400'
                                                                                        : 'text-gray-500 hover:text-amber-500'
                                                                                }`}
                                                                            />
                                                                        </button>
                                                                    </div>

                                                                    {/* 3 dots icon - ALWAYS VISIBLE for every row */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleContextMenu(file, e);
                                                                        }}
                                                                        className={`menu-trigger-btn p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 ${
                                                                            contextMenu?.file.id === file.id ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white' : ''
                                                                        }`}
                                                                        title="Tùy chọn khác"
                                                                    >
                                                                        <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* GRID VIEW WITH MINIATURE PREVIEWS */
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
                                        {filteredFiles.map((file) => {
                                            const config = getFileTypeConfig(file.fileType);
                                            const Icon = config.icon;
                                            const avatarClass = getAvatarColor(file.owner);
                                            const isSelected = selectedFileIds.includes(file.id.toString());
                                            const canMove = isAdmin || file.isMe;

                                            return (
                                                <div
                                                    key={file.id}
                                                    draggable={canMove}
                                                    onDragStart={(e) => {
                                                        if (!canMove) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        handleFileDragStart(file, e);
                                                    }}
                                                    onClick={(e) => handleFileRowClick(file.id, e)}
                                                    onContextMenu={(e) => handleContextMenu(file, e)}
                                                    onDoubleClick={() => handleFileDoubleClick(file)}
                                                    className={`rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 group relative shadow-2xs ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} select-none ${
                                                        isSelected
                                                            ? 'bg-[#c2e7ff] hover:bg-[#b5def7] dark:bg-blue-950/70 border-2 border-blue-500 shadow-xs'
                                                            : 'bg-[#f0f4f9] hover:bg-[#e6edf7] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200/90 dark:hover:border-slate-700/80'
                                                    }`}
                                                >
                                                    <div>
                                                         {/* Top Row: Icon + Title + Menu */}
                                                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                                <div
                                                                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}
                                                                >
                                                                    <Icon className="w-3.5 h-3.5" />
                                                                </div>
                                                                <span
                                                                    onClick={(e) => {
                                                                        if (e.ctrlKey || e.shiftKey || e.metaKey) return;
                                                                        handleFileDoubleClick(file);
                                                                    }}
                                                                    className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate cursor-pointer hover:underline"
                                                                    title={file.name}
                                                                >
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleContextMenu(file, e);
                                                                }}
                                                                className={`menu-trigger-btn p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 ${
                                                                    contextMenu?.file.id === file.id ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white' : ''
                                                                }`}
                                                                title="Tùy chọn khác"
                                                            >
                                                                <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                            </button>
                                                        </div>

                                                        {/* Preview Thumbnail Box (Snapshot preview) */}
                                                        <div
                                                            onClick={(e) => {
                                                                if (e.ctrlKey || e.shiftKey || e.metaKey) return;
                                                                handleFileDoubleClick(file);
                                                            }}
                                                            className="w-full h-32 my-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition relative"
                                                        >
                                                            <FileThumbnailPreview id={file.id} name={file.name} fileType={file.fileType} />
                                                        </div>
                                                    </div>

                                                    {/* Bottom Metadata: Exactly like Google Drive (Avatar + Bạn đã mở • ...) */}
                                                    <div className="mt-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div
                                                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs ${avatarClass}`}
                                                            >
                                                                {file.ownerAvatar}
                                                            </div>
                                                            <span
                                                                className="text-[11px] text-gray-600 dark:text-slate-300 truncate"
                                                                title={file.reasonSuggested}
                                                            >
                                                                {file.reasonSuggested}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                        </div>
                    </div>
                </div>

                {/* 5. Right Details / Slide-out Drawer (Matching Google Drive & media_1791054965760.png / media_1791055004477.png) */}
                {showInfoPanel && (
                    <div className="w-[320px] bg-white dark:bg-[#1E1F20] border-l border-[#E0E2E0]/70 dark:border-slate-800 flex flex-col shrink-0 h-full shadow-none z-20 overflow-hidden animate-in slide-in-from-right-4 duration-200">
                        {/* Drawer Header */}
                        <div className="px-4 py-3 border-b border-[#E0E2E0]/70 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {effectiveDetailFile ? (
                                    (() => {
                                        const ext = effectiveDetailFile.fileType || effectiveDetailFile.name.split('.').pop() || '';
                                        const config = getFileTypeConfig(ext);
                                        const IconComponent = config.icon;
                                        return (
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}>
                                                <IconComponent className="w-3.5 h-3.5" />
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                                        <Folder className="w-3.5 h-3.5 fill-blue-600/30" />
                                    </div>
                                )}
                                <h3 className="text-[13px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] truncate" title={effectiveDetailFile ? effectiveDetailFile.name : 'Drive của tôi'}>
                                    {effectiveDetailFile ? effectiveDetailFile.name : 'Drive của tôi'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInfoPanel(false)}
                                className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                                title="Đóng bảng chi tiết"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Navigation Tabs: Chi tiết (Details) | Hoạt động (Activity) */}
                        <div className="flex items-center border-b border-[#E0E2E0]/70 dark:border-slate-800 px-4 text-[13px] shrink-0">
                            <button
                                type="button"
                                onClick={() => setDetailActiveTab('details')}
                                className={`py-2 px-3 border-b-2 font-medium transition cursor-pointer ${
                                    detailActiveTab === 'details'
                                        ? 'border-[#0B57D0] text-[#0B57D0] dark:text-[#7CBBF3] dark:border-[#7CBBF3]'
                                        : 'border-transparent text-[#444746] hover:text-[#1F1F1F] dark:text-[#C4C7C5] dark:hover:text-white'
                                }`}
                            >
                                Chi tiết
                            </button>
                            <button
                                type="button"
                                onClick={() => setDetailActiveTab('activity')}
                                className={`py-2 px-3 border-b-2 font-medium transition cursor-pointer ${
                                    detailActiveTab === 'activity'
                                        ? 'border-[#0B57D0] text-[#0B57D0] dark:text-[#7CBBF3] dark:border-[#7CBBF3]'
                                        : 'border-transparent text-[#444746] hover:text-[#1F1F1F] dark:text-[#C4C7C5] dark:hover:text-white'
                                }`}
                            >
                                Hoạt động
                            </button>
                        </div>

                        {/* Drawer Content - Scrollable independently without affecting page */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
                            {detailActiveTab === 'details' ? (
                                <>
                                    {/* 1. Miniature Document Thumbnail Preview */}
                                    {effectiveDetailFile ? (
                                        <div
                                            onClick={() => router.push('/files')}
                                            className="w-full h-36 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative bg-white dark:bg-slate-950 cursor-pointer shadow-none hover:shadow-xs transition group"
                                            title="Nhấp để chuyển sang danh sách tệp"
                                        >
                                            <FileThumbnailPreview
                                                id={effectiveDetailFile.id}
                                                name={effectiveDetailFile.name}
                                                fileType={effectiveDetailFile.fileType}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-24 rounded-xl border border-gray-200 dark:border-slate-800 bg-[#F0F4F9]/60 dark:bg-slate-800/40 flex items-center justify-center gap-2 text-blue-600">
                                            <Folder className="w-6 h-6 fill-blue-500/20" />
                                            <span className="font-medium text-[12.5px]">Kho lưu trữ rikai</span>
                                        </div>
                                    )}

                                    {/* 2. Người có quyền truy cập (Who has access) */}
                                    {(() => {
                                        const isEffectiveOwner = effectiveDetailFile?.isMe || effectiveDetailFile?.owner === 'tôi';

                                        return (
                                            <div className="space-y-1.5 pt-0.5">
                                                <h4 className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                    Người có quyền truy cập
                                                </h4>

                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    {/* Owner avatar */}
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-[10px] text-white shrink-0 shadow-2xs ${getAvatarColor(
                                                            isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.owner || 'Admin')
                                                        )}`}
                                                        title={`Chủ sở hữu: ${isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.owner || 'tôi')}`}
                                                    >
                                                        {(isEffectiveOwner ? (currentUser?.name ? currentUser.name.charAt(0) : 'T') : (effectiveDetailFile?.ownerAvatar || 'A'))[0].toUpperCase()}
                                                    </div>

                                                    {/* Org / Department icon */}
                                                    <div
                                                        className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs"
                                                        title="Thành viên tổ chức"
                                                    >
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                <p className="text-[11.5px] text-[#444746] dark:text-[#C4C7C5] leading-normal pt-0.5">
                                                    {isEffectiveOwner
                                                        ? 'Do bạn sở hữu. Bất kỳ ai có kết nối Internet và có đường liên kết này đều có thể xem.'
                                                        : `Do ${effectiveDetailFile?.owner || 'cộng tác viên'} sở hữu. Bạn có quyền xem tài liệu này.`}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (effectiveDetailFile) {
                                                            router.push(
                                                                `/files/${effectiveDetailFile.id}/permissions`
                                                            );
                                                        }
                                                    }}
                                                    className="mt-1 inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-gray-300 dark:border-slate-700 text-[11.5px] font-medium text-[#0B57D0] dark:text-[#7CBBF3] hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                                >
                                                    Quản lý quyền truy cập
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. Giới hạn về mức bảo mật */}
                                    <div className="space-y-1.5 pt-0.5">
                                        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                            <Shield className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                            <span>Giới hạn về mức bảo mật</span>
                                        </div>
                                        <div className="bg-[#F0F4F9] dark:bg-slate-800/60 rounded-xl p-3 text-[11px] text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                                            Không có giới hạn nào được áp dụng. Nếu quy định hạn chế được áp dụng thì sẽ xuất hiện tại đây.
                                        </div>
                                    </div>

                                    {/* 4. Thông tin chi tiết về tệp */}
                                    {(() => {
                                        const isEffectiveOwner = effectiveDetailFile?.isMe || effectiveDetailFile?.owner === 'tôi';

                                        return (
                                            <div className="space-y-3 pt-0.5">
                                                <h4 className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                    Thông tin chi tiết về tệp
                                                </h4>

                                                <div className="space-y-2.5 text-[12px]">
                                                    {/* Loại */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Loại</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5 uppercase">
                                                            {effectiveDetailFile?.fileType || 'PDF'}
                                                        </p>
                                                    </div>

                                                    {/* Kích thước */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Kích thước</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {effectiveDetailFile?.size || '—'}
                                                        </p>
                                                    </div>

                                                    {/* Bộ nhớ đã dùng */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Bộ nhớ đã dùng</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {effectiveDetailFile?.size || '0 KB'}
                                                        </p>
                                                    </div>

                                                    {/* Địa điểm */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Địa điểm</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (effectiveDetailFile?.folderId) {
                                                                    router.push(`/files?highlightId=${effectiveDetailFile.id}`);
                                                                } else {
                                                                    router.push('/files');
                                                                }
                                                            }}
                                                            className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#747775]/40 bg-white dark:bg-slate-800 text-[11px] font-normal text-[#1F1F1F] dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                                        >
                                                            {effectiveDetailFile?.location === 'Drive' || effectiveDetailFile?.location === 'Drive của tôi' ? (
                                                                <div className="w-3.5 h-3.5 rounded border border-gray-400/80 dark:border-slate-500 flex items-center justify-center text-[7px] font-bold text-gray-600 dark:text-slate-300 shrink-0">
                                                                    ▲
                                                                </div>
                                                            ) : (
                                                                <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                                            )}
                                                            <span className="truncate max-w-[180px]">{effectiveDetailFile?.location || 'Drive'}</span>
                                                        </button>
                                                    </div>

                                                    {/* Chủ sở hữu */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Chủ sở hữu</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.owner || 'tôi')}
                                                        </p>
                                                    </div>

                                                    {/* Lần sửa đổi gần đây nhất */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Lần sửa đổi gần đây nhất</p>
                                                        <div className="flex items-center gap-1 text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            <span>
                                                                {formatGoogleDriveDetailDate(effectiveDetailFile?.updatedAt)} bởi {isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.owner || 'tôi')}
                                                            </span>
                                                            <History className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400 shrink-0" />
                                                        </div>
                                                    </div>

                                                    {/* Đã mở */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Đã mở</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {formatGoogleDriveDetailDate(effectiveDetailFile?.updatedAt)}, do tôi thực hiện
                                                        </p>
                                                    </div>

                                                    {/* Người tạo */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Người tạo</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {formatGoogleDriveDetailDate(effectiveDetailFile?.createdAt || effectiveDetailFile?.updatedAt)}
                                                        </p>
                                                    </div>

                                                    {/* Mô tả */}
                                                    <div className="pt-0.5 pb-2">
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium mb-1.5">Mô tả</p>
                                                        <textarea
                                                            rows={1}
                                                            placeholder="Thêm phần mô tả"
                                                            defaultValue={effectiveDetailFile?.description || ''}
                                                            onInput={(e) => {
                                                                const el = e.currentTarget;
                                                                el.style.height = 'auto';
                                                                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                                                            }}
                                                            className="w-full min-h-[36px] max-h-[120px] px-3 py-2 text-[12px] leading-snug rounded-[4px] border border-[#747775]/50 dark:border-slate-600 bg-transparent text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] dark:placeholder:text-slate-400 hover:border-[#1F1F1F] dark:hover:border-slate-300 focus:border-[#0B57D0] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#0B57D0] dark:focus:ring-blue-500 outline-none transition-colors resize-none overflow-y-auto"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                /* ── TAB HOẠT ĐỘNG (ACTIVITY TIMELINE) ── */
                                <div className="space-y-4">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Lịch sử gần đây
                                    </span>

                                    <div className="relative pl-5 border-l-2 border-blue-200 dark:border-slate-700 space-y-4">
                                        <div className="relative">
                                            <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                                            <p className="font-semibold text-gray-800 dark:text-slate-200">
                                                Đã cập nhật chỉ mục AI Semantic Vector
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {effectiveDetailFile?.updatedAt || 'Hôm nay'} · Hệ thống RAG Engine
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                                            <p className="font-semibold text-gray-800 dark:text-slate-200">
                                                Tải lên tài liệu thành công
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Bởi {effectiveDetailFile?.owner || 'Chủ sở hữu'}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-purple-500 ring-4 ring-white dark:ring-slate-900" />
                                            <p className="font-semibold text-gray-800 dark:text-slate-200">
                                                Khởi tạo quyền truy cập mặc định
                                            </p>
                                            <p className="text-[10px] text-gray-400">Kế thừa phân quyền phòng ban</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FLOATING CONTEXT MENU (Exact match to media_1791044578283.png) */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 w-72 text-[12.5px] context-menu-container animate-in fade-in zoom-in-95 duration-100 select-none text-gray-800 dark:text-slate-200"
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
                                handleOpenInGoogleDocs(contextMenu.file);
                                setContextMenu(null);
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
                                className={`absolute top-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 w-56 z-50 text-[12px] animate-in fade-in zoom-in-95 duration-75 ${
                                    contextMenu.x + 288 + 220 > (typeof window !== 'undefined' ? window.innerWidth : 1200)
                                        ? 'right-full mr-1'
                                        : 'left-full ml-1'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleOpenInGoogleDocs(contextMenu.file);
                                        setContextMenu(null);
                                    }}
                                    className="w-full px-3.5 py-2 flex items-center justify-between text-[#0b57d0] dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 font-medium transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <FileText className="w-4 h-4 text-[#0b57d0] dark:text-blue-400" />
                                        <span>Google Tài liệu (Docs)</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-[#0b57d0] dark:text-blue-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.push('/files');
                                        setContextMenu(null);
                                    }}
                                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    <span>Xem chi tiết nội bộ</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 2. Tải xuống */}
                    <button
                        type="button"
                        onClick={handleDownloadSelected}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>Tải xuống</span>
                    </button>

                    {/* 3. Đổi tên */}
                    <button
                        type="button"
                        disabled={selectedFileIds.length > 1}
                        onClick={() => handleStartRename(contextMenu.file)}
                        className={`w-full px-3.5 py-1.5 flex items-center justify-between transition ${
                            selectedFileIds.length > 1
                                ? 'opacity-40 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none'
                                : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                        title={selectedFileIds.length > 1 ? 'Không thể đổi tên cùng lúc nhiều tệp' : 'Đổi tên (Ctrl+Alt+E)'}
                    >
                        <div className="flex items-center gap-2.5">
                            <Edit3 className="w-4 h-4 text-gray-500" />
                            <span>Đổi tên</span>
                        </div>
                        <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Ctrl+Alt+E</span>
                    </button>

                    {/* 4. Tạo bản sao */}
                    <button
                        type="button"
                        onClick={() => {
                            toast.success(`Đã tạo bản sao của "${contextMenu.file.name}"`);
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Copy className="w-4 h-4 text-gray-500" />
                            <span>Tạo bản sao</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tight">Ctrl+C rồi đến Ctrl+V</span>
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* Hỏi Gemini */}
                    <button
                        type="button"
                        onClick={() => {
                            router.push(
                                `/ai?fileId=${contextMenu.file.id}&fileName=${encodeURIComponent(
                                    contextMenu.file.name
                                )}`
                            );
                            setContextMenu(null);
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

                    {/* 5. Tạo bản tổng quan bằng âm thanh... */}
                    <button
                        type="button"
                        onClick={() => {
                            toast('Tính năng Tổng quan bằng âm thanh đang được hoàn thiện...', { icon: '🎙' });
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Mic className="w-4 h-4 text-gray-500" />
                            <span>Tạo bản tổng quan bằng âm thanh...</span>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-blue-900/60 dark:text-blue-200">
                            Mới
                        </span>
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 6. Chia sẻ > */}
                    <button
                        type="button"
                        onClick={handleShareSelected}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <UserPlus className="w-4 h-4 text-gray-500" />
                            <span>Chia sẻ</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* 7. Sắp xếp > */}
                    <button
                        type="button"
                        onClick={() => {
                            router.push(`/files?highlightId=${contextMenu.file.id}`);
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <FolderInput className="w-4 h-4 text-gray-500" />
                            <span>Sắp xếp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* Gắn / Xóa dấu sao */}
                    <button
                        type="button"
                        onClick={(e) => {
                            handleToggleStar(contextMenu.file.id, e);
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Star
                            className={`w-4 h-4 ${
                                starredFileIds.includes(contextMenu.file.id.toString())
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-gray-500'
                            }`}
                        />
                        <span>
                            {starredFileIds.includes(contextMenu.file.id.toString())
                                ? 'Xóa khỏi mục có gắn dấu sao'
                                : 'Thêm vào mục có gắn dấu sao'}
                        </span>
                    </button>

                    {/* 8. Thông tin về tệp > */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveDetailFile(contextMenu.file);
                            setDetailActiveTab('details');
                            setShowInfoPanel(true);
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-gray-500" />
                            <span>Thông tin về tệp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* 9. Cho phép sử dụng khi không có mạng */}
                    <button
                        type="button"
                        onClick={() => {
                            toast('Chế độ ngoại tuyến chưa được hỗ trợ trên trình duyệt này');
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                        <CloudOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>Cho phép sử dụng khi không có mạng</span>
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 10. Chuyển vào thùng rác */}
                    <button
                        type="button"
                        onClick={handleRequestDeleteFiles}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Trash2 className="w-4 h-4" />
                            <span>Chuyển vào thùng rác</span>
                        </div>
                        <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Delete</span>
                    </button>

                    {/* 11. Không phải đề xuất hữu ích */}
                    <button
                        type="button"
                        onClick={() => {
                            toast.success('Đã ẩn tệp khỏi đề xuất');
                            setContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <ThumbsDown className="w-4 h-4 text-gray-500" />
                        <span>Không phải đề xuất hữu ích</span>
                    </button>
                </div>
            )}

            {/* FLOATING FOLDER CONTEXT MENU (Exact match to media_1791046489059.png) */}
            {folderContextMenu && (
                <div
                    className="fixed z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 w-72 text-[12.5px] folder-context-menu-container animate-in fade-in zoom-in-95 duration-100 select-none text-gray-800 dark:text-slate-200"
                    style={{ left: folderContextMenu.x, top: folderContextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 1. Tải xuống */}
                    <button
                        type="button"
                        onClick={() => handleDownloadFolder(folderContextMenu.folder)}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>Tải xuống</span>
                    </button>

                    {/* 2. Đổi tên */}
                    <button
                        type="button"
                        onClick={() => handleStartRenameFolder(folderContextMenu.folder)}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Edit3 className="w-4 h-4 text-gray-500" />
                            <span>Đổi tên</span>
                        </div>
                        <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Ctrl+Alt+E</span>
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 3. Hỏi Gemini */}
                    <button
                        type="button"
                        onClick={() => {
                            router.push(
                                `/ai?folderId=${folderContextMenu.folder.id}&folderName=${encodeURIComponent(
                                    folderContextMenu.folder.name
                                )}`
                            );
                            setFolderContextMenu(null);
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

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 4. Chia sẻ > */}
                    <button
                        type="button"
                        onClick={() => {
                            router.push(
                                `/files/permissions?folderId=${folderContextMenu.folder.id}&name=${encodeURIComponent(
                                    folderContextMenu.folder.name
                                )}`
                            );
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <UserPlus className="w-4 h-4 text-gray-500" />
                            <span>Chia sẻ</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* 5. Sắp xếp > */}
                    <button
                        type="button"
                        onClick={() => {
                            router.push(`/files?highlightFolderId=${folderContextMenu.folder.id}`);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <FolderInput className="w-4 h-4 text-gray-500" />
                            <span>Sắp xếp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* 6. Thông tin về thư mục > */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowInfoPanel(true);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-gray-500" />
                            <span>Thông tin về thư mục</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    {/* 7. Chuyển vào thùng rác */}
                    <button
                        type="button"
                        onClick={() => handleRequestDeleteFolder(folderContextMenu.folder)}
                        className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <Trash2 className="w-4 h-4" />
                            <span>Chuyển vào thùng rác</span>
                        </div>
                        <span className="text-[10.5px] text-gray-400 font-mono tracking-tight">Delete</span>
                    </button>

                    {/* 8. Không phải đề xuất hữu ích */}
                    <button
                        type="button"
                        onClick={() => {
                            toast.success(`Đã ẩn thư mục "${folderContextMenu.folder.name}" khỏi đề xuất`);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <ThumbsDown className="w-4 h-4 text-gray-500" />
                        <span>Không phải đề xuất hữu ích</span>
                    </button>
                </div>
            )}

            {/* RENAME FOLDER MODAL */}
            {renamingFolder && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md p-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">
                            Đổi tên thư mục
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                            Nhập tên mới cho thư mục:
                        </p>
                        <form onSubmit={handleRenameFolderSubmit}>
                            <input
                                type="text"
                                autoFocus
                                value={renameFolderName}
                                onChange={(e) => setRenameFolderName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-gray-900 dark:text-slate-100 transition"
                                placeholder="Tên thư mục mới..."
                            />
                            <div className="flex items-center justify-end gap-2.5 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setRenamingFolder(null)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isRenamingFolder ||
                                        !renameFolderName.trim() ||
                                        renameFolderName.trim() === renamingFolder.name
                                    }
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {isRenamingFolder && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RENAME MODAL */}
            {renamingFile && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md p-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">
                            Đổi tên tệp
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                            Nhập tên mới cho tệp tin:
                        </p>
                        <form onSubmit={handleRenameSubmit}>
                            <input
                                type="text"
                                autoFocus
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-gray-900 dark:text-slate-100 transition"
                                placeholder="Tên tệp mới..."
                            />
                            <div className="flex items-center justify-end gap-2.5 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setRenamingFile(null)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRenaming || !renameName.trim() || renameName.trim() === renamingFile.name}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {isRenaming && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL (Chuẩn giao diện Google Drive, thay thế hoàn toàn window.confirm / alert) */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                    {deleteModal.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Thao tác này có thể khôi phục trong Thùng rác
                                </p>
                            </div>
                        </div>

                        <p className="text-[13px] text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {deleteModal.message}
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                disabled={isDeletingItem}
                                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeletingItem}
                                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                                {isDeletingItem && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                Chuyển vào thùng rác
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <UploadFileModal
                    parentFolderName="Kho tài liệu"
                    onClose={() => setShowUploadModal(false)}
                    onUpload={async () => {
                        setShowUploadModal(false);
                        toast.success('Đang xử lý tải tệp lên...');
                        fetchHomeData();
                    }}
                />
            )}

            {/* GOOGLE DRIVE DARK SNACKBAR TOAST FOR RENAME (media_1791049803567.png) */}
            {renameToast && (
                <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-4 bg-[#202124] text-white px-4 py-2.5 rounded-[4px] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                    <span className="text-[13.5px] font-normal text-[#e8eaed] tracking-tight">
                        Đã đổi tên “{renameToast.oldName}” thành “{renameToast.newName}”
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-1">
                        <button
                            type="button"
                            onClick={handleUndoRename}
                            className="text-white hover:text-[#8ab4f8] font-medium text-[13.5px] hover:underline cursor-pointer transition px-1 py-0.5"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={() => setRenameToast(null)}
                            className="p-1 text-gray-400 hover:text-white rounded-full transition cursor-pointer hover:bg-white/10"
                            title="Đóng"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* GOOGLE DRIVE DARK SNACKBAR TOAST FOR MOVE FILE */}
            {moveToast && (
                <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-4 bg-[#202124] text-white px-4 py-2.5 rounded-[4px] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                    <span className="text-[13.5px] font-normal text-[#e8eaed] tracking-tight">
                        {moveToast.message}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-1">
                        <button
                            type="button"
                            onClick={handleUndoMove}
                            className="text-white hover:text-[#8ab4f8] font-medium text-[13.5px] hover:underline cursor-pointer transition px-1 py-0.5"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={() => setMoveToast(null)}
                            className="p-1 text-gray-400 hover:text-white rounded-full transition cursor-pointer hover:bg-white/10"
                            title="Đóng"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
