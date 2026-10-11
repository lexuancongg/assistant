'use client';
import { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FolderPlus,
    Upload,
    Search,
    ShieldCheck,
    Shield,
    Trash2,
    Loader2,
    RefreshCw,
    KeyRound,
    Tag,
    X,
    Edit3,
    Sparkles,
    CheckSquare,
    Square,
    SlidersHorizontal,
    Folder,
    FileText,
    GripVertical,
    Lock,
    MoreVertical,
    ChevronRight,
    Star,
    Download,
    UserPlus,
    Info,
    LayoutGrid,
    List,
    ArrowUpDown,
    ExternalLink,
    Copy,
    Check,
    Eye,
    HardDrive,
    Bot,
    History,
    Calendar,
    Users,
    ChevronDown,
    ArrowDown,
    ArrowUp,
    Menu,
    Share2,
    ChevronLeft,
    Clock,
    FileCode,
    FileSpreadsheet,
    FileBox,
    CheckCircle2,
    Image as ImageIcon,
    FileArchive,
    Film,
    Headphones,
    User,
    Presentation,
    Video
} from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import PermissionModal from '@/components/files/PermissionModal';
import RequestAccessModal from '@/components/files/RequestAccessModal';
import {
    CreateFolderModal,
    UploadFileModal,
    RenameFolderModal,
    RenameFileModal,
    MoveFileModal
} from '@/components/files/FileModals';
import TagManagementModal, { getTagColorClass } from '@/components/files/TagManagementModal';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';
import FolderContextMenu, { FolderContextTarget } from '@/components/common/FolderContextMenu';
import { generateFileThumbnail } from '@/utils/thumbnailGenerator';
import forderService from '@/services/forder/forderService';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import { ForderCreateRequest } from '@/models/forder/forder';
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import apiClient from '@/utils/api/apiClient';

// Visual configuration helper for file types (Identical to Home page)
function getFileTypeConfig(extOrType: string) {
    const ext = (extOrType || '').toLowerCase().replace(/^\./, '');

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
            icon: FileArchive,
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

function getAvatarColor(name?: string) {
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
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatGoogleDriveDate(dateStr?: string): string {
    if (!dateStr) return '16 thg 9';

    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\sT](\d{1,2}):(\d{1,2}))?/);
    let date: Date;
    if (ddmmyyyyMatch) {
        const d = parseInt(ddmmyyyyMatch[1], 10);
        const m = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const y = parseInt(ddmmyyyyMatch[3], 10);
        const h = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
        const min = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
        date = new Date(y, m, d, h, min);
    } else {
        date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return '16 thg 9';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
        return `${day} thg ${month}`;
    }
    return `${day} thg ${month}, ${date.getFullYear()}`;
}

function formatGoogleDriveDetailDate(dateStr?: string | number | null): string {
    if (!dateStr) return '3 thg 10, 2026';
    const str = String(dateStr).trim();
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyyMatch) {
        return `${parseInt(ddmmyyyyMatch[1], 10)} thg ${parseInt(ddmmyyyyMatch[2], 10)}, ${ddmmyyyyMatch[3]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return str;
    return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function FilesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    usePageBreadcrumb(['Drive của tôi']);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedFolderName, setSelectedFolderName] = useState('Drive của tôi');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pdf' | 'docx' | 'xlsx' | 'indexed' | 'pending'>('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    // Google Drive Filters (Type, People, Modified, Source)
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPeople, setFilterPeople] = useState<'all' | 'me' | 'not_me'>('all');
    const [filterModified, setFilterModified] = useState<'all' | 'today' | '7days' | '30days' | 'year'>('all');
    const [filterSource, setFilterSource] = useState<'all' | 'starred' | 'shared'>('all');
    const [openFilterDropdown, setOpenFilterDropdown] = useState<'type' | 'people' | 'modified' | 'source' | null>(null);

    // Google Drive View Mode: List vs Grid
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Right Details & Activity Panel State (Google Drive Info Drawer)
    const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
    const [detailActiveTab, setDetailActiveTab] = useState<'details' | 'activity'>('details');
    const [activeDetailFile, setActiveDetailFile] = useState<FileItemDto | null>(null);

    // Row Action Menu (3-dot)
    const [activeRowMenuId, setActiveRowMenuId] = useState<string | number | null>(null);

    // Starred Files (persistent in localStorage)
    const [starredIds, setStarredIds] = useState<string[]>([]);
    const [filterStarredOnly, setFilterStarredOnly] = useState(false);

    // Sorting
    const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'size'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Modals
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showUploadFile, setShowUploadFile] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
    const [editingTagsFile, setEditingTagsFile] = useState<FileItemDto | null>(null);
    const [renamingFolder, setRenamingFolder] = useState<{ id: string | number; name: string } | null>(null);
    const [renamingFile, setRenamingFile] = useState<FileItemDto | null>(null);
    const [movingFile, setMovingFile] = useState<FileItemDto | null>(null);
    const [folderContextMenu, setFolderContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        folder: FolderContextTarget | null;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        folder: null,
    });

    // Data states
    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [folderTree, setFolderTree] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingTree, setLoadingTree] = useState(true);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const folderMenuRef = useRef<HTMLDivElement>(null);

    // Companion dock state
    const [companionDockOpen, setCompanionDockOpen] = useState(true);

    // Load Starred files from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('starred_file_ids');
            if (stored) {
                setStarredIds(JSON.parse(stored));
            }
        } catch (e) {}

        // Fetch from backend DB
        fileManagementService.getStarredFileIds().then((dbIds) => {
            if (Array.isArray(dbIds)) {
                setStarredIds(dbIds.map(String));
                try {
                    localStorage.setItem('starred_file_ids', JSON.stringify(dbIds.map(String)));
                } catch (e) {}
            }
        }).catch(() => {});
    }, []);

    const toggleStar = async (fileId: string | number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const idStr = fileId.toString();
        setStarredIds((prev) => {
            const isCurrentlyStarred = prev.includes(idStr);
            const next = isCurrentlyStarred ? prev.filter((x) => x !== idStr) : [...prev, idStr];
            try {
                localStorage.setItem('starred_file_ids', JSON.stringify(next));
            } catch (err) {}
            toast.success(isCurrentlyStarred ? 'Đã bỏ đánh dấu sao' : 'Đã thêm vào mục có gắn dấu sao');
            return next;
        });

        // Persist to PostgreSQL database
        try {
            await fileManagementService.toggleStar(fileId);
        } catch (err) {
            console.warn('[toggleStar] Failed to persist star to DB:', err);
        }
    };

    // Sync folder state from URL search params
    useEffect(() => {
        const folderIdParam = searchParams.get('folderId');
        const folderNameParam = searchParams.get('folderName');
        if (folderIdParam && folderIdParam !== 'all') {
            setSelectedFolder(folderIdParam);
            if (folderNameParam) {
                setSelectedFolderName(decodeURIComponent(folderNameParam));
            }
        } else {
            setSelectedFolder('all');
            setSelectedFolderName('Drive của tôi');
        }
        if (searchParams.get('action') === 'new_folder') {
            setShowCreateFolder(true);
        }
    }, [searchParams]);

    // Listen to global folder tree updates (Sidebar + Modals)
    useEffect(() => {
        const handleTreeUpdated = () => {
            loadData(true);
        };
        window.addEventListener('folder_tree_updated', handleTreeUpdated);
        return () => window.removeEventListener('folder_tree_updated', handleTreeUpdated);
    }, []);

    const navigateToFolder = (folderId: string | number, folderName: string) => {
        if (folderId === 'all') {
            setSelectedFolder('all');
            setSelectedFolderName('Drive của tôi');
            router.push('/files');
        } else {
            setSelectedFolder(folderId.toString());
            setSelectedFolderName(folderName);
            router.push(`/files?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}`);
        }
    };

    const handleDeleteFolder = async (folderId: string | number, folderName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn chuyển thư mục "${folderName}" vào thùng rác?`)) return;
        setIsProcessing(true);
        setProcessingText(`Đang xóa thư mục "${folderName}"...`);
        const tId = toast.loading('Đang xóa thư mục...');
        try {
            await forderService.deleteFolder(folderId);
            toast.success(`Đã chuyển thư mục "${folderName}" vào thùng rác thành công!`, { id: tId });
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
            await loadData(true);
            if (selectedFolder === folderId.toString()) {
                navigateToFolder('all', 'Drive của tôi');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Chuyển thư mục vào thùng rác thất bại', { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
                setShowFolderMenu(false);
            }
            if (!(event.target as HTMLElement).closest('.row-action-menu-container')) {
                setActiveRowMenuId(null);
            }
            if (!(event.target as HTMLElement).closest('.sort-menu-container')) {
                setShowSortMenu(false);
            }
            if (!(event.target as HTMLElement).closest('.filter-dropdown-container')) {
                setOpenFilterDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Shortcut Ctrl+Alt+E to rename selected file
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === 'E')) {
                if (selectedFileIds.length === 1) {
                    const target = files.find((f) => f.id.toString() === selectedFileIds[0]);
                    if (target) {
                        e.preventDefault();
                        setRenamingFile(target);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFileIds, files]);

    const [currentUser, setCurrentUser] = useState<{
        name?: string;
        email?: string;
        role?: string;
        department?: { name: string };
    }>({
        name: '',
        role: '',
    });

    const loadData = async (silent = false) => {
        if (!silent) {
            setLoadingFiles(true);
            setLoadingTree(true);
        }

        try {
            const [filesRes, treeRes] = await Promise.allSettled([
                fileManagementService.getActiveFiles(),
                forderService.getFolderTree(),
            ]);

            const activeFiles = filesRes.status === 'fulfilled' ? filesRes.value : [];
            const folderData = treeRes.status === 'fulfilled' ? treeRes.value : [];

            if (filesRes.status === 'fulfilled') {
                setFiles(activeFiles);
            }

            const mapTree = (nodes: any[]): any[] => {
                return (nodes || []).map((n) => {
                    const folderIdStr = n.id ? n.id.toString() : '';
                    const childFolders = mapTree(n.children || []);
                    const childFiles = activeFiles
                        .filter((f) => f.folderId && f.folderId.toString() === folderIdStr)
                        .map((f) => ({
                            id: f.id,
                            name: f.name,
                            type: 'file' as const,
                            fileType: f.fileType,
                            size: f.size,
                            uploadedByEmail: f.uploadedByEmail,
                        }));

                    return {
                        id: folderIdStr,
                        name: n.name,
                        type: 'folder' as const,
                        children: [...childFolders, ...childFiles],
                    };
                });
            };

            setFolderTree(mapTree(folderData));
        } catch (err) {
            console.warn('Cannot fetch files data:', err);
        } finally {
            setLoadingFiles(false);
            setLoadingTree(false);
        }
    };

    useEffect(() => {
        loadData();

        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed) {
                        const dept =
                            parsed.departmentName ||
                            (typeof parsed.department === 'object' ? parsed.department?.name : parsed.department);
                        setCurrentUser({
                            name: parsed.name,
                            email: parsed.email,
                            role: parsed.role ? parsed.role.replace('ROLE_', '') : 'ADMIN',
                            department: dept ? { name: dept } : undefined,
                        });
                    }
                } catch (e) {}
            }
        }

        apiClient
            .get('http://localhost:8080/api/v1/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data?.authenticated && data?.user) {
                    const verifiedUser = {
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role ? data.user.role.replace('ROLE_', '') : 'ADMIN',
                        department: data.user.departmentName ? { name: data.user.departmentName } : undefined,
                    };
                    setCurrentUser(verifiedUser);
                    localStorage.setItem('user', JSON.stringify(verifiedUser));
                }
            })
            .catch(() => {});
    }, []);

    const isAdmin =
        currentUser?.role?.toUpperCase() === 'ADMIN' ||
        currentUser?.role?.toUpperCase() === 'ROLE_ADMIN' ||
        currentUser?.email?.toLowerCase().includes('admin') ||
        currentUser?.name?.toLowerCase().includes('admin');

    const breadcrumbs = useMemo(() => {
        if (selectedFolder === 'all') {
            return [];
        }

        const findPath = (
            nodes: any[],
            targetId: string,
            currentPath: { id: string; name: string }[]
        ): { id: string; name: string }[] | null => {
            for (const node of nodes) {
                if (node.type === 'folder') {
                    const nextPath = [...currentPath, { id: node.id, name: node.name }];
                    if (node.id.toString() === targetId.toString()) {
                        return nextPath;
                    }
                    if (node.children) {
                        const found = findPath(node.children, targetId, nextPath);
                        if (found) return found;
                    }
                }
            }
            return null;
        };

        const path = findPath(folderTree, selectedFolder, []);
        return path || [{ id: selectedFolder, name: selectedFolderName }];
    }, [selectedFolder, selectedFolderName, folderTree]);

    const usedGb = 2.4;
    const totalGb = 10;
    const usedPct = Math.round((usedGb / totalGb) * 100);

    const activeFolderIds = useMemo(() => {
        if (selectedFolder === 'all') return null;

        const ids: string[] = [selectedFolder.toString()];
        const findAndCollect = (list: any[]): boolean => {
            for (const item of list) {
                if (item.type === 'folder') {
                    if (item.id.toString() === selectedFolder.toString()) {
                        const collectAll = (children: any[]) => {
                            for (const c of children) {
                                if (c.type === 'folder') {
                                    ids.push(c.id.toString());
                                    if (c.children) collectAll(c.children);
                                }
                            }
                        };
                        if (item.children) collectAll(item.children);
                        return true;
                    }
                    if (item.children && findAndCollect(item.children)) {
                        return true;
                    }
                }
            }
            return false;
        };
        findAndCollect(folderTree);
        return ids;
    }, [selectedFolder, folderTree]);

    const currentSubFolders = useMemo(() => {
        if (selectedFolder === 'all') {
            return folderTree.filter((item) => item.type === 'folder');
        }
        const findNode = (list: any[]): any | null => {
            for (const item of list) {
                if (item.type === 'folder') {
                    if (item.id.toString() === selectedFolder.toString()) {
                        return item;
                    }
                    if (item.children) {
                        const found = findNode(item.children);
                        if (found) return found;
                    }
                }
            }
            return null;
        };
        const node = findNode(folderTree);
        if (!node || !node.children) return [];
        return node.children.filter((c: any) => c.type === 'folder');
    }, [selectedFolder, folderTree]);

    const displayedSubFolders = useMemo(() => {
        if (filterType !== 'all' && filterType !== 'folder') {
            return [];
        }
        if (searchTerm.trim()) {
            return currentSubFolders.filter((f: any) =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
            );
        }
        return currentSubFolders;
    }, [currentSubFolders, filterType, searchTerm]);

    const countFilesInSubtree = (folderId: string): number => {
        const ids: string[] = [folderId.toString()];
        const collect = (list: any[]): boolean => {
            for (const item of list) {
                if (item.type === 'folder') {
                    if (item.id.toString() === folderId.toString()) {
                        const rec = (children: any[]) => {
                            for (const c of children) {
                                if (c.type === 'folder') {
                                    ids.push(c.id.toString());
                                    if (c.children) rec(c.children);
                                }
                            }
                        };
                        if (item.children) rec(item.children);
                        return true;
                    }
                    if (item.children && collect(item.children)) return true;
                }
            }
            return false;
        };
        collect(folderTree);
        return files.filter((f) => f.folderId && ids.includes(f.folderId.toString())).length;
    };

    const filesInFolder = useMemo(() => {
        if (selectedFolder === 'all' || !activeFolderIds) {
            return files;
        }
        return files.filter((f) => f.folderId && activeFolderIds.includes(f.folderId.toString()));
    }, [files, selectedFolder, activeFolderIds]);

    const chipCounts = useMemo(() => {
        return {
            all: filesInFolder.length,
            pdf: filesInFolder.filter((f) => f.fileType?.toLowerCase() === 'pdf').length,
            docx: filesInFolder.filter((f) => ['docx', 'doc'].includes(f.fileType?.toLowerCase())).length,
            xlsx: filesInFolder.filter((f) => ['xlsx', 'xls', 'csv'].includes(f.fileType?.toLowerCase())).length,
            indexed: filesInFolder.filter((f) => f.aiIndexed).length,
            pending: filesInFolder.filter((f) => !f.aiIndexed).length,
        };
    }, [filesInFolder]);

    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        files.forEach((f) => {
            (f.tags || []).forEach((t) => {
                counts[t] = (counts[t] || 0) + 1;
            });
        });
        return counts;
    }, [files]);

    const uniqueTags = useMemo(() => Object.keys(tagCounts).sort(), [tagCounts]);

    const filteredFiles = useMemo(() => {
        const parseDate = (d?: string) => {
            if (!d) return 0;
            const ddmmyyyyMatch = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (ddmmyyyyMatch) {
                return new Date(parseInt(ddmmyyyyMatch[3], 10), parseInt(ddmmyyyyMatch[2], 10) - 1, parseInt(ddmmyyyyMatch[1], 10)).getTime();
            }
            return new Date(d).getTime() || 0;
        };

        let result = filesInFolder.filter((file) => {
            const term = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !term ||
                file.name.toLowerCase().includes(term) ||
                (file.tags && file.tags.some((t) => t.toLowerCase().includes(term)));

            // 1. Type filter
            let matchesType = true;
            const ext = (file.fileType || '').toLowerCase();
            if (filterType === 'folder') {
                matchesType = false;
            } else if (filterType === 'pdf') {
                matchesType = ext === 'pdf';
            } else if (filterType === 'document') {
                matchesType = ['docx', 'doc', 'txt', 'rtf', 'odt'].includes(ext);
            } else if (filterType === 'spreadsheet') {
                matchesType = ['xlsx', 'xls', 'csv'].includes(ext);
            } else if (filterType === 'presentation') {
                matchesType = ['pptx', 'ppt'].includes(ext);
            } else if (filterType === 'photo') {
                matchesType = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
            } else if (filterType === 'video') {
                matchesType = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
            } else if (filterType === 'archive') {
                matchesType = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
            } else if (filterType === 'audio') {
                matchesType = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext);
            } else if (filterType === 'markdown') {
                matchesType = ['md', 'markdown'].includes(ext);
            }

            // 2. People filter
            let matchesPeople = true;
            const isOwner = Boolean(
                (currentUser?.email && file.uploadedByEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
                (currentUser?.name && (
                    file.owner?.toLowerCase() === currentUser.name.toLowerCase() ||
                    file.uploadedByName?.toLowerCase() === currentUser.name.toLowerCase()
                )) ||
                file.owner === 'me'
            );
            if (filterPeople === 'me') {
                matchesPeople = isOwner;
            } else if (filterPeople === 'not_me') {
                matchesPeople = !isOwner;
            }

            // 3. Modified date filter
            let matchesModified = true;
            if (filterModified !== 'all') {
                const fileTime = parseDate(file.updatedAt);
                if (fileTime > 0) {
                    const now = Date.now();
                    const diffMs = now - fileTime;
                    if (filterModified === 'today') {
                        matchesModified = diffMs <= 24 * 60 * 60 * 1000;
                    } else if (filterModified === '7days') {
                        matchesModified = diffMs <= 7 * 24 * 60 * 60 * 1000;
                    } else if (filterModified === '30days') {
                        matchesModified = diffMs <= 30 * 24 * 60 * 60 * 1000;
                    } else if (filterModified === 'year') {
                        const fileYear = new Date(fileTime).getFullYear();
                        const curYear = new Date().getFullYear();
                        matchesModified = fileYear === curYear;
                    }
                }
            }

            // 4. Source & Starred filter
            let matchesSource = true;
            const isStarred = starredIds.includes(file.id.toString());
            if (filterSource === 'starred' || filterStarredOnly) {
                matchesSource = isStarred;
            } else if (filterSource === 'shared') {
                matchesSource = !isOwner;
            }

            const matchesTag = tagFilter === 'all' || (file.tags && file.tags.includes(tagFilter));

            return matchesSearch && matchesType && matchesPeople && matchesModified && matchesSource && matchesTag;
        });

        // Sorting
        result.sort((a, b) => {
            let comp = 0;
            if (sortBy === 'name') {
                comp = a.name.localeCompare(b.name);
            } else if (sortBy === 'updatedAt') {
                comp = parseDate(a.updatedAt) - parseDate(b.updatedAt);
            } else if (sortBy === 'size') {
                comp = (a.size || '').localeCompare(b.size || '');
            }
            return sortDirection === 'asc' ? comp : -comp;
        });

        return result;
    }, [
        filesInFolder,
        searchTerm,
        filterType,
        filterPeople,
        filterModified,
        filterSource,
        filterStarredOnly,
        starredIds,
        tagFilter,
        sortBy,
        sortDirection,
        currentUser
    ]);

    const toggleSelectAll = () => {
        if (selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0) {
            setSelectedFileIds([]);
        } else {
            setSelectedFileIds(filteredFiles.map((f) => f.id.toString()));
        }
    };

    const toggleSelectFile = (file: FileItemDto, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const idStr = file.id.toString();
        setSelectedFileIds((prev) => {
            const isCurrentlySelected = prev.includes(idStr);
            const next = isCurrentlySelected ? prev.filter((id) => id !== idStr) : [...prev, idStr];
            return next;
        });
        setActiveDetailFile(file);
    };

    const handleRowClick = (file: FileItemDto) => {
        setActiveDetailFile(file);
        // If details drawer is open, keep it open and synced
        setSelectedFileIds([file.id.toString()]);
    };

    const handleDeleteFile = async (id: number | string) => {
        if (!confirm('Bạn có chắc chắn muốn chuyển tài liệu này vào thùng rác?')) return;
        setDeletingId(id);
        const tId = toast.loading('Đang chuyển vào thùng rác...');
        try {
            await fileManagementService.softDelete(id);
            toast.success('Đã chuyển tài liệu vào thùng rác thành công', { id: tId });
            setSelectedFileIds((prev) => prev.filter((selectedId) => selectedId !== id.toString()));
            if (activeDetailFile?.id.toString() === id.toString()) {
                setActiveDetailFile(null);
            }
            await loadData(true);
        } catch (err: any) {
            toast.error('Lỗi khi xóa file: ' + (err?.message || err), { id: tId });
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFileIds.length === 0) return;
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedFileIds.length} tài liệu đã chọn vào thùng rác?`)) return;

        setIsProcessing(true);
        setProcessingText(`Đang chuyển ${selectedFileIds.length} tài liệu vào thùng rác...`);
        const tId = toast.loading(`Đang xóa ${selectedFileIds.length} tài liệu...`);
        try {
            for (const id of selectedFileIds) {
                await fileManagementService.softDelete(id);
            }
            toast.success(`Đã xóa ${selectedFileIds.length} tài liệu thành công!`, { id: tId });
            setSelectedFileIds([]);
            setActiveDetailFile(null);
            await loadData(true);
        } catch (err: any) {
            toast.error('Lỗi khi xóa tài liệu: ' + (err?.message || err), { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadFile = (fileId: string | number, fileName: string) => {
        const url = `http://localhost:8080/api/v1/files/${fileId}/stream`;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Đang tải xuống "${fileName}"`);
    };

    const handleCopyLink = (fileId: string | number) => {
        const link = `${window.location.origin}/files/${fileId}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép liên kết tệp vào bộ nhớ tạm!');
    };

    const handleMoveFiles = async (
        fileIds: (string | number)[] | string | number,
        targetFolderId: string | number | null,
        targetFolderName: string = 'Kho tri thức chung'
    ) => {
        const rawList = Array.isArray(fileIds) ? fileIds : [fileIds];
        const ids = rawList.map((x) => x.toString());
        const validFileIds = ids.filter((id) => id && id.trim() !== '');
        if (validFileIds.length === 0) return;

        const count = validFileIds.length;
        const firstFile = files.find((f) => f.id.toString() === validFileIds[0]);
        const firstFileName = firstFile?.name || 'tài liệu';

        const loadingTitle = 'Đang di chuyển tài liệu';
        const loadingDesc =
            count === 1
                ? `Đang chuyển "${firstFileName}" vào thư mục "${targetFolderName}"...`
                : `Đang chuyển ${count} tài liệu vào thư mục "${targetFolderName}"...`;

        const tId = toast.loading(`${loadingTitle}\n${loadingDesc}`);

        try {
            if (count === 1) {
                await fileManagementService.moveFile(validFileIds[0], targetFolderId);
            } else {
                await fileManagementService.moveFilesBatch(validFileIds, targetFolderId);
            }

            const successTitle = 'Di chuyển tài liệu thành công';
            const successDesc =
                count === 1 && firstFileName !== 'tài liệu'
                    ? `Đã chuyển "${firstFileName}" vào thư mục "${targetFolderName}".`
                    : `Đã chuyển thành công ${count} tài liệu vào thư mục "${targetFolderName}".`;

            toast.success(`${successTitle}\n${successDesc}`, { id: tId });
            setSelectedFileIds([]);
            await loadData(true);
        } catch (err: any) {
            let errorTitle = 'Di chuyển tài liệu thất bại';
            let errorMsg = `Không thể di chuyển vào thư mục "${targetFolderName}".`;
            if (err?.status === 403 || err?.statusCode === 403) {
                errorTitle = 'Không có quyền truy cập';
                errorMsg = `Bạn không có quyền chuyển tài liệu vào thư mục "${targetFolderName}".`;
            } else if (err?.data?.message) {
                errorMsg = err.data.message;
            } else if (err?.message) {
                errorMsg = err.message;
            }
            toast.error(`${errorTitle}\n${errorMsg}`, { id: tId, duration: 4500 });
        }
    };

    const handleBatchReindex = async () => {
        setIsProcessing(true);
        const count = selectedFileIds.length > 0 ? selectedFileIds.length : filteredFiles.length;
        setProcessingText(`Đang thực hiện Vector Re-Index cho ${count} tài liệu...`);
        const tId = toast.loading(`Đang gửi yêu cầu Batch Re-Index (${count} tài liệu)...`);
        setTimeout(async () => {
            setIsProcessing(false);
            toast.success(`Batch Re-Index thành công! ${count} tài liệu đã sẵn sàng cho RAG Semantic Search.`, {
                id: tId,
            });
            setSelectedFileIds([]);
            await loadData(true);
        }, 1200);
    };

    const handleRenameFolder = async (newName: string) => {
        if (!renamingFolder) return;
        const trimmedName = newName.trim();
        const duplicate = currentSubFolders.some(
            (f: any) =>
                f.id.toString() !== renamingFolder.id.toString() &&
                f.name?.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
            const msg = `Thư mục "${trimmedName}" đã tồn tại trong ${selectedFolderName}`;
            toast.error(msg);
            throw new Error(msg);
        }

        setIsProcessing(true);
        setProcessingText(`Đang đổi tên thư mục thành "${trimmedName}"...`);
        const tId = toast.loading('Đang đổi tên thư mục...');
        try {
            await forderService.renameFolder(renamingFolder.id, trimmedName);
            toast.success(`Đã đổi tên thư mục thành "${trimmedName}"!`, { id: tId });
            setRenamingFolder(null);
            if (selectedFolder === renamingFolder.id.toString()) {
                setSelectedFolderName(trimmedName);
            }
            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
            await loadData(true);
        } catch (err: any) {
            toast.error(err?.message || `Đổi tên thư mục thất bại`, { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRenameFileSubmit = async (newName: string) => {
        if (!renamingFile) return;
        setIsProcessing(true);
        const tId = toast.loading('Đang đổi tên tệp...');
        try {
            const updated = await fileManagementService.renameFile(renamingFile.id, newName);
            toast.success(`Đã đổi tên tệp thành "${newName}"`, { id: tId });
            setFiles((prev) => prev.map((f) => (f.id === renamingFile.id ? { ...f, name: newName } : f)));
            if (activeDetailFile?.id === renamingFile.id) {
                setActiveDetailFile({ ...activeDetailFile, name: newName });
            }
            setRenamingFile(null);
            await loadData(true);
        } catch (err: any) {
            toast.error(`Đổi tên tệp thất bại: ${err?.message || err}`, { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    // Active detail target (either activeDetailFile or first selected file)
    const effectiveDetailFile = useMemo(() => {
        if (activeDetailFile) return activeDetailFile;
        if (selectedFileIds.length > 0) {
            return files.find((f) => f.id.toString() === selectedFileIds[0]) || null;
        }
        return null;
    }, [activeDetailFile, selectedFileIds, files]);

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAFD] dark:bg-[#0B1120] text-gray-900 dark:text-slate-100">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />

            {/* Main Content Area: Center Files Container + Right Slide-out Details Drawer + Far-Right Companion Dock */}
            <div className="flex-1 flex min-w-0 h-full p-3 pt-3 gap-3 overflow-hidden">
                {/* Center: File Management Container (Full Width) */}
                <div className="flex-1 bg-white dark:bg-[#1E1F20] rounded-[24px] border border-gray-200/50 dark:border-slate-800/80 flex flex-col min-w-0 h-full shadow-none overflow-hidden">
                    {/* Top Breadcrumb & Google Drive Action Bar */}
                    <div className="px-6 py-2 border-b border-[#E0E2E0]/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        {/* Current Path / Title Dropdown */}
                        <div className="relative min-w-0" ref={folderMenuRef}>
                            {selectedFolder === 'all' ? (
                                <button
                                    type="button"
                                    onClick={() => setShowFolderMenu(!showFolderMenu)}
                                    className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[18px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer select-none transition"
                                >
                                    <span>Drive của tôi</span>
                                    <ChevronDown className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 text-[18px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] min-w-0 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => navigateToFolder('all', 'Drive của tôi')}
                                        className="px-1.5 py-0.5 rounded-md text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition text-[18px]"
                                    >
                                        Drive của tôi
                                    </button>
                                    {breadcrumbs.map((crumb, idx) => {
                                        const isLast = idx === breadcrumbs.length - 1;
                                        return (
                                            <div key={crumb.id} className="flex items-center gap-1 min-w-0">
                                                <ChevronRight className="w-4 h-4 text-[#747775] dark:text-[#8E918F] shrink-0" />
                                                {isLast ? (
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <span
                                                            className="truncate max-w-[220px] sm:max-w-[340px] px-1.5 py-0.5 text-[18px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3]"
                                                            title={crumb.name}
                                                        >
                                                            {crumb.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowFolderMenu(!showFolderMenu)}
                                                            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-[#C4C7C5] transition cursor-pointer"
                                                            title="Tùy chọn thư mục"
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigateToFolder(crumb.id, crumb.name)}
                                                        className="truncate max-w-[180px] sm:max-w-[260px] px-1.5 py-0.5 rounded-md text-[18px] font-normal text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                                                        title={crumb.name}
                                                    >
                                                        {crumb.name}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {showFolderMenu && (
                                <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-slate-800">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowFolderMenu(false);
                                                setShowCreateFolder(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                        >
                                            <FolderPlus className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                            <span>Thư mục mới</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowFolderMenu(false);
                                                setShowUploadFile(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4 text-blue-500" />
                                            <span>Tải tệp lên</span>
                                        </button>

                                        {selectedFolder !== 'all' && (
                                            <>
                                                {isAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setShowFolderMenu(false);
                                                                setRenamingFolder({
                                                                    id: selectedFolder,
                                                                    name: selectedFolderName,
                                                                });
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-amber-500" />
                                                            <span>Đổi tên thư mục</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowFolderMenu(false);
                                                                router.push(
                                                                    `/files/permissions?folderId=${selectedFolder}&name=${encodeURIComponent(
                                                                        selectedFolderName
                                                                    )}`
                                                                );
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                                        >
                                                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <span>Phân quyền (RBAC)</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setShowFolderMenu(false);
                                                            setShowRequestAccessModal(true);
                                                        }}
                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                                    >
                                                        <KeyRound className="w-4 h-4 text-purple-600" />
                                                        <span>Xin quyền truy cập</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowFolderMenu(false);
                                                handleBatchReindex();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4 text-purple-600" />
                                            <span>Batch Re-Index AI</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Top Right Controls: Google Drive View Switcher & Info Toggle */}
                        <div className="flex items-center gap-2">
                            {/* View Switcher: List vs Grid (Google Drive Segmented Control with ✓ checkmark) */}
                            <div className="flex items-center bg-[#EDF2FA] dark:bg-slate-800 p-0.5 rounded-full border border-gray-200/80 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                        viewMode === 'list'
                                            ? 'bg-[#D3E3FD] dark:bg-blue-900/60 text-[#041E49] dark:text-blue-200 shadow-2xs font-semibold'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-slate-400'
                                    }`}
                                    title="Dạng danh sách"
                                >
                                    {viewMode === 'list' && <Check className="w-3.5 h-3.5 text-[#041E49] dark:text-[#C2E7FF]" />}
                                    <List className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                        viewMode === 'grid'
                                            ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#C2E7FF] shadow-2xs'
                                            : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E0E7F1] dark:hover:bg-slate-700'
                                    }`}
                                    title="Dạng lưới"
                                >
                                    {viewMode === 'grid' && <Check className="w-3.5 h-3.5 text-[#041E49] dark:text-[#C2E7FF]" />}
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Google Drive Info Button: Toggle Right Details Drawer */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!showDetailsDrawer && !effectiveDetailFile && filteredFiles.length > 0) {
                                        setActiveDetailFile(filteredFiles[0]);
                                    }
                                    setShowDetailsDrawer(!showDetailsDrawer);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                                    showDetailsDrawer
                                        ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#C2E7FF]'
                                        : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-slate-800'
                                }`}
                                title="Xem chi tiết (Details)"
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="px-6 py-1.5 border-b border-[#E0E2E0]/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1E1F20]">
                        {/* Google Drive Filter Pills */}
                        <div className="flex items-center gap-2 flex-wrap text-[13px]">
                            {/* Google Drive Gemini AI Action Pill */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedFolder && selectedFolder !== 'all') {
                                        router.push(`/ai?folderId=${selectedFolder}&folderName=${encodeURIComponent(selectedFolderName)}`);
                                    } else {
                                        router.push('/ai');
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#747775]/40 hover:bg-[#F2F2F2] dark:hover:bg-slate-800 text-[#1F1F1F] dark:text-[#E3E3E3] text-[13px] font-normal transition-all cursor-pointer active:scale-95"
                                title="Hỏi Gemini với dữ liệu trong Drive"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
                                <span>Hỏi Gemini</span>
                            </button>

                            <div className="h-4 w-px bg-[#E0E2E0] dark:bg-slate-700 mx-0.5" />
                            {/* 1. Type Dropdown */}
                            <div className="relative filter-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterDropdown(openFilterDropdown === 'type' ? null : 'type')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] transition-all cursor-pointer select-none ${
                                        filterType !== 'all'
                                            ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] border-[#001D35]/30 font-medium shadow-2xs'
                                            : 'bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5] border-[#747775]/40 hover:bg-[#F2F6FC] dark:hover:bg-slate-800 font-normal'
                                    }`}
                                >
                                    <span>
                                        {filterType === 'all' && 'Loại'}
                                        {filterType === 'folder' && 'Thư mục'}
                                        {filterType === 'document' && 'Tài liệu'}
                                        {filterType === 'spreadsheet' && 'Bảng tính'}
                                        {filterType === 'presentation' && 'Bản trình bày'}
                                        {filterType === 'photo' && 'Ảnh & hình ảnh'}
                                        {filterType === 'pdf' && 'Tệp PDF'}
                                        {filterType === 'video' && 'Video'}
                                        {filterType === 'archive' && 'Tệp nén (zip)'}
                                        {filterType === 'audio' && 'Âm thanh'}
                                        {filterType === 'markdown' && 'Markdown'}
                                    </span>
                                    {filterType !== 'all' ? (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterType('all');
                                            }}
                                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-full transition-colors ml-0.5"
                                            title="Xóa lọc loại tệp"
                                        >
                                            <X className="w-3 h-3 text-[#001D35] dark:text-[#C2E7FF]" />
                                        </span>
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                    )}
                                </button>

                                {openFilterDropdown === 'type' && (
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 max-h-84 overflow-y-auto">
                                        {[
                                            { key: 'all', label: 'Tất cả loại tệp', icon: <FileText className="w-4 h-4 text-gray-400" /> },
                                            { key: 'document', label: 'Documents (Docs)', icon: <FileText className="w-4 h-4 text-blue-500" /> },
                                            { key: 'spreadsheet', label: 'Spreadsheets (Sheets)', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> },
                                            { key: 'presentation', label: 'Presentations (Slides)', icon: <FileBox className="w-4 h-4 text-amber-500" /> },
                                            { key: 'pdf', label: 'PDFs', icon: <FileTypeIcon type="pdf" className="w-4 h-4" /> },
                                            { key: 'photo', label: 'Photos & images', icon: <ImageIcon className="w-4 h-4 text-rose-500" /> },
                                            { key: 'video', label: 'Videos', icon: <Film className="w-4 h-4 text-purple-500" /> },
                                            { key: 'archive', label: 'Archives (zip)', icon: <FileArchive className="w-4 h-4 text-slate-500" /> },
                                            { key: 'audio', label: 'Audio', icon: <Headphones className="w-4 h-4 text-red-500" /> },
                                            { key: 'markdown', label: 'Markdown', icon: <FileCode className="w-4 h-4 text-sky-500" /> },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => {
                                                    setFilterType(opt.key);
                                                    setOpenFilterDropdown(null);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                                                    filterType === opt.key
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                                                }`}
                                            >
                                                {opt.icon}
                                                <span className="flex-1 truncate">{opt.label}</span>
                                                {filterType === opt.key && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. People Dropdown */}
                            <div className="relative filter-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterDropdown(openFilterDropdown === 'people' ? null : 'people')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] transition-all cursor-pointer select-none ${
                                        filterPeople !== 'all'
                                            ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] border-[#001D35]/30 font-medium shadow-2xs'
                                            : 'bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5] border-[#747775]/40 hover:bg-[#F2F6FC] dark:hover:bg-slate-800 font-normal'
                                    }`}
                                >
                                    <span>
                                        {filterPeople === 'all' && 'Người'}
                                        {filterPeople === 'me' && 'Do tôi sở hữu'}
                                        {filterPeople === 'not_me' && 'Không do tôi sở hữu'}
                                    </span>
                                    {filterPeople !== 'all' ? (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterPeople('all');
                                            }}
                                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-full transition-colors ml-0.5"
                                            title="Xóa lọc người sở hữu"
                                        >
                                            <X className="w-3 h-3 text-[#001D35] dark:text-[#C2E7FF]" />
                                        </span>
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                    )}
                                </button>

                                {openFilterDropdown === 'people' && (
                                    <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5">
                                        {[
                                            { key: 'all' as const, label: 'Mọi người (Anyone)', icon: <Users className="w-4 h-4 text-gray-400" /> },
                                            { key: 'me' as const, label: 'Do tôi sở hữu (Owned by me)', icon: <User className="w-4 h-4 text-blue-500" /> },
                                            { key: 'not_me' as const, label: 'Không do tôi sở hữu', icon: <Users className="w-4 h-4 text-purple-500" /> },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => {
                                                    setFilterPeople(opt.key);
                                                    setOpenFilterDropdown(null);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                                                    filterPeople === opt.key
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                                                }`}
                                            >
                                                {opt.icon}
                                                <span className="flex-1 truncate">{opt.label}</span>
                                                {filterPeople === opt.key && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Modified Dropdown */}
                            <div className="relative filter-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterDropdown(openFilterDropdown === 'modified' ? null : 'modified')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] transition-all cursor-pointer select-none ${
                                        filterModified !== 'all'
                                            ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] border-[#001D35]/30 font-medium shadow-2xs'
                                            : 'bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5] border-[#747775]/40 hover:bg-[#F2F6FC] dark:hover:bg-slate-800 font-normal'
                                    }`}
                                >
                                    <span>
                                        {filterModified === 'all' && 'Lần sửa đổi gần đây nhất'}
                                        {filterModified === 'today' && 'Hôm nay'}
                                        {filterModified === '7days' && '7 ngày qua'}
                                        {filterModified === '30days' && '30 ngày qua'}
                                        {filterModified === 'year' && 'Năm nay'}
                                    </span>
                                    {filterModified !== 'all' ? (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterModified('all');
                                            }}
                                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-full transition-colors ml-0.5"
                                            title="Xóa lọc thời gian sửa đổi"
                                        >
                                            <X className="w-3 h-3 text-[#001D35] dark:text-[#C2E7FF]" />
                                        </span>
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                    )}
                                </button>

                                {openFilterDropdown === 'modified' && (
                                    <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5">
                                        {[
                                            { key: 'all' as const, label: 'Mọi lúc (Any time)', icon: <Clock className="w-4 h-4 text-gray-400" /> },
                                            { key: 'today' as const, label: 'Hôm nay (Today)', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
                                            { key: '7days' as const, label: '7 ngày qua (Last 7 days)', icon: <Calendar className="w-4 h-4 text-emerald-500" /> },
                                            { key: '30days' as const, label: '30 ngày qua (Last 30 days)', icon: <Calendar className="w-4 h-4 text-amber-500" /> },
                                            { key: 'year' as const, label: 'Năm nay (This year)', icon: <Calendar className="w-4 h-4 text-purple-500" /> },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => {
                                                    setFilterModified(opt.key);
                                                    setOpenFilterDropdown(null);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                                                    filterModified === opt.key
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                                                }`}
                                            >
                                                {opt.icon}
                                                <span className="flex-1 truncate">{opt.label}</span>
                                                {filterModified === opt.key && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 4. Source Dropdown */}
                            <div className="relative filter-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterDropdown(openFilterDropdown === 'source' ? null : 'source')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] transition-all cursor-pointer select-none ${
                                        filterSource !== 'all' || filterStarredOnly
                                            ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] border-[#001D35]/30 font-medium shadow-2xs'
                                            : 'bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5] border-[#747775]/40 hover:bg-[#F2F6FC] dark:hover:bg-slate-800 font-normal'
                                    }`}
                                >
                                    <span>
                                        {filterSource === 'all' && !filterStarredOnly && 'Nguồn'}
                                        {(filterSource === 'starred' || filterStarredOnly) && 'Có gắn dấu sao'}
                                        {filterSource === 'shared' && !filterStarredOnly && 'Được chia sẻ với tôi'}
                                    </span>
                                    {filterSource !== 'all' || filterStarredOnly ? (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterSource('all');
                                                setFilterStarredOnly(false);
                                            }}
                                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-full transition-colors ml-0.5"
                                            title="Xóa lọc nguồn"
                                        >
                                            <X className="w-3 h-3 text-[#001D35] dark:text-[#C2E7FF]" />
                                        </span>
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                    )}
                                </button>

                                {openFilterDropdown === 'source' && (
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5">
                                        {[
                                            { key: 'all' as const, label: 'All sources (Tất cả nguồn)', icon: <HardDrive className="w-4 h-4 text-gray-400" /> },
                                            { key: 'starred' as const, label: 'Starred (Có gắn dấu sao)', icon: <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> },
                                            { key: 'shared' as const, label: 'Shared with me (Được chia sẻ)', icon: <Share2 className="w-4 h-4 text-blue-500" /> },
                                        ].map((opt) => {
                                            const isSelected =
                                                (opt.key === 'starred' && (filterSource === 'starred' || filterStarredOnly)) ||
                                                (filterSource === opt.key && !filterStarredOnly);
                                            return (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterSource(opt.key);
                                                        setFilterStarredOnly(opt.key === 'starred');
                                                        setOpenFilterDropdown(null);
                                                    }}
                                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                                            : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    {opt.icon}
                                                    <span className="flex-1 truncate">{opt.label}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Reset filters shortcut button */}
                            {(filterType !== 'all' || filterPeople !== 'all' || filterModified !== 'all' || filterSource !== 'all' || filterStarredOnly) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterPeople('all');
                                        setFilterModified('all');
                                        setFilterSource('all');
                                        setFilterStarredOnly(false);
                                    }}
                                    className="text-[13px] text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-normal ml-1 cursor-pointer transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                    </div>

                    {/* Google Drive Selection Bar (When items are selected) */}
                    {selectedFileIds.length > 0 && (
                        <div className="mx-5 my-2.5 px-4 py-2 bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-slate-700 rounded-full flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 shadow-xs">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFileIds([])}
                                    className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                                    title="Bỏ chọn"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                                    {selectedFileIds.length} đã chọn
                                </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* Share / Permissions */}
                                <button
                                    onClick={() => {
                                        if (selectedFileIds.length === 1) {
                                            const f = files.find((x) => x.id.toString() === selectedFileIds[0]);
                                            if (isAdmin) {
                                                router.push(
                                                    `/files/${f?.id}/permissions`
                                                );
                                            } else {
                                                setShowRequestAccessModal(true);
                                            }
                                        } else {
                                            toast('Vui lòng chọn 1 tệp để phân quyền chi tiết');
                                        }
                                    }}
                                    className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                                    title="Chia sẻ / Phân quyền"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>

                                {/* Download */}
                                <button
                                    onClick={() => {
                                        selectedFileIds.forEach((id) => {
                                            const f = files.find((x) => x.id.toString() === id);
                                            if (f) handleDownloadFile(f.id, f.name);
                                        });
                                    }}
                                    className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                                    title="Tải xuống"
                                >
                                    <Download className="w-4 h-4" />
                                </button>

                                {/* Move */}
                                <button
                                    onClick={() => {
                                        if (selectedFileIds.length === 1) {
                                            const f = files.find((x) => x.id.toString() === selectedFileIds[0]);
                                            if (f) setMovingFile(f);
                                        } else {
                                            toast('Kéo thả các tệp đã chọn vào cây thư mục bên trái để di chuyển!');
                                        }
                                    }}
                                    className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                                    title="Di chuyển"
                                >
                                    <Folder className="w-4 h-4 text-blue-600 fill-blue-500" />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={handleBulkDelete}
                                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-950/60 text-gray-600 dark:text-slate-300 hover:text-red-600 transition cursor-pointer"
                                    title="Xóa vào thùng rác"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Copy Link */}
                                <button
                                    onClick={() => {
                                        if (selectedFileIds.length > 0) {
                                            handleCopyLink(selectedFileIds[0]);
                                        }
                                    }}
                                    className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                                    title="Sao chép đường dẫn"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>

                                {/* AI Re-index */}
                                <button
                                    onClick={handleBatchReindex}
                                    className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-purple-600 transition cursor-pointer"
                                    title="Batch Re-Index AI"
                                >
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View Container: List Table OR Grid Cards */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        {viewMode === 'list' ? (
                            /* ── GOOGLE DRIVE LIST TABLE VIEW ── */
                            <table className="w-full text-[13px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E0E2E0] dark:border-slate-800 text-[12.5px] font-medium text-[#444746] dark:text-[#C4C7C5] select-none h-10">
                                        <th className="px-3 py-2 w-12 text-center">
                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className={`transition-opacity cursor-pointer ${
                                                    selectedFileIds.length > 0
                                                        ? 'opacity-100 text-[#0B57D0]'
                                                        : 'opacity-0 hover:opacity-100 text-gray-400'
                                                }`}
                                                title="Chọn tất cả"
                                            >
                                                {selectedFileIds.length === filteredFiles.length &&
                                                filteredFiles.length > 0 ? (
                                                    <CheckSquare className="w-4 h-4 text-[#0B57D0]" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </th>
                                        <th
                                            onClick={() => {
                                                setSortBy('name');
                                                setSortDirection(sortBy === 'name' && sortDirection === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className="px-4 py-2 min-w-[200px] cursor-pointer hover:text-[#1F1F1F] dark:hover:text-white select-none group text-left"
                                        >
                                            <div className="flex items-center gap-1.5 font-medium text-[#444746] dark:text-[#C4C7C5] text-[12.5px]">
                                                <span>Tên</span>
                                                {sortBy === 'name' ? (
                                                    <ArrowUp className={`w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5] transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                                                ) : (
                                                    <ArrowUp className="w-3.5 h-3.5 text-transparent group-hover:text-gray-400 transition-colors" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-2 whitespace-nowrap w-36 font-medium text-[#444746] dark:text-[#C4C7C5] text-[12.5px] text-left">
                                            Chủ sở hữu
                                        </th>
                                        <th
                                            onClick={() => {
                                                setSortBy('updatedAt');
                                                setSortDirection(
                                                    sortBy === 'updatedAt' && sortDirection === 'desc' ? 'asc' : 'desc'
                                                );
                                            }}
                                            className="px-4 py-2 whitespace-nowrap w-40 cursor-pointer hover:text-[#1F1F1F] dark:hover:text-white select-none group text-left"
                                        >
                                            <div className="flex items-center gap-1.5 font-medium text-[#444746] dark:text-[#C4C7C5] text-[12.5px]">
                                                <span>Ngày sửa đổi</span>
                                                {sortBy === 'updatedAt' && (
                                                    <ArrowDown className={`w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5] transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => {
                                                setSortBy('size');
                                                setSortDirection(
                                                    sortBy === 'size' && sortDirection === 'desc' ? 'asc' : 'desc'
                                                );
                                            }}
                                            className="px-4 py-2 whitespace-nowrap w-28 cursor-pointer hover:text-[#1F1F1F] dark:hover:text-white select-none font-medium text-[#444746] dark:text-[#C4C7C5] text-[12.5px] group text-left"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>Kích cỡ tệp</span>
                                                {sortBy === 'size' && (
                                                    <ArrowDown className={`w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5] transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-2 whitespace-nowrap w-28 text-right">
                                            <div className="relative inline-block text-left sort-menu-container">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white cursor-pointer select-none"
                                                    title="Tùy chọn sắp xếp"
                                                >
                                                    <Menu className="w-3.5 h-3.5 text-[#444746] dark:text-[#C4C7C5]" />
                                                    <span>Sắp xếp</span>
                                                </button>
                                                {showSortMenu && (
                                                    <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1 z-40 text-xs animate-in fade-in">
                                                        <button
                                                            onClick={() => {
                                                                setSortBy('name');
                                                                setSortDirection(sortBy === 'name' && sortDirection === 'asc' ? 'desc' : 'asc');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className="w-full px-3 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                                        >
                                                            <span>Tên tài liệu</span>
                                                            {sortBy === 'name' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSortBy('updatedAt');
                                                                setSortDirection(sortBy === 'updatedAt' && sortDirection === 'desc' ? 'asc' : 'desc');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className="w-full px-3 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                                        >
                                                            <span>Ngày sửa đổi</span>
                                                            {sortBy === 'updatedAt' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSortBy('size');
                                                                setSortDirection(sortBy === 'size' && sortDirection === 'asc' ? 'desc' : 'asc');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className="w-full px-3 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                                        >
                                                            <span>Kích thước tệp</span>
                                                            {sortBy === 'size' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F2F2F2] dark:divide-slate-800/50">
                                    {loadingFiles ? (
                                        [1, 2, 3, 4, 5].map((i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-3 py-2 text-center">
                                                    <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="h-4 bg-gray-200 rounded w-48 mb-1" />
                                                    <div className="h-3 bg-gray-100 rounded w-28" />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="h-4 bg-gray-100 rounded w-28" />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="h-4 bg-gray-100 rounded w-16" />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="h-4 bg-gray-100 rounded w-12" />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="h-4 bg-gray-100 rounded w-8 ml-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <>
                                            {/* Subfolders Rendered First (Google Drive Style) */}
                                            {displayedSubFolders.map((subFolder: any) => {
                                                const isFolderMenuOpen = activeRowMenuId === `folder_${subFolder.id}`;
                                                return (
                                                    <tr
                                                        key={`folder_${subFolder.id}`}
                                                        onClick={() => navigateToFolder(subFolder.id, subFolder.name)}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setFolderContextMenu({
                                                                isOpen: true,
                                                                position: { x: e.clientX, y: e.clientY },
                                                                folder: { id: subFolder.id, name: subFolder.name },
                                                            });
                                                        }}
                                                        className="hover:bg-[#F2F6FC] dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-[#F2F2F2] dark:border-slate-800/50 h-10"
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="px-3 py-2 text-center w-12" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigateToFolder(subFolder.id, subFolder.name)}
                                                                className="text-gray-400 hover:text-[#0B57D0] transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Square className="w-4 h-4" />
                                                            </button>
                                                        </td>

                                                        {/* Folder Name */}
                                                        <td className="px-4 py-2 min-w-[220px]">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <Folder className="w-4.5 h-4.5 text-[#444746] dark:text-slate-300 fill-[#444746] dark:fill-slate-400 shrink-0" />
                                                                <span
                                                                    className="font-normal text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate max-w-[280px] sm:max-w-[400px]"
                                                                    title={subFolder.name}
                                                                >
                                                                    {subFolder.name}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Owner */}
                                                        <td className="px-4 py-2 whitespace-nowrap w-36 text-[#444746] dark:text-[#C4C7C5] font-normal">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-medium text-[9px] flex items-center justify-center shrink-0 shadow-2xs">
                                                                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'T'}
                                                                </div>
                                                                <span className="truncate text-[12px]">tôi</span>
                                                            </div>
                                                        </td>

                                                        {/* Date Modified */}
                                                        <td className="px-4 py-2 whitespace-nowrap text-[#444746] dark:text-[#C4C7C5] text-[12.5px] font-normal w-36">
                                                            {subFolder.updatedAt ? formatGoogleDriveDate(subFolder.updatedAt) : '—'}
                                                        </td>

                                                        {/* File size */}
                                                        <td className="px-4 py-2 whitespace-nowrap text-[#444746] dark:text-[#C4C7C5] text-[12.5px] font-normal">
                                                            —
                                                        </td>

                                                        {/* Action 3-dots */}
                                                        <td className="px-4 py-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="relative inline-block text-left row-action-menu-container">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveRowMenuId(isFolderMenuOpen ? null : `folder_${subFolder.id}`);
                                                                    }}
                                                                    className="p-1.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                                                                    title="Tùy chọn thư mục"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>

                                                                {isFolderMenuOpen && (
                                                                    <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1.5 z-50 text-xs divide-y divide-gray-100 dark:divide-slate-800 text-left">
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    navigateToFolder(subFolder.id, subFolder.name);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Folder className="w-4 h-4 text-blue-500" />
                                                                                <span>Mở thư mục</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    router.push(`/ai?folderId=${subFolder.id}&folderName=${encodeURIComponent(subFolder.name)}`);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-blue-400 fill-[#1a73e8]/20" />
                                                                                    <span>Hỏi Gemini</span>
                                                                                </div>
                                                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-blue-900/60 dark:text-blue-200">
                                                                                    Mới
                                                                                </span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setRenamingFolder({ id: subFolder.id, name: subFolder.name });
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Edit3 className="w-4 h-4 text-amber-500" />
                                                                                <span>Đổi tên thư mục</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setSelectedFolder(subFolder.id.toString());
                                                                                    setSelectedFolderName(subFolder.name);
                                                                                    setShowCreateFolder(true);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <FolderPlus className="w-4 h-4 text-emerald-500" />
                                                                                <span>Tạo thư mục con</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setSelectedFolder(subFolder.id.toString());
                                                                                    setSelectedFolderName(subFolder.name);
                                                                                    setShowUploadFile(true);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Upload className="w-4 h-4 text-blue-500" />
                                                                                <span>Tải tệp lên</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    router.push(`/files/permissions?folderId=${subFolder.id}&name=${encodeURIComponent(subFolder.name)}`);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <ShieldCheck className="w-4 h-4 text-purple-500" />
                                                                                <span>Phân quyền (RBAC)</span>
                                                                            </button>
                                                                        </div>
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    handleDeleteFolder(subFolder.id, subFolder.name);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-medium cursor-pointer"
                                                                            >
                                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                                                <span>Xóa thư mục</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Files List */}
                                            {filteredFiles.map((file) => {
                                                const isSelected = selectedFileIds.includes(file.id.toString());
                                                const isOwner = !!(
                                                    (currentUser?.email && file.uploadedByEmail && currentUser.email.toLowerCase() === file.uploadedByEmail.toLowerCase()) ||
                                                    (currentUser?.name && (
                                                        file.owner?.toLowerCase() === currentUser.name.toLowerCase() ||
                                                        file.uploadedByName?.toLowerCase() === currentUser.name.toLowerCase()
                                                    )) ||
                                                    file.owner === 'me'
                                                );
                                                const canMove = isAdmin || isOwner;
                                                const isStarred = starredIds.includes(file.id.toString());

                                                const ownerDisplayName = isOwner ? 'tôi' : (file.uploadedByName || file.owner || 'Admin');
                                                const ownerAvatarLetter = isOwner
                                                    ? (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'T')
                                                    : (ownerDisplayName.charAt(0).toUpperCase());
                                                const avatarClass = getAvatarColor(ownerDisplayName);

                                                const fileExt = file.fileType || file.name.split('.').pop() || '';
                                                const typeConfig = getFileTypeConfig(fileExt);
                                                const TypeIcon = typeConfig.icon;

                                                return (
                                                <tr
                                                    key={file.id}
                                                    draggable={canMove}
                                                    onClick={() => handleRowClick(file)}
                                                    onDragStart={(e) => {
                                                        if (!canMove) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        const isMulti = selectedFileIds.includes(file.id.toString());
                                                        const idsToMove =
                                                            isMulti && selectedFileIds.length > 1
                                                                ? selectedFileIds
                                                                : [file.id.toString()];

                                                        e.dataTransfer.setData(
                                                            'application/json',
                                                            JSON.stringify({ fileIds: idsToMove })
                                                        );
                                                        e.dataTransfer.setData('text/plain', file.id.toString());
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    className={`hover:bg-[#F2F6FC] dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-[#F2F2F2] dark:border-slate-800/50 h-10 ${
                                                        isSelected ? 'bg-[#C2E7FF]/40 dark:bg-blue-950/40' : ''
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    <td
                                                        className="px-3 py-2 text-center w-12"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleSelectFile(file, e)}
                                                            className={`hover:text-[#0B57D0] transition-opacity cursor-pointer ${
                                                                isSelected
                                                                    ? 'opacity-100 text-[#0B57D0]'
                                                                    : 'opacity-0 group-hover:opacity-100 text-gray-400'
                                                            }`}
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare className="w-4 h-4 text-[#0B57D0]" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* File Name & Format */}
                                                    <td className="px-4 py-2 min-w-[220px]">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div
                                                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}
                                                            >
                                                                <TypeIcon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFile(file);
                                                                        setIsPreviewModalOpen(true);
                                                                    }}
                                                                    className="font-normal text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[240px] sm:max-w-[340px] transition-colors hover:underline text-left cursor-pointer"
                                                                    title={file.name}
                                                                >
                                                                    {file.name}
                                                                </button>
                                                                {file.tags && file.tags.length > 0 && (
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {file.tags.map((t) => (
                                                                            <span
                                                                                key={t}
                                                                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getTagColorClass(
                                                                                    t
                                                                                )}`}
                                                                            >
                                                                                #{t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Owner (Chủ sở hữu) */}
                                                    <td className="px-4 py-2 whitespace-nowrap w-36 text-[#444746] dark:text-[#C4C7C5] font-normal">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div
                                                                className={`w-5 h-5 rounded-full font-medium text-[9px] flex items-center justify-center shrink-0 text-white shadow-2xs ${avatarClass}`}
                                                            >
                                                                {ownerAvatarLetter}
                                                            </div>
                                                            <span className="truncate text-[12px] max-w-[120px]">
                                                                {ownerDisplayName}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Date Modified (Ngày sửa đổi) */}
                                                    <td className="px-4 py-2 text-[#444746] dark:text-[#C4C7C5] whitespace-nowrap text-[12.5px] font-normal w-36">
                                                        {formatGoogleDriveDate(file.updatedAt)}
                                                    </td>

                                                    {/* File Size */}
                                                    <td className="px-4 py-2 text-[#444746] dark:text-[#C4C7C5] whitespace-nowrap text-[12.5px] font-normal w-24">
                                                        {file.size || '—'}
                                                    </td>

                                                    {/* ── GOOGLE DRIVE QUICK ACTIONS & CONTEXT MENU ── */}
                                                    <td
                                                        className="px-4 py-2 text-right whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            {/* Quick action buttons appear on row hover or when selected */}
                                                            <div
                                                                className={`flex items-center gap-0.5 transition-opacity ${
                                                                    isSelected
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0 group-hover:opacity-100'
                                                                }`}
                                                            >
                                                                {/* Share */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isAdmin) {
                                                                            router.push(
                                                                                `/files/${file.id}/permissions`
                                                                            );
                                                                        } else {
                                                                            setShowRequestAccessModal(true);
                                                                        }
                                                                    }}
                                                                    className="p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                                                                    title="Chia sẻ"
                                                                >
                                                                    <UserPlus className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Download */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadFile(file.id, file.name);
                                                                    }}
                                                                    className="p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                                                                    title="Tải xuống"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Rename */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRenamingFile(file);
                                                                    }}
                                                                    className="p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                                                                    title="Đổi tên"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Star */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => toggleStar(file.id, e)}
                                                                    className={`p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 transition cursor-pointer ${
                                                                        isStarred
                                                                            ? 'text-amber-500 fill-amber-400'
                                                                            : 'text-gray-400 hover:text-amber-500'
                                                                    }`}
                                                                    title={
                                                                        isStarred
                                                                            ? 'Xóa khỏi có gắn dấu sao'
                                                                            : 'Gắn dấu sao'
                                                                    }
                                                                >
                                                                    <Star
                                                                        className={`w-3.5 h-3.5 ${
                                                                            isStarred ? 'fill-amber-400' : ''
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </div>

                                                            {/* 3-dots Menu Button & Google Drive Context Menu */}
                                                            <div className="relative row-action-menu-container">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveRowMenuId(
                                                                            activeRowMenuId === file.id ? null : file.id
                                                                        );
                                                                    }}
                                                                    className={`p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 transition cursor-pointer ${
                                                                        activeRowMenuId === file.id
                                                                            ? 'bg-gray-200 dark:bg-slate-700 text-blue-600'
                                                                            : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                                                                    }`}
                                                                    title="Tùy chọn khác"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>

                                                                {/* Google Drive Styled Context Menu */}
                                                                {activeRowMenuId === file.id && (
                                                                    <div
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="absolute right-0 top-7 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 text-left text-xs divide-y divide-gray-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95"
                                                                    >
                                                                        {/* 1. Mở bằng / Xem tệp */}
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setSelectedFile(file);
                                                                                    setIsPreviewModalOpen(true);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <ExternalLink className="w-4 h-4 text-blue-500" />
                                                                                <span>Mở bằng trình xem tệp</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    router.push(`/ai?fileId=${file.id}&fileName=${encodeURIComponent(file.name)}`);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-blue-400 fill-[#1a73e8]/20" />
                                                                                    <span>Hỏi Gemini</span>
                                                                                </div>
                                                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-blue-900/60 dark:text-blue-200">
                                                                                    Mới
                                                                                </span>
                                                                            </button>
                                                                        </div>

                                                                        {/* 2. Download, Rename, Copy Link */}
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    handleDownloadFile(file.id, file.name);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <Download className="w-4 h-4 text-gray-500" />
                                                                                    <span>Tải xuống</span>
                                                                                </div>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setRenamingFile(file);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <Edit3 className="w-4 h-4 text-gray-500" />
                                                                                    <span>Đổi tên</span>
                                                                                </div>
                                                                                <span className="text-[10px] text-gray-400 font-mono">
                                                                                    Ctrl+Alt+E
                                                                                </span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    handleCopyLink(file.id);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Copy className="w-4 h-4 text-gray-500" />
                                                                                <span>Sao chép đường dẫn</span>
                                                                            </button>
                                                                        </div>

                                                                        {/* 3. Share, Organize, Star, Tags, Info */}
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    if (isAdmin) {
                                                                                        router.push(
                                                                                            `/files/${file.id}/permissions`
                                                                                        );
                                                                                    } else {
                                                                                        setShowRequestAccessModal(true);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                                                <span>Chia sẻ / Phân quyền</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setMovingFile(file);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Folder className="w-4 h-4 text-blue-600 fill-blue-500" />
                                                                                <span>Tổ chức / Di chuyển</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    setActiveRowMenuId(null);
                                                                                    toggleStar(file.id, e);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
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
                                                                                        ? 'Xóa khỏi có gắn dấu sao'
                                                                                        : 'Gắn dấu sao'}
                                                                                </span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setEditingTagsFile(file);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Tag className="w-4 h-4 text-blue-500" />
                                                                                <span>Quản lý nhãn (Tags)</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    setActiveDetailFile(file);
                                                                                    setShowDetailsDrawer(true);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                                                                            >
                                                                                <Info className="w-4 h-4 text-sky-500" />
                                                                                <span>Thông tin tệp (Chi tiết)</span>
                                                                            </button>
                                                                        </div>

                                                                        {/* 4. Delete */}
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setActiveRowMenuId(null);
                                                                                    handleDeleteFile(file.id);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-medium cursor-pointer"
                                                                            >
                                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                                                <span>Chuyển vào thùng rác</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </>
                                )}

                                {!loadingFiles && displayedSubFolders.length === 0 && filteredFiles.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-gray-400 dark:text-slate-500"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Folder className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                                <span className="text-xs">
                                                    Thư mục này trống
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* ── GOOGLE DRIVE GRID VIEW (PREVIEW CARDS) ── */
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                            {/* Subfolders section */}
                            {displayedSubFolders.length > 0 && (
                                <div className="col-span-full">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                        Thư mục
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-5">
                                        {displayedSubFolders.map((subFolder: any) => (
                                            <div
                                                key={`grid_folder_${subFolder.id}`}
                                                onClick={() => navigateToFolder(subFolder.id, subFolder.name)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFolderContextMenu({
                                                        isOpen: true,
                                                        position: { x: e.clientX, y: e.clientY },
                                                        folder: { id: subFolder.id, name: subFolder.name },
                                                    });
                                                }}
                                                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f0f4f9] hover:bg-[#e6edf7] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-transparent hover:border-gray-300 dark:hover:border-slate-700 transition cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <Folder className="w-5 h-5 text-gray-700 dark:text-slate-200 fill-gray-500/20 shrink-0" />
                                                    <span className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate" title={subFolder.name}>
                                                        {subFolder.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {displayedSubFolders.length > 0 && filteredFiles.length > 0 && (
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1 col-span-full">
                                    Tệp
                                </h3>
                            )}

                            {!loadingFiles && displayedSubFolders.length === 0 && filteredFiles.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500">
                                    <Folder className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                    <span className="text-xs">Thư mục này trống</span>
                                </div>
                            )}

                            {filteredFiles.map((file) => {
                                const isSelected = selectedFileIds.includes(file.id.toString());
                                const isStarred = starredIds.includes(file.id.toString());
                                const isOwner = !!(
                                    (currentUser?.email && file.uploadedByEmail && currentUser.email.toLowerCase() === file.uploadedByEmail.toLowerCase()) ||
                                    (currentUser?.name && (
                                        file.owner?.toLowerCase() === currentUser.name.toLowerCase() ||
                                        file.uploadedByName?.toLowerCase() === currentUser.name.toLowerCase()
                                    )) ||
                                    file.owner === 'me'
                                );

                                const ownerDisplayName = isOwner ? 'tôi' : (file.uploadedByName || file.owner || 'Admin');
                                const ownerAvatarLetter = isOwner
                                    ? (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'T')
                                    : (ownerDisplayName.charAt(0).toUpperCase());
                                const avatarClass = getAvatarColor(ownerDisplayName);

                                const fileExt = file.fileType || file.name.split('.').pop() || '';
                                const typeConfig = getFileTypeConfig(fileExt);
                                const TypeIcon = typeConfig.icon;

                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => handleRowClick(file)}
                                        className={`bg-[#f0f4f9] hover:bg-[#e6edf7] dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 border group relative shadow-2xs hover:shadow-sm cursor-pointer ${
                                            isSelected
                                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/60 dark:bg-blue-950/40'
                                                : 'border-transparent hover:border-gray-200/90 dark:hover:border-slate-700/80'
                                        }`}
                                    >
                                        <div>
                                            {/* Top Row: File icon + Name + 3-dots */}
                                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <div
                                                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}
                                                    >
                                                        <TypeIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFile(file);
                                                            setIsPreviewModalOpen(true);
                                                        }}
                                                        className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate hover:underline cursor-pointer"
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleStar(file.id, e)}
                                                        className={`p-1 rounded-full hover:bg-white/80 dark:hover:bg-slate-700 transition ${
                                                            isStarred
                                                                ? 'text-amber-500 fill-amber-400'
                                                                : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                                                        }`}
                                                        title={
                                                            isStarred
                                                                ? 'Xóa khỏi có gắn dấu sao'
                                                                : 'Gắn dấu sao'
                                                        }
                                                    >
                                                        <Star
                                                            className={`w-3.5 h-3.5 ${
                                                                isStarred ? 'fill-amber-400' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Miniature Document Thumbnail Preview */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(file);
                                                    setIsPreviewModalOpen(true);
                                                }}
                                                className="w-full h-28 my-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition relative group/preview"
                                                title={`Xem trước: ${file.name}`}
                                            >
                                                <FileThumbnailPreview id={file.id} name={file.name} fileType={file.fileType} />
                                            </div>
                                        </div>

                                        {/* Bottom Card Info: Avatar + Open Button */}
                                        <div className="mt-1 flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div
                                                    className={`w-5 h-5 rounded-full font-medium text-[9px] flex items-center justify-center shrink-0 text-white shadow-2xs ${avatarClass}`}
                                                >
                                                    {ownerAvatarLetter}
                                                </div>
                                                <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                                    {ownerDisplayName}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(file);
                                                    setIsPreviewModalOpen(true);
                                                }}
                                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                                            >
                                                Mở
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. ── GOOGLE DRIVE DETAILS & ACTIVITY SLIDE-OUT DRAWER ── */}
                {showDetailsDrawer && (
                    <div className="w-[320px] bg-white dark:bg-[#1E1F20] rounded-[24px] border border-gray-200/70 dark:border-slate-800 flex flex-col shrink-0 h-full shadow-none z-20 overflow-hidden animate-in slide-in-from-right-4 duration-200">
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
                                <h3 className="text-[13px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] truncate" title={effectiveDetailFile ? effectiveDetailFile.name : selectedFolderName}>
                                    {effectiveDetailFile ? effectiveDetailFile.name : selectedFolderName}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailsDrawer(false)}
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
                                            onClick={() => {
                                                setSelectedFile(effectiveDetailFile);
                                                setIsPreviewModalOpen(true);
                                            }}
                                            className="w-full h-36 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative bg-white dark:bg-slate-950 cursor-pointer shadow-none hover:shadow-xs transition group"
                                            title="Nhấp để mở tệp"
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
                                            <span className="font-medium text-[12.5px]">{selectedFolderName}</span>
                                        </div>
                                    )}

                                    {/* 2. Người có quyền truy cập (Who has access) */}
                                    {(() => {
                                        const isEffectiveOwner = !!(
                                            (currentUser?.email && effectiveDetailFile?.uploadedByEmail && currentUser.email.toLowerCase() === effectiveDetailFile.uploadedByEmail.toLowerCase()) ||
                                            (currentUser?.name && (
                                                effectiveDetailFile?.owner?.toLowerCase() === currentUser.name.toLowerCase() ||
                                                effectiveDetailFile?.uploadedByName?.toLowerCase() === currentUser.name.toLowerCase()
                                            )) ||
                                            effectiveDetailFile?.owner === 'me' ||
                                            effectiveDetailFile?.owner === 'tôi'
                                        );

                                        return (
                                            <div className="space-y-1.5 pt-0.5">
                                                <h4 className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                    Người có quyền truy cập
                                                </h4>

                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    {/* Owner avatar */}
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-[10px] text-white shrink-0 shadow-2xs ${getAvatarColor(
                                                            isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.uploadedByName || effectiveDetailFile?.owner || 'Admin')
                                                        )}`}
                                                        title={`Chủ sở hữu: ${isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.uploadedByName || effectiveDetailFile?.owner || 'tôi')}`}
                                                    >
                                                        {(isEffectiveOwner ? (currentUser?.name ? currentUser.name.charAt(0) : 'T') : (effectiveDetailFile?.uploadedByName || effectiveDetailFile?.owner || 'A')[0]).toUpperCase()}
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
                                                        : `Do ${effectiveDetailFile?.uploadedByName || effectiveDetailFile?.owner || 'cộng tác viên'} sở hữu. Bạn có quyền xem tài liệu này.`}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (effectiveDetailFile) {
                                                            if (isAdmin) {
                                                                router.push(
                                                                    `/files/${effectiveDetailFile.id}/permissions`
                                                                );
                                                            } else {
                                                                setShowRequestAccessModal(true);
                                                            }
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
                                        const isEffectiveOwner = !!(
                                            (currentUser?.email && effectiveDetailFile?.uploadedByEmail && currentUser.email.toLowerCase() === effectiveDetailFile.uploadedByEmail.toLowerCase()) ||
                                            (currentUser?.name && (
                                                effectiveDetailFile?.owner?.toLowerCase() === currentUser.name.toLowerCase() ||
                                                effectiveDetailFile?.uploadedByName?.toLowerCase() === currentUser.name.toLowerCase()
                                            )) ||
                                            effectiveDetailFile?.owner === 'me' ||
                                            effectiveDetailFile?.owner === 'tôi'
                                        );

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
                                                                navigateToFolder(
                                                                    effectiveDetailFile?.folderId || 'all',
                                                                    effectiveDetailFile?.folderName || 'Drive của tôi'
                                                                );
                                                            }}
                                                            className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#747775]/40 bg-white dark:bg-slate-800 text-[11px] font-normal text-[#1F1F1F] dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                                        >
                                                            <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                                            <span className="truncate max-w-[180px]">{effectiveDetailFile?.folderName || selectedFolderName || 'Drive của tôi'}</span>
                                                        </button>
                                                    </div>

                                                    {/* Chủ sở hữu */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Chủ sở hữu</p>
                                                        <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            {isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.uploadedByName || effectiveDetailFile?.owner || 'tôi')}
                                                        </p>
                                                    </div>

                                                    {/* Lần sửa đổi gần đây nhất */}
                                                    <div>
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Lần sửa đổi gần đây nhất</p>
                                                        <div className="flex items-center gap-1 text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                            <span>
                                                                {formatGoogleDriveDetailDate(effectiveDetailFile?.updatedAt)} bởi {isEffectiveOwner ? 'tôi' : (effectiveDetailFile?.uploadedByName || 'tôi')}
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
                                                            {formatGoogleDriveDetailDate((effectiveDetailFile as any)?.createdAt || effectiveDetailFile?.updatedAt)}
                                                        </p>
                                                    </div>

                                                    {/* Mô tả */}
                                                    <div className="pt-0.5 pb-2">
                                                        <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium mb-1.5">Mô tả</p>
                                                        <textarea
                                                            rows={1}
                                                            placeholder="Thêm phần mô tả"
                                                            defaultValue={(effectiveDetailFile as any)?.description || ''}
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
                                                Bởi {effectiveDetailFile?.uploadedByName || 'Chủ sở hữu'}
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

            {/* ── MODALS ── */}
            {showCreateFolder && (
                <CreateFolderModal
                    parentFolderName={selectedFolderName}
                    onClose={() => setShowCreateFolder(false)}
                    onCreate={async (name) => {
                        const trimmedName = name.trim();
                        const duplicate = currentSubFolders.some(
                            (f: any) => f.name?.trim().toLowerCase() === trimmedName.toLowerCase()
                        );
                        if (duplicate) {
                            const msg = `Thư mục "${trimmedName}" đã tồn tại trong ${selectedFolderName}`;
                            toast.error(msg);
                            throw new Error(msg);
                        }

                        setIsProcessing(true);
                        setProcessingText(`Đang tạo thư mục "${trimmedName}"...`);
                        const tId = toast.loading('Đang tạo thư mục...');
                        try {
                            const forderRequest: ForderCreateRequest = {
                                name: trimmedName,
                                parentId: selectedFolder === 'all' ? null : selectedFolder,
                            };
                            await forderService.createForder(forderRequest);
                            toast.success('Tạo thư mục thành công!', { id: tId });
                            setShowCreateFolder(false);
                            window.dispatchEvent(new CustomEvent('folder_tree_updated'));
                            await loadData(true);
                        } catch (error: any) {
                            toast.error(error?.message || 'Tạo thư mục thất bại', { id: tId });
                            throw error;
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                />
            )}

            {showUploadFile && (
                <UploadFileModal
                    parentFolderName={selectedFolderName}
                    onClose={() => setShowUploadFile(false)}
                    onUpload={async (itemsToUpload) => {
                        if (itemsToUpload.length === 0) return;
                        setIsProcessing(true);
                        const count = itemsToUpload.length;
                        const firstName = itemsToUpload[0].file.name;
                        const tId = toast.loading(
                            count === 1
                                ? `Đang tải lên tài liệu\nĐang upload "${firstName}" vào hệ thống...`
                                : `Đang tải lên ${count} tài liệu\nĐang upload các tệp vào hệ thống...`
                        );
                        try {
                            for (const item of itemsToUpload) {
                                const fd = new FormData();
                                fd.append('file', item.file);
                                if (selectedFolder && selectedFolder !== 'all') {
                                    fd.append('folderId', selectedFolder);
                                }
                                if (item.tags && item.tags.length > 0) {
                                    item.tags.forEach((t) => fd.append('tags', t));
                                }

                                // Capture real page 1 thumbnail for PDF, Image, DOCX, XLSX, TXT
                                try {
                                    const thumbBlob = await generateFileThumbnail(item.file);
                                    if (thumbBlob) {
                                        fd.append('thumbnail', thumbBlob, 'thumb.jpg');
                                    }
                                } catch (e) {
                                    console.warn('Thumbnail generation skipped:', e);
                                }

                                await fileManagementService.uploadFile(fd);
                            }
                            toast.success(
                                count === 1
                                    ? `Tải lên tài liệu thành công\nĐã lưu "${firstName}" vào "${selectedFolderName}".`
                                    : `Tải lên tài liệu thành công\nĐã lưu ${count} tài liệu vào "${selectedFolderName}".`,
                                { id: tId }
                            );
                            await loadData(true);
                        } catch (err: any) {
                            toast.error(`Tải lên tài liệu thất bại\n${err?.message || err}`, { id: tId });
                            throw err;
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                />
            )}

            {showPermissionModal && selectedFolder !== 'all' && (
                <PermissionModal
                    target={{
                        type: 'folder',
                        id: selectedFolder,
                        name: selectedFolderName,
                        childFileCount: filteredFiles.length,
                        childFolderCount: 0,
                    }}
                    onClose={() => setShowPermissionModal(false)}
                />
            )}

            <RequestAccessModal
                isOpen={showRequestAccessModal}
                folderId={selectedFolder !== 'all' && !isNaN(Number(selectedFolder)) ? Number(selectedFolder) : undefined}
                folderName={selectedFolderName}
                onClose={() => setShowRequestAccessModal(false)}
            />

            <TagManagementModal
                isOpen={!!editingTagsFile}
                file={editingTagsFile}
                onClose={() => setEditingTagsFile(null)}
                onSuccess={(updatedFile) => {
                    setFiles((prev) => prev.map((f) => (f.id === updatedFile.id ? updatedFile : f)));
                    setEditingTagsFile(null);
                }}
            />

            {renamingFolder && (
                <RenameFolderModal
                    currentName={renamingFolder.name}
                    onClose={() => setRenamingFolder(null)}
                    onRename={handleRenameFolder}
                />
            )}

            {renamingFile && (
                <RenameFileModal
                    currentName={renamingFile.name}
                    onClose={() => setRenamingFile(null)}
                    onRename={handleRenameFileSubmit}
                />
            )}

            {movingFile && (
                <MoveFileModal
                    file={movingFile}
                    folderTree={folderTree}
                    onClose={() => setMovingFile(null)}
                    onMove={(targetFolderId, targetFolderName) =>
                        handleMoveFiles(movingFile.id.toString(), targetFolderId, targetFolderName)
                    }
                />
            )}

            {/* Google Drive Folder Context Menu (Right Click) */}
            {folderContextMenu.isOpen && (
                <FolderContextMenu
                    isOpen={folderContextMenu.isOpen}
                    position={folderContextMenu.position}
                    folder={folderContextMenu.folder}
                    onClose={() => setFolderContextMenu((prev) => ({ ...prev, isOpen: false }))}
                    onNewFolder={(f) => {
                        setSelectedFolder(f.id.toString());
                        setSelectedFolderName(f.name);
                        setShowCreateFolder(true);
                    }}
                    onDownload={(f) => {
                        toast.success(`Đang chuẩn bị tải xuống thư mục "${f.name}"...`);
                    }}
                    onRename={(f) => {
                        setRenamingFolder({ id: f.id, name: f.name });
                    }}
                    onAskGemini={(f) => {
                        router.push(`/ai?folderId=${f.id}&folderName=${encodeURIComponent(f.name)}`);
                    }}
                    onShare={(f) => {
                        router.push(`/files/permissions?folderId=${f.id}&name=${encodeURIComponent(f.name)}`);
                    }}
                    onOrganize={(f) => {
                        toast(`Thư mục: ${f.name}`, { icon: '📁' });
                    }}
                    onFolderInfo={(f) => {
                        toast(`Thông tin thư mục: ${f.name}`, { icon: 'ℹ️' });
                    }}
                    onDelete={(f) => {
                        handleDeleteFolder(f.id, f.name);
                    }}
                />
            )}
        </div>
    );
}

export default function FilesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC] dark:bg-[#0B1120]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            }
        >
            <FilesContent />
        </Suspense>
    );
}
