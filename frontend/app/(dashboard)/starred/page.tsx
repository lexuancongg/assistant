'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Check,
    List,
    LayoutGrid,
    Info,
    Star,
    Sparkles,
    Folder,
    Download,
    Edit3,
    MoreVertical,
    Trash2,
    ExternalLink,
    Share2,
    X,
    ChevronDown,
    ArrowUp,
    ArrowDown,
    Users,
    SlidersHorizontal,
    FileSpreadsheet,
    FileText,
    FileCode,
    FileBox,
    Presentation,
    Video,
    Archive,
    Image as ImageIcon,
    Headphones,
    FolderOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';

// File Type visual configuration matching Google Drive
function getFileTypeConfig(extOrType: string) {
    const ext = (extOrType || '').toLowerCase();

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-emerald-700 dark:text-emerald-400',
            bgColor: 'bg-emerald-100/90 dark:bg-emerald-950/60',
            category: 'Sheets',
        };
    }
    if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-blue-700 dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Docs',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-amber-700 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Slides',
        };
    }
    if (ext === 'pdf') {
        return {
            icon: FileText,
            color: 'text-red-700 dark:text-red-400',
            bgColor: 'bg-red-100/90 dark:bg-red-950/60',
            category: 'PDF',
        };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
        return {
            icon: ImageIcon,
            color: 'text-rose-700 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'Images',
        };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return {
            icon: Video,
            color: 'text-purple-700 dark:text-purple-400',
            bgColor: 'bg-purple-100/90 dark:bg-purple-950/60',
            category: 'Videos',
        };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return {
            icon: Archive,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Archives',
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
        'bg-[#0b57d0] text-white',
        'bg-indigo-600 text-white',
        'bg-purple-600 text-white',
        'bg-rose-600 text-white',
        'bg-amber-600 text-white',
        'bg-emerald-600 text-white',
        'bg-teal-600 text-white',
        'bg-slate-700 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Format date in Google Drive style (Vietnamese)
function formatGoogleDriveDate(dateStr?: string): string {
    if (!dateStr) return '5 thg 5';

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

    if (isNaN(date.getTime())) return '5 thg 5';

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

// Format file size
function formatFileSize(sizeInput?: string | number): string {
    if (!sizeInput || sizeInput === 0 || sizeInput === '0') return '0 B';
    if (typeof sizeInput === 'string') {
        if (sizeInput.includes('B') || sizeInput.includes('KB') || sizeInput.includes('MB') || sizeInput.includes('GB')) {
            return sizeInput;
        }
        const parsed = parseFloat(sizeInput);
        if (isNaN(parsed)) return sizeInput;
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(parsed) / Math.log(k));
        return `${parseFloat((parsed / Math.pow(k, i)).toFixed(0))} ${sizes[i] || 'B'}`;
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInput) / Math.log(k));
    return `${parseFloat((sizeInput / Math.pow(k, i)).toFixed(0))} ${sizes[i] || 'B'}`;
}

export default function StarredPage() {
    usePageBreadcrumb(['Có gắn dấu sao']);
    const router = useRouter();

    // Current user context
    const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; email?: string }>({});

    // Starred IDs & Files state
    const [starredIds, setStarredIds] = useState<string[]>([]);
    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [loading, setLoading] = useState(true);

    // View & Display state
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    // Filter pills
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPeople, setFilterPeople] = useState<string>('all');
    const [filterModified, setFilterModified] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');

    // Popover dropdown toggles
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    // Sort states matching Google Drive (media_1791093681168.png)
    const [sortBy, setSortBy] = useState<'name' | 'modified' | 'myModified' | 'opened'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [folderPosition, setFolderPosition] = useState<'top' | 'mixed'>('top');

    // Context menu
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItemDto } | null>(null);

    // Load current user
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                try {
                    const parsed = JSON.parse(rawUser);
                    setCurrentUser(parsed);
                } catch {}
            }
            const authUsername = localStorage.getItem('authUsername');
            if (authUsername) {
                setCurrentUser((prev) => ({ ...prev, email: authUsername }));
            }

            const savedView = localStorage.getItem('starred_view_mode') as 'list' | 'grid' | null;
            if (savedView) setViewMode(savedView);
        }
    }, []);

    const handleChangeViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        try {
            localStorage.setItem('starred_view_mode', mode);
        } catch {}
    };

    // Load starred IDs & all files
    const loadData = async () => {
        setLoading(true);
        try {
            // Load starred IDs from localStorage & DB
            let currentStarred: string[] = [];
            const localStored = localStorage.getItem('starred_file_ids');
            if (localStored) {
                try {
                    currentStarred = JSON.parse(localStored);
                } catch {}
            }

            const [dbStarred, allFiles] = await Promise.all([
                fileManagementService.getStarredFileIds().catch(() => []),
                fileManagementService.getActiveFiles().catch(() => []),
            ]);

            const mergedStarred = Array.from(new Set([...currentStarred, ...dbStarred.map(String)]));
            setStarredIds(mergedStarred);
            setFiles(allFiles);
        } catch (err) {
            console.error('Failed to load starred files:', err);
            toast.error('Không thể tải danh sách tệp có gắn dấu sao');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Toggle star action
    const handleToggleStar = async (fileId: string | number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const idStr = fileId.toString();

        setStarredIds((prev) => {
            const next = prev.filter((x) => x !== idStr);
            try {
                localStorage.setItem('starred_file_ids', JSON.stringify(next));
            } catch {}
            return next;
        });

        toast.success('Đã bỏ đánh dấu sao');

        try {
            await fileManagementService.toggleStar(fileId);
        } catch (err) {
            console.warn('Backend toggleStar failed:', err);
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setShowSortMenu(false);
            }
            if (!(e.target as HTMLElement).closest('.filter-pill-container')) {
                setOpenFilterDropdown(null);
            }
            setContextMenu(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Helper to check if owner is me
    const isMe = (ownerName?: string | null) => {
        if (!ownerName) return true;
        const raw = ownerName.trim().toLowerCase();
        if (raw === 'tôi' || raw === 'me' || raw === 'bạn') return true;
        const curEmail = (currentUser.email || '').trim().toLowerCase();
        const curName = (currentUser.name || '').trim().toLowerCase();
        if (curEmail && (raw === curEmail || raw.includes(curEmail) || curEmail.startsWith(raw))) return true;
        if (curName && (raw === curName || raw.includes(curName))) return true;
        if (raw.includes('lê xuân công') || raw.includes('admin')) return true;
        return false;
    };

    // Filter & Sort Starred Files
    const starredFiles = useMemo(() => {
        // 1. Only files with starred status
        let result = files.filter((f) => starredIds.includes(f.id.toString()));

        // 2. Filter by Type
        if (filterType !== 'all') {
            result = result.filter((f) => {
                const ext = (f.fileType || f.name.split('.').pop() || '').toLowerCase();
                if (filterType === 'docs' && ['docx', 'doc', 'txt', 'rtf'].includes(ext)) return true;
                if (filterType === 'sheets' && ['xlsx', 'xls', 'csv'].includes(ext)) return true;
                if (filterType === 'slides' && ['pptx', 'ppt'].includes(ext)) return true;
                if (filterType === 'pdf' && ext === 'pdf') return true;
                if (filterType === 'images' && ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return true;
                if (filterType === 'videos' && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return true;
                if (filterType === 'audio' && ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return true;
                if (filterType === 'archives' && ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return true;
                return false;
            });
        }

        // 3. Filter by People
        if (filterPeople !== 'all') {
            result = result.filter((f) => {
                const owner = (f as any).uploadedByName || (f as any).ownerName || 'tôi';
                const me = isMe(owner);
                if (filterPeople === 'me') return me;
                if (filterPeople === 'others') return !me;
                return true;
            });
        }

        // 4. Filter by Source
        if (filterSource !== 'all') {
            result = result.filter((f) => {
                const isShared = (f as any).isSharedWithMe || false;
                if (filterSource === 'drive') return !isShared;
                if (filterSource === 'shared') return isShared;
                return true;
            });
        }

        // 5. Sort
        result.sort((a, b) => {
            let comp = 0;
            if (sortBy === 'name') {
                comp = a.name.localeCompare(b.name, 'vi', { numeric: true });
            } else if (sortBy === 'modified' || sortBy === 'myModified' || sortBy === 'opened') {
                const timeA = new Date(a.updatedAt || 0).getTime();
                const timeB = new Date(b.updatedAt || 0).getTime();
                comp = timeA - timeB;
            }

            return sortDirection === 'asc' ? comp : -comp;
        });

        return result;
    }, [files, starredIds, filterType, filterPeople, filterSource, sortBy, sortDirection]);

    const handleFileClick = (fileId: number | string, e: React.MouseEvent) => {
        const idStr = fileId.toString();
        if (e.ctrlKey || e.metaKey) {
            setSelectedFileIds((prev) =>
                prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
            );
        } else {
            setSelectedFileIds([idStr]);
        }
    };

    const handleFileDoubleClick = (file: FileItemDto) => {
        router.push('/files');
    };

    const handleContextMenu = (file: FileItemDto, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFileIds([file.id.toString()]);
        setContextMenu({
            x: Math.min(e.clientX, window.innerWidth - 220),
            y: Math.min(e.clientY, window.innerHeight - 260),
            file,
        });
    };

    const selectedFile = useMemo(() => {
        if (selectedFileIds.length === 1) {
            return files.find((f) => f.id.toString() === selectedFileIds[0]);
        }
        return null;
    }, [selectedFileIds, files]);

    return (
        <div className="flex-1 h-full bg-white dark:bg-[#0B1120] text-gray-900 dark:text-slate-100 flex flex-col overflow-hidden">
            {/* 1. Header Section matching Google Drive */}
            <div className="px-6 pt-3 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-[22px] font-normal text-[#1f1f1f] dark:text-slate-100 tracking-normal select-none">
                        Có gắn dấu sao
                    </h1>

                    {/* View Switcher: List vs Grid - Pill shape matching Google Drive */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-full p-0.5 bg-white dark:bg-slate-900 shadow-2xs h-7">
                            <button
                                type="button"
                                onClick={() => handleChangeViewMode('list')}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] transition cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="Chế độ danh sách"
                            >
                                {viewMode === 'list' && <Check className="w-3 h-3 stroke-[2.5]" />}
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChangeViewMode('grid')}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] transition cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="Chế độ lưới"
                            >
                                {viewMode === 'grid' && <Check className="w-3 h-3 stroke-[2.5]" />}
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Info Button */}
                        <button
                            type="button"
                            onClick={() => setShowInfoPanel(!showInfoPanel)}
                            className={`p-1.5 rounded-full transition cursor-pointer ${
                                showInfoPanel
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800'
                            }`}
                            title="Chi tiết"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Filter Pills row matching Google Drive (Loại, Người, Lần sửa đổi gần đây nhất, Nguồn) */}
                <div className="flex items-center gap-2 mt-2 select-none overflow-x-auto pb-1 scrollbar-none">
                    {/* Filter: Loại */}
                    <div className="relative filter-pill-container">
                        <button
                            type="button"
                            onClick={() => setOpenFilterDropdown(openFilterDropdown === 'type' ? null : 'type')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                                filterType !== 'all'
                                    ? 'bg-[#c2e7ff] border-blue-400 text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50'
                            }`}
                        >
                            <span>
                                {filterType === 'all'
                                    ? 'Loại'
                                    : filterType === 'docs'
                                    ? 'Tài liệu'
                                    : filterType === 'sheets'
                                    ? 'Bảng tính'
                                    : filterType === 'slides'
                                    ? 'Bản trình bày'
                                    : filterType === 'pdf'
                                    ? 'PDF'
                                    : filterType === 'images'
                                    ? 'Hình ảnh'
                                    : filterType === 'videos'
                                    ? 'Video'
                                    : 'Tất cả'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                        {openFilterDropdown === 'type' && (
                            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
                                {[
                                    { key: 'all', label: 'Tất cả loại' },
                                    { key: 'docs', label: 'Tài liệu văn bản (Docs)' },
                                    { key: 'sheets', label: 'Bảng tính (Sheets)' },
                                    { key: 'slides', label: 'Bản trình bày (Slides)' },
                                    { key: 'pdf', label: 'Tệp PDF' },
                                    { key: 'images', label: 'Hình ảnh & Đồ họa' },
                                    { key: 'videos', label: 'Video' },
                                    { key: 'archives', label: 'Tệp nén (Zip/Rar)' },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                            setFilterType(opt.key);
                                            setOpenFilterDropdown(null);
                                        }}
                                        className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                            filterType === opt.key ? 'text-[#0b57d0] font-semibold bg-blue-50/50' : 'text-gray-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {filterType === opt.key && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter: Người */}
                    <div className="relative filter-pill-container">
                        <button
                            type="button"
                            onClick={() => setOpenFilterDropdown(openFilterDropdown === 'people' ? null : 'people')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                                filterPeople !== 'all'
                                    ? 'bg-[#c2e7ff] border-blue-400 text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50'
                            }`}
                        >
                            <span>{filterPeople === 'all' ? 'Người' : filterPeople === 'me' ? 'Do tôi sở hữu' : 'Người khác sở hữu'}</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                        {openFilterDropdown === 'people' && (
                            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
                                {[
                                    { key: 'all', label: 'Bất kỳ ai' },
                                    { key: 'me', label: 'Do tôi sở hữu' },
                                    { key: 'others', label: 'Không do tôi sở hữu' },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                            setFilterPeople(opt.key);
                                            setOpenFilterDropdown(null);
                                        }}
                                        className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                            filterPeople === opt.key ? 'text-[#0b57d0] font-semibold bg-blue-50/50' : 'text-gray-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {filterPeople === opt.key && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter: Lần sửa đổi gần đây nhất */}
                    <div className="relative filter-pill-container">
                        <button
                            type="button"
                            onClick={() => setOpenFilterDropdown(openFilterDropdown === 'modified' ? null : 'modified')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                                filterModified !== 'all'
                                    ? 'bg-[#c2e7ff] border-blue-400 text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50'
                            }`}
                        >
                            <span>Lần sửa đổi gần đây nhất</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                        {openFilterDropdown === 'modified' && (
                            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
                                {[
                                    { key: 'all', label: 'Mọi lúc' },
                                    { key: 'today', label: 'Hôm nay' },
                                    { key: '7days', label: '7 ngày qua' },
                                    { key: '30days', label: '30 ngày qua' },
                                    { key: 'thisyear', label: 'Năm nay (2026)' },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                            setFilterModified(opt.key);
                                            setOpenFilterDropdown(null);
                                        }}
                                        className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                            filterModified === opt.key ? 'text-[#0b57d0] font-semibold bg-blue-50/50' : 'text-gray-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {filterModified === opt.key && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter: Nguồn */}
                    <div className="relative filter-pill-container">
                        <button
                            type="button"
                            onClick={() => setOpenFilterDropdown(openFilterDropdown === 'source' ? null : 'source')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                                filterSource !== 'all'
                                    ? 'bg-[#c2e7ff] border-blue-400 text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50'
                            }`}
                        >
                            <span>{filterSource === 'all' ? 'Nguồn' : filterSource === 'drive' ? 'Drive của tôi' : 'Được chia sẻ'}</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                        {openFilterDropdown === 'source' && (
                            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
                                {[
                                    { key: 'all', label: 'Tất cả nguồn' },
                                    { key: 'drive', label: 'Drive của tôi' },
                                    { key: 'shared', label: 'Được chia sẻ với tôi' },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                            setFilterSource(opt.key);
                                            setOpenFilterDropdown(null);
                                        }}
                                        className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                            filterSource === opt.key ? 'text-[#0b57d0] font-semibold bg-blue-50/50' : 'text-gray-700 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {filterSource === opt.key && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Main Area: Table / Grid */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {loading ? (
                        /* Skeletons */
                        <div className="divide-y divide-gray-100 dark:divide-slate-800 mt-2">
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
                    ) : starredFiles.length === 0 ? (
                        /* Authentic Google Drive Empty State */
                        <div className="py-20 flex flex-col items-center justify-center text-center select-none">
                            <div className="w-32 h-32 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                                <Star className="w-16 h-16 text-amber-400 fill-amber-300 stroke-[1.5]" />
                            </div>
                            <h2 className="text-[17px] font-medium text-gray-800 dark:text-slate-100 mb-1.5">
                                Không có tệp nào có dấu sao
                            </h2>
                            <p className="text-[13px] text-gray-500 dark:text-slate-400 max-w-sm">
                                Thêm dấu sao vào những mục bạn muốn tìm lại dễ dàng sau này.
                            </p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* ================= LIST VIEW (Exact match to media_1791093681168.png) ================= */
                        <div className="w-full mt-1">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/80 dark:border-slate-800 text-[11.5px] font-medium text-[#444746] dark:text-slate-400 select-none h-9">
                                        {/* Tên Column with sort arrow */}
                                        <th className="py-2 px-3 w-[36%] min-w-0">
                                            <div
                                                onClick={() => {
                                                    if (sortBy === 'name') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('name');
                                                        setSortDirection('asc');
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1.5 cursor-pointer hover:text-gray-800 dark:hover:text-slate-200 group"
                                            >
                                                <span>Tên</span>
                                                {sortBy === 'name' && (
                                                    <span className="p-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                        {sortDirection === 'asc' ? (
                                                            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                                        ) : (
                                                            <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>

                                        <th className="py-2 px-3 w-[16%] min-w-0">Chủ sở hữu</th>
                                        <th className="py-2 px-3 w-[15%] min-w-0">Ngày sửa đổi</th>
                                        <th className="py-2 px-3 w-[12%] min-w-0">Kích cỡ tệp</th>
                                        <th className="py-2 px-3 w-[11%] min-w-0">Vị trí</th>

                                        {/* Sắp xếp Button matching media_1791093681168.png */}
                                        <th className="py-2 pr-3 w-[10%] text-right relative">
                                            <div className="relative inline-block text-left" ref={sortMenuRef}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowSortMenu(!showSortMenu);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                                >
                                                    <SlidersHorizontal className="w-3 h-3" />
                                                    <span>Sắp xếp</span>
                                                </button>

                                                {/* Popover Dropdown matching Google Drive screenshot */}
                                                {showSortMenu && (
                                                    <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 text-xs text-left">
                                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                            Sắp xếp theo
                                                        </div>
                                                        {[
                                                            { key: 'name', label: 'Tên' },
                                                            { key: 'modified', label: 'Ngày sửa đổi' },
                                                            { key: 'myModified', label: 'Ngày tôi sửa đổi' },
                                                            { key: 'opened', label: 'Ngày tôi mở' },
                                                        ].map((item) => (
                                                            <button
                                                                key={item.key}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSortBy(item.key as any);
                                                                    setShowSortMenu(false);
                                                                }}
                                                                className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                                                    sortBy === item.key
                                                                        ? 'text-[#0b57d0] font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                                                                        : 'text-gray-700 dark:text-slate-200'
                                                                }`}
                                                            >
                                                                <span>{item.label}</span>
                                                                {sortBy === item.key && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                            </button>
                                                        ))}

                                                        <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                            Chiều sắp xếp
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSortDirection('asc');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                                                sortDirection === 'asc'
                                                                    ? 'text-[#0b57d0] font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                                                                    : 'text-gray-700 dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <span>A đến Z</span>
                                                            {sortDirection === 'asc' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSortDirection('desc');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                                                sortDirection === 'desc'
                                                                    ? 'text-[#0b57d0] font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                                                                    : 'text-gray-700 dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <span>Z đến A</span>
                                                            {sortDirection === 'desc' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                        </button>

                                                        <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                            Thư mục
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFolderPosition('top');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                                                folderPosition === 'top'
                                                                    ? 'text-[#0b57d0] font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                                                                    : 'text-gray-700 dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <span>Trên cùng</span>
                                                            {folderPosition === 'top' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFolderPosition('mixed');
                                                                setShowSortMenu(false);
                                                            }}
                                                            className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                                                folderPosition === 'mixed'
                                                                    ? 'text-[#0b57d0] font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                                                                    : 'text-gray-700 dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <span>Kết hợp với tệp</span>
                                                            {folderPosition === 'mixed' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/80 dark:divide-slate-800/60 text-[12.5px]">
                                    {starredFiles.map((file) => {
                                        const ext = (file.fileType || file.name.split('.').pop() || '').toLowerCase();
                                        const config = getFileTypeConfig(ext);
                                        const Icon = config.icon;
                                        const isSelected = selectedFileIds.includes(file.id.toString());
                                        const rawOwner = (file as any).uploadedByName || (file as any).ownerName || 'tôi';
                                        const ownerIsMe = isMe(rawOwner);
                                        const ownerDisplay = ownerIsMe ? 'tôi' : (rawOwner.includes('@') ? rawOwner.split('@')[0] : rawOwner);
                                        const avatarClass = ownerIsMe ? 'bg-[#0b57d0] text-white' : getAvatarColor(ownerDisplay);
                                        const initial = ownerIsMe ? (currentUser.name ? currentUser.name.trim()[0].toUpperCase() : 't') : (ownerDisplay[0] || 'U').toUpperCase();
                                        const location = file.folderName || 'Drive của tôi';

                                        return (
                                            <tr
                                                key={file.id}
                                                onClick={(e) => handleFileClick(file.id, e)}
                                                onDoubleClick={() => handleFileDoubleClick(file)}
                                                onContextMenu={(e) => handleContextMenu(file, e)}
                                                className={`group transition-colors select-none cursor-pointer h-11 ${
                                                    isSelected
                                                        ? 'bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] font-medium'
                                                        : 'hover:bg-[#f0f4f9] dark:hover:bg-slate-800/50 text-[#1f1f1f] dark:text-slate-200'
                                                }`}
                                            >
                                                {/* 1. Tên Column (Icon + Tên + Star + Shared Icon) */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}
                                                        >
                                                            <Icon className="w-3 h-3" />
                                                        </div>
                                                        <span
                                                            className="font-normal text-[#1f1f1f] dark:text-slate-100 truncate text-[12.5px] hover:underline"
                                                            title={file.name}
                                                        >
                                                            {file.name}
                                                        </span>

                                                        {/* Star Icon - Filled Amber (Click to un-star) */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleToggleStar(file.id, e)}
                                                            className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/60 transition cursor-pointer shrink-0"
                                                            title="Bỏ gắn dấu sao"
                                                        >
                                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                                        </button>

                                                        {/* Shared icon if shared */}
                                                        {(file as any).isSharedWithMe && (
                                                            <span title="Đã chia sẻ">
                                                                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 2. Chủ sở hữu Column */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <div
                                                            className={`w-4 h-4 rounded-full flex items-center justify-center font-medium text-[8px] shrink-0 ${avatarClass}`}
                                                        >
                                                            {initial}
                                                        </div>
                                                        <span className="truncate text-[11.5px]">
                                                            {ownerDisplay}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 3. Ngày sửa đổi Column */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal text-[11.5px]">
                                                    {formatGoogleDriveDate(file.updatedAt)}
                                                </td>

                                                {/* 4. Kích cỡ tệp Column */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal text-[11.5px]">
                                                    {formatFileSize(file.size)}
                                                </td>

                                                {/* 5. Vị trí Column */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                    <div
                                                        className="flex items-center gap-1.5 truncate text-[11.5px]"
                                                        title={location}
                                                    >
                                                        <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400 fill-[#444746]/20 shrink-0" />
                                                        <span className="truncate">{location}</span>
                                                    </div>
                                                </td>

                                                {/* 6. Quick Action Column */}
                                                <td className="py-2 pr-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const a = document.createElement('a');
                                                                a.href = `http://localhost:8080/api/v1/files/${file.id}/download`;
                                                                a.download = file.name;
                                                                a.target = '_blank';
                                                                document.body.appendChild(a);
                                                                a.click();
                                                                document.body.removeChild(a);
                                                            }}
                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 transition cursor-pointer"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleContextMenu(file, e)}
                                                            className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 transition cursor-pointer"
                                                            title="Tùy chọn khác"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
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
                        /* ================= GRID VIEW (Matching Google Drive Cards) ================= */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 mt-2">
                            {starredFiles.map((file) => {
                                const ext = (file.fileType || file.name.split('.').pop() || '').toLowerCase();
                                const config = getFileTypeConfig(ext);
                                const Icon = config.icon;
                                const rawOwner = (file as any).uploadedByName || (file as any).ownerName || 'tôi';
                                const ownerIsMe = isMe(rawOwner);
                                const ownerDisplay = ownerIsMe ? 'tôi' : (rawOwner.includes('@') ? rawOwner.split('@')[0] : rawOwner);
                                const avatarClass = ownerIsMe ? 'bg-[#0b57d0] text-white' : getAvatarColor(ownerDisplay);
                                const initial = ownerIsMe ? (currentUser.name ? currentUser.name.trim()[0].toUpperCase() : 't') : (ownerDisplay[0] || 'U').toUpperCase();
                                const isSelected = selectedFileIds.includes(file.id.toString());

                                return (
                                    <div
                                        key={file.id}
                                        onClick={(e) => handleFileClick(file.id, e)}
                                        onDoubleClick={() => handleFileDoubleClick(file)}
                                        onContextMenu={(e) => handleContextMenu(file, e)}
                                        className={`rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 group relative shadow-2xs cursor-pointer select-none ${
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
                                                        className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate cursor-pointer hover:underline"
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleContextMenu(file, e)}
                                                    className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                                                    title="Tùy chọn khác"
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                </button>
                                            </div>

                                            {/* Preview Thumbnail Box */}
                                            <div className="w-full h-32 my-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition relative">
                                                <FileThumbnailPreview id={file.id} name={file.name} fileType={file.fileType} />
                                            </div>
                                        </div>

                                        {/* Bottom Metadata: Single line with Avatar + Star + Date */}
                                        <div className="mt-1 flex items-center justify-between min-w-0">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs ${avatarClass}`}
                                                >
                                                    {initial}
                                                </div>
                                                <span
                                                    className="text-[11px] text-gray-600 dark:text-slate-300 truncate"
                                                    title={`${ownerDisplay} • ${formatGoogleDriveDate(file.updatedAt)}`}
                                                >
                                                    {ownerDisplay} • {formatGoogleDriveDate(file.updatedAt)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleStar(file.id, e)}
                                                className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/60 transition cursor-pointer shrink-0"
                                                title="Bỏ gắn dấu sao"
                                            >
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. Right Details Panel (Collapsible) */}
                {showInfoPanel && (
                    <div className="w-[320px] bg-white dark:bg-[#1E1F20] border-l border-[#E0E2E0]/70 dark:border-slate-800 flex flex-col shrink-0 h-full shadow-none z-20 overflow-hidden animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-[#E0E2E0]/70 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
                            <h3 className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                {selectedFile ? selectedFile.name : 'Chi tiết'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowInfoPanel(false)}
                                className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
                            {selectedFile ? (
                                <div className="space-y-3">
                                    <div className="w-full h-36 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
                                        <FileThumbnailPreview id={selectedFile.id} name={selectedFile.name} fileType={selectedFile.fileType} />
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                                            <span className="text-gray-500">Loại tệp:</span>
                                            <span className="font-medium uppercase">{selectedFile.fileType || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                                            <span className="text-gray-500">Kích thước:</span>
                                            <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                                            <span className="text-gray-500">Vị trí:</span>
                                            <span className="font-medium">{selectedFile.folderName || 'Drive của tôi'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                                            <span className="text-gray-500">Sửa đổi lần cuối:</span>
                                            <span className="font-medium">{formatGoogleDriveDate(selectedFile.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                                        <span className="text-gray-500">Tổng số tệp gắn dấu sao:</span>
                                        <span className="font-semibold text-amber-600">{starredFiles.length}</span>
                                    </div>
                                    <p className="text-gray-400 text-[11px] pt-2">
                                        Chọn một tệp để xem thông tin chi tiết.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Custom Context Menu on Right Click */}
            {contextMenu && (
                <div
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    className="fixed z-50 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs select-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            router.push('/files');
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-2.5 text-gray-700 dark:text-slate-200"
                    >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span>Mở tài liệu</span>
                    </button>

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
                        className="w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-gray-700 dark:text-slate-200"
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
                            const a = document.createElement('a');
                            a.href = `http://localhost:8080/api/v1/files/${contextMenu.file.id}/download`;
                            a.download = contextMenu.file.name;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-2.5 text-gray-700 dark:text-slate-200"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>Tải xuống</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            handleToggleStar(contextMenu.file.id);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-2.5 text-amber-600 font-medium"
                    >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span>Bỏ gắn dấu sao</span>
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await fileManagementService.softDelete(contextMenu.file.id);
                                toast.success('Đã chuyển tệp vào thùng rác');
                                setFiles((prev) => prev.filter((f) => f.id !== contextMenu.file.id));
                            } catch {
                                toast.error('Không thể xóa tệp');
                            }
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition flex items-center gap-2.5"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Chuyển vào thùng rác</span>
                    </button>
                </div>
            )}
        </div>
    );
}
