'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
    Check,
    List,
    LayoutGrid,
    Info,
    Folder,
    Download,
    Edit3,
    MoreVertical,
    Trash2,
    ExternalLink,
    X,
    Users,
    UserPlus,
    FileSpreadsheet,
    FileText,
    FileCode,
    FileBox,
    Presentation,
    Video,
    Archive,
    Image as ImageIcon,
    Headphones,
    Sparkles,
    Copy,
    Mic,
    FolderInput,
    Link2,
    SlidersHorizontal,
    ChevronRight,
    ArrowDown,
    ArrowUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';

// Interface for Shared Item from real Database
interface SharedItem {
    id: string | number;
    name: string;
    isFolder?: boolean;
    fileType?: string;
    size?: string;
    sharedByEmail: string;
    sharedByName?: string;
    sharedDate: string;
    sharedTimestamp: number;
    group: string;
    thumbnailPath?: string;
}

// File Type visual configuration matching Google Drive
function getFileTypeConfig(extOrType: string, isFolder = false) {
    if (isFolder) {
        return {
            icon: Folder,
            color: 'text-[#444746] dark:text-slate-300',
            bgColor: 'bg-transparent',
            category: 'Thư mục',
        };
    }

    const ext = (extOrType || '').toLowerCase().replace(/^\./, '');

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-[#0f9d58] dark:text-emerald-400',
            bgColor: 'bg-emerald-100/90 dark:bg-emerald-950/60',
            category: 'Bảng tính',
        };
    }
    if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-[#1a73e8] dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Tài liệu',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-[#f29900] dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Trình bày',
        };
    }
    if (ext === 'pdf') {
        return {
            icon: FileText,
            color: 'text-[#ea4335] dark:text-red-400',
            bgColor: 'bg-red-100/90 dark:bg-red-950/60',
            category: 'PDF',
        };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
        return {
            icon: ImageIcon,
            color: 'text-rose-700 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'Hình ảnh',
        };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return {
            icon: Video,
            color: 'text-purple-700 dark:text-purple-400',
            bgColor: 'bg-purple-100/90 dark:bg-purple-950/60',
            category: 'Video',
        };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return {
            icon: Archive,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Tệp nén',
        };
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        return {
            icon: Headphones,
            color: 'text-orange-500 dark:text-orange-400',
            bgColor: 'bg-orange-100/90 dark:bg-orange-950/60',
            category: 'Âm thanh',
        };
    }
    if (['html', 'htm', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'css'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100/90 dark:bg-indigo-950/60',
            category: 'Mã nguồn',
        };
    }

    return {
        icon: FileBox,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-100/90 dark:bg-sky-950/60',
        category: 'Tệp',
    };
}

// Generate colored avatar based on email/name
function getAvatarColor(identifier: string) {
    const colors = [
        'bg-[#0b57d0] text-white',
        'bg-[#7c3aed] text-white',
        'bg-[#0284c7] text-white',
        'bg-[#059669] text-white',
        'bg-[#dc2626] text-white',
        'bg-[#d97706] text-white',
        'bg-[#4f46e5] text-white',
        'bg-[#db2777] text-white',
        'bg-[#0891b2] text-white',
        'bg-[#65a30d] text-white',
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Categorize date into Google Drive section headers
function getGroupFromDate(dateStr?: string): string {
    if (!dateStr) return 'Gần đây';
    try {
        let d: Date;
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ')[0].split('/');
            d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
            d = new Date(dateStr);
        }
        if (isNaN(d.getTime())) return 'Gần đây';

        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
            return 'Gần đây';
        } else if (diffDays <= 60) {
            return 'Tháng trước';
        } else if (d.getFullYear() === now.getFullYear()) {
            return 'Đầu năm nay';
        } else {
            return 'Năm ngoái';
        }
    } catch {
        return 'Gần đây';
    }
}

// Format date into Vietnamese format matching Google Drive (e.g., "23 thg 8")
function formatSharedDate(dateStr?: string): string {
    if (!dateStr) return 'Gần đây';
    try {
        let d: Date;
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ')[0].split('/');
            d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
            d = new Date(dateStr);
        }
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getDate()} thg ${d.getMonth() + 1}`;
    } catch {
        return dateStr;
    }
}

function SharedWithMeContent() {
    usePageBreadcrumb(['Drive', 'Được chia sẻ với tôi']);
    const router = useRouter();

    const [items, setItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        item: SharedItem;
    } | null>(null);

    // Current selected item for detail panel
    const selectedItem = useMemo(() => {
        if (selectedIds.length === 0) return null;
        return items.find((i) => i.id.toString() === selectedIds[0]) || null;
    }, [selectedIds, items]);

    // Load REAL DATA from Database via API
    useEffect(() => {
        const loadSharedData = async () => {
            setLoading(true);
            try {
                // 1. Get current logged in user
                let currentUserEmail = '';
                let currentUserName = '';
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const u = JSON.parse(storedUser);
                        currentUserEmail = (u.email || '').toLowerCase().trim();
                        currentUserName = (u.name || '').toLowerCase().trim();
                    }
                    const storedName = localStorage.getItem('authUsername');
                    if (storedName && !currentUserEmail) {
                        currentUserEmail = storedName.toLowerCase().trim();
                    }
                } catch (e) {}

                // 2. Get list of files user explicitly removed from their shared list
                let removedIds: string[] = [];
                try {
                    const storedRemoved = localStorage.getItem('shared_removed_ids');
                    if (storedRemoved) removedIds = JSON.parse(storedRemoved);
                } catch (e) {}

                // 3. Fetch real files from Backend
                const filesFromDb: FileItemDto[] = await fileManagementService.getSharedWithMeFiles();

                // 4. Map DB files into SharedItem, filtering out any file owned/uploaded by current user
                const mappedItems: SharedItem[] = filesFromDb
                    .filter((f) => {
                        // Exclude removed files
                        if (removedIds.includes(f.id.toString())) return false;

                        // Exclude files uploaded by current user
                        const fileOwnerEmail = (f.uploadedByEmail || '').toLowerCase().trim();
                        const fileOwnerName = (f.uploadedByName || '').toLowerCase().trim();

                        if (currentUserEmail && fileOwnerEmail === currentUserEmail) {
                            return false;
                        }
                        if (currentUserName && fileOwnerName === currentUserName) {
                            return false;
                        }

                        return true;
                    })
                    .map((f) => {
                        let timestamp = Date.now();
                        if (f.updatedAt) {
                            try {
                                if (f.updatedAt.includes('/')) {
                                    const parts = f.updatedAt.split(' ')[0].split('/');
                                    timestamp = new Date(
                                        parseInt(parts[2], 10),
                                        parseInt(parts[1], 10) - 1,
                                        parseInt(parts[0], 10)
                                    ).getTime();
                                } else {
                                    timestamp = new Date(f.updatedAt).getTime();
                                }
                            } catch {}
                        }

                        const sharerEmail = f.uploadedByEmail || f.owner || 'Thành viên chia sẻ';
                        const sharerName = f.uploadedByName || f.owner || 'Thành viên';

                        return {
                            id: f.id,
                            name: f.name,
                            fileType: f.fileType,
                            size: f.size || '1.0 MB',
                            sharedByEmail: sharerEmail,
                            sharedByName: sharerName,
                            sharedDate: formatSharedDate(f.updatedAt),
                            sharedTimestamp: isNaN(timestamp) ? Date.now() : timestamp,
                            group: getGroupFromDate(f.updatedAt),
                            thumbnailPath: f.thumbnailPath,
                        };
                    });

                setItems(mappedItems);

                // Auto-select first item if available
                if (mappedItems.length > 0) {
                    setSelectedIds([mappedItems[0].id.toString()]);
                } else {
                    setSelectedIds([]);
                }
            } catch (err) {
                console.error('Lỗi tải dữ liệu tệp được chia sẻ từ cơ sở dữ liệu:', err);
                setItems([]);
                setSelectedIds([]);
            } finally {
                setLoading(false);
            }
        };

        loadSharedData();
    }, []);

    // Close context menu on global click or Escape
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
            }
        };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Handle Item Click (Single click selects item)
    const handleItemClick = (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const idStr = id.toString();
        if (e.ctrlKey || e.metaKey) {
            setSelectedIds((prev) =>
                prev.includes(idStr) ? prev.filter((i) => i !== idStr) : [...prev, idStr]
            );
        } else {
            setSelectedIds([idStr]);
        }
    };

    // Handle Double Click (Open Preview or Folder)
    const handleItemDoubleClick = (item: SharedItem) => {
        if (item.isFolder) {
            toast.success(`Mở thư mục "${item.name}"`);
        } else {
            toast.success(`Xem trước tài liệu "${item.name}"`);
            router.push(`/files/detail?id=${item.id}&name=${encodeURIComponent(item.name)}`);
        }
    };

    // Open Context Menu on Right Click
    const handleContextMenu = (item: SharedItem, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIds([item.id.toString()]);

        const menuWidth = 260;
        const menuHeight = 360;
        const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
        const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

        setContextMenu({ x, y, item });
    };

    // Handle remove from "Shared with me" (Gỡ bỏ khỏi danh sách)
    const handleRemoveFromShared = (itemToRemove?: SharedItem) => {
        const target = itemToRemove || selectedItem;
        if (!target) return;

        const targetIdStr = target.id.toString();
        setItems((prev) => prev.filter((i) => i.id.toString() !== targetIdStr));
        setSelectedIds((prev) => prev.filter((id) => id !== targetIdStr));
        setContextMenu(null);

        // Save removed ID
        try {
            const stored = localStorage.getItem('shared_removed_ids');
            const arr = stored ? JSON.parse(stored) : [];
            if (!arr.includes(targetIdStr)) {
                arr.push(targetIdStr);
                localStorage.setItem('shared_removed_ids', JSON.stringify(arr));
            }
        } catch (e) {}

        toast.success(`Đã gỡ bỏ "${target.name}" khỏi danh sách được chia sẻ với bạn.`);
    };

    // Handle Ask Gemini
    const handleAskGemini = (targetItem?: SharedItem) => {
        const target = targetItem || selectedItem;
        if (!target) return;

        if (target.isFolder) {
            router.push(`/ai?folderId=${target.id}&folderName=${encodeURIComponent(target.name)}`);
        } else {
            router.push(`/ai?fileId=${target.id}&fileName=${encodeURIComponent(target.name)}`);
        }
        setContextMenu(null);
    };

    // Handle Download
    const handleDownload = (item: SharedItem) => {
        if (item.isFolder) {
            toast('Thư mục đang được đóng gói dưới dạng ZIP để tải xuống...', { icon: '📦' });
        } else {
            const url = `http://localhost:8080/api/v1/files/${item.id}/download`;
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`Đang tải xuống "${item.name}"`);
        }
        setContextMenu(null);
    };

    // Handle Copy Link
    const handleCopyLink = (item: SharedItem) => {
        const link = `${window.location.origin}/files/${item.id}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép đường liên kết vào khay nhớ tạm');
        setContextMenu(null);
    };

    // Sort items
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortDirection === 'desc') {
                return b.sharedTimestamp - a.sharedTimestamp;
            } else {
                return a.sharedTimestamp - b.sharedTimestamp;
            }
        });
    }, [items, sortDirection]);

    // Group sorted items into section headers
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: SharedItem[] } = {};
        sortedItems.forEach((item) => {
            const g = item.group || 'Khác';
            if (!groups[g]) groups[g] = [];
            groups[g].push(item);
        });
        return groups;
    }, [sortedItems]);

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] bg-white dark:bg-slate-900 font-sans select-none overflow-hidden">
            {/* ── ROW 1: TITLE & RIGHT CONTROLS (ALWAYS VISIBLE) ── */}
            <div className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
                <h1 className="text-[22px] font-normal text-[#1F1F1F] dark:text-slate-100">
                    Được chia sẻ với tôi
                </h1>

                {/* Right controls: View mode pill + Info drawer toggle */}
                <div className="flex items-center gap-2">
                    {/* View Switcher: List vs Grid - Google Drive Pill shape */}
                    <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-full p-0.5 bg-white dark:bg-slate-900 shadow-2xs h-7">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
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
                            onClick={() => setViewMode('grid')}
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

                    {/* Details Panel Toggle Button (i) */}
                    <button
                        type="button"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        className={`p-2 rounded-full transition cursor-pointer ${
                            showInfoPanel
                                ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                        title="Xem chi tiết"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── ROW 2: ACTION TOOLBAR (WHEN ITEMS ARE SELECTED) ── */}
            {selectedIds.length > 0 && (
                <div className="px-4 sm:px-6 py-1.5 flex items-center gap-3 shrink-0 animate-in fade-in duration-100">
                    <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-slate-300 transition cursor-pointer"
                        title="Bỏ chọn"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <span className="text-[13px] font-normal text-gray-700 dark:text-slate-200">
                        đã chọn {selectedIds.length} mục
                    </span>

                    <div className="h-4 w-px bg-gray-300 dark:bg-slate-700 mx-0.5" />

                    {/* Pill: Hỏi Gemini */}
                    <button
                        type="button"
                        onClick={() => handleAskGemini()}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-gray-300 dark:border-slate-700 rounded-full text-xs font-medium text-gray-800 dark:text-slate-100 shadow-2xs transition cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#0b57d0] dark:text-blue-400 fill-blue-500/20" />
                        <span>Hỏi Gemini</span>
                    </button>

                    {/* Action Icons */}
                    <div className="flex items-center gap-0.5 ml-1 text-gray-600 dark:text-slate-300">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedItem) {
                                    router.push(`/files/permissions?name=${encodeURIComponent(selectedItem.name)}`);
                                }
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            title="Chia sẻ"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => selectedItem && handleDownload(selectedItem)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            title="Tải xuống"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => toast('Tính năng di chuyển lối tắt vào Drive của bạn', { icon: '📁' })}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            title="Thêm lối tắt vào Drive"
                        >
                            <FolderInput className="w-4 h-4" />
                        </button>
                        {/* Disabled Trash button matching Google Drive */}
                        <button
                            type="button"
                            disabled
                            className="p-1.5 text-gray-300 dark:text-slate-600 cursor-not-allowed"
                            title="Bạn không có quyền chuyển tệp này vào thùng rác. Thay vào đó hãy chọn Gỡ khỏi danh sách."
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => selectedItem && handleCopyLink(selectedItem)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            title="Sao chép đường liên kết"
                        >
                            <Link2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => selectedItem && handleContextMenu(selectedItem, e)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            title="Tùy chọn khác"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Đang tải danh sách tài liệu từ cơ sở dữ liệu...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                            <Users className="w-12 h-12 stroke-1 mb-3 text-gray-300 dark:text-slate-600" />
                            <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                Chưa có tệp nào được chia sẻ với bạn
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                Khi người khác trong tổ chức chia sẻ tệp hoặc thư mục với tài khoản của bạn, chúng sẽ tự động hiển thị tại đây.
                            </p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* ── REAL DATA TABLE MATCHING GOOGLE DRIVE ── */
                        <div className="w-full pb-6">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/80 dark:border-slate-800 text-[12px] font-normal text-[#444746] dark:text-slate-400 select-none h-10">
                                        <th className="py-2 px-3 w-[45%] min-w-0 font-normal">
                                            <span>Tên</span>
                                        </th>
                                        <th className="py-2 px-3 w-[27%] min-w-0 font-normal">
                                            <span>Người chia sẻ</span>
                                        </th>
                                        <th className="py-2 px-3 w-[18%] min-w-0 font-normal">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                                                }
                                                className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                                            >
                                                <span>Ngày chia sẻ</span>
                                                <span className="p-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] inline-flex items-center">
                                                    {sortDirection === 'desc' ? (
                                                        <ArrowDown className="w-3 h-3 text-[#0b57d0]" />
                                                    ) : (
                                                        <ArrowUp className="w-3 h-3 text-[#0b57d0]" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="py-2 pr-3 w-[10%] text-right font-normal">
                                            <button
                                                type="button"
                                                onClick={() => toast('Bộ lọc sắp xếp tài liệu')}
                                                className="inline-flex items-center gap-1 text-[#444746] hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                                            >
                                                <SlidersHorizontal className="w-3 h-3 rotate-90" />
                                                <span className="text-[12px]">Sắp xếp</span>
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px]">
                                    {Object.entries(groupedItems).map(([groupTitle, groupList]) => (
                                        <React.Fragment key={groupTitle}>
                                            {/* Section Heading Group */}
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="pt-4 pb-2 px-3 text-[13px] font-medium text-[#444746] dark:text-slate-300 select-none"
                                                >
                                                    {groupTitle}
                                                </td>
                                            </tr>

                                            {/* Real DB Items inside this Group */}
                                            {groupList.map((item) => {
                                                const isSelected = selectedIds.includes(item.id.toString());
                                                const config = getFileTypeConfig(item.fileType || '', item.isFolder);
                                                const Icon = config.icon;
                                                const avatarClass = getAvatarColor(item.sharedByEmail);
                                                const initial = item.sharedByEmail.charAt(0).toUpperCase();

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        onClick={(e) => handleItemClick(item.id, e)}
                                                        onDoubleClick={() => handleItemDoubleClick(item)}
                                                        onContextMenu={(e) => handleContextMenu(item, e)}
                                                        className={`group transition-colors cursor-pointer select-none h-10 border-b border-gray-50/60 dark:border-slate-800/40 ${
                                                            isSelected
                                                                ? 'bg-[#c2e7ff] dark:bg-[#004a77]/60 text-[#001d35] dark:text-blue-100 font-normal'
                                                                : 'hover:bg-[#f2f6fc] dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-100'
                                                        }`}
                                                    >
                                                        {/* 1. Column: Tên */}
                                                        <td className="py-1 px-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="shrink-0 flex items-center justify-center">
                                                                    {item.isFolder ? (
                                                                        <Folder className="w-4 h-4 text-[#5f6368] dark:text-slate-400 fill-[#5f6368]/20" />
                                                                    ) : (
                                                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className="truncate text-[13px] font-normal"
                                                                    title={item.name}
                                                                >
                                                                    {item.name}
                                                                </span>
                                                                {/* Shared with others icon indicator 👥 */}
                                                                <span title="Được chia sẻ">
                                                                    <Users className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-0.5" />
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* 2. Column: Người chia sẻ */}
                                                        <td className="py-1 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div
                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${avatarClass}`}
                                                                >
                                                                    {initial}
                                                                </div>
                                                                <span
                                                                    className="truncate text-[12px]"
                                                                    title={item.sharedByEmail}
                                                                >
                                                                    {item.sharedByEmail}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* 3. Column: Ngày chia sẻ */}
                                                        <td className="py-1 px-3 text-[#444746] dark:text-slate-400 font-normal text-[12px] whitespace-nowrap">
                                                            {item.sharedDate}
                                                        </td>

                                                        {/* 4. Column: 3 dots action menu */}
                                                        <td className="py-1 pr-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleContextMenu(item, e)}
                                                                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                title="Tùy chọn khác"
                                                            >
                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ── GRID VIEW (CARDS) ── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 mt-2 pb-6">
                            {sortedItems.map((item) => {
                                const isSelected = selectedIds.includes(item.id.toString());
                                const config = getFileTypeConfig(item.fileType || '', item.isFolder);
                                const Icon = config.icon;
                                const avatarClass = getAvatarColor(item.sharedByEmail);
                                const initial = item.sharedByEmail.charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={item.id}
                                        onClick={(e) => handleItemClick(item.id, e)}
                                        onDoubleClick={() => handleItemDoubleClick(item)}
                                        onContextMenu={(e) => handleContextMenu(item, e)}
                                        className={`rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 group relative shadow-2xs cursor-pointer select-none ${
                                            isSelected
                                                ? 'bg-[#c2e7ff] hover:bg-[#b5def7] dark:bg-blue-950/70 border-2 border-blue-500 shadow-xs'
                                                : 'bg-[#f0f4f9] hover:bg-[#e6edf7] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200/90 dark:hover:border-slate-700/80'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    {item.isFolder ? (
                                                        <Folder className="w-4 h-4 text-[#5f6368] dark:text-slate-400 shrink-0" />
                                                    ) : (
                                                        <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
                                                    )}
                                                    <span
                                                        className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate hover:underline"
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleContextMenu(item, e)}
                                                    className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition"
                                                    title="Tùy chọn khác"
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                </button>
                                            </div>

                                            {/* Preview Thumbnail Box */}
                                            <div className="w-full h-28 my-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition relative">
                                                {item.isFolder ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                        <Folder className="w-10 h-10 text-blue-500/40 fill-blue-500/10" />
                                                        <span className="text-[10px] mt-1">Thư mục chia sẻ</span>
                                                    </div>
                                                ) : (
                                                    <FileThumbnailPreview id={item.id} name={item.name} fileType={item.fileType} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Metadata: Avatar + Sharer email */}
                                        <div className="mt-1 flex items-center justify-between min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                <div
                                                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[8.5px] shrink-0 ${avatarClass}`}
                                                >
                                                    {initial}
                                                </div>
                                                <span
                                                    className="text-[11px] text-gray-500 dark:text-slate-400 truncate"
                                                    title={item.sharedByEmail}
                                                >
                                                    {item.sharedByEmail}
                                                </span>
                                            </div>
                                            <span className="text-[10.5px] text-gray-400 shrink-0 ml-1">
                                                {item.sharedDate}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT DETAILS PANEL (DRAWER) ── */}
                {showInfoPanel && (
                    <div className="w-80 border-l border-gray-200/80 dark:border-slate-800 bg-[#f8fafd] dark:bg-slate-900 flex flex-col shrink-0 transition-all select-none overflow-y-auto">
                        <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200/80 dark:border-slate-800 shrink-0">
                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 truncate">
                                {selectedItem ? selectedItem.name : 'Chi tiết'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowInfoPanel(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 text-xs space-y-4">
                            {selectedItem ? (
                                <div className="space-y-4">
                                    <div className="w-full h-36 bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex items-center justify-center">
                                        {selectedItem.isFolder ? (
                                            <Folder className="w-12 h-12 text-blue-500/40" />
                                        ) : (
                                            <FileThumbnailPreview
                                                id={selectedItem.id}
                                                name={selectedItem.name}
                                                fileType={selectedItem.fileType}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
                                            Ai có quyền truy cập
                                        </h3>
                                        <div className="p-3 bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(
                                                        selectedItem.sharedByEmail
                                                    )}`}
                                                >
                                                    {selectedItem.sharedByEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 dark:text-slate-200 truncate">
                                                        {selectedItem.sharedByName || selectedItem.sharedByEmail}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate">Chủ sở hữu</p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium">
                                                Đã chia sẻ
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
                                            Chi tiết hệ thống
                                        </h3>
                                        <div className="bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2.5 text-[11.5px]">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Loại</span>
                                                <span className="font-medium text-gray-700 dark:text-slate-200">
                                                    {getFileTypeConfig(selectedItem.fileType || '', selectedItem.isFolder).category}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Kích thước</span>
                                                <span className="font-medium text-gray-700 dark:text-slate-200">
                                                    {selectedItem.size || '1.2 MB'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Ngày chia sẻ</span>
                                                <span className="font-medium text-gray-700 dark:text-slate-200">
                                                    {selectedItem.sharedDate}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Quyền của bạn</span>
                                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    Xem &amp; Nhận xét
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                            Tệp này thuộc quyền sở hữu của {selectedItem.sharedByName || selectedItem.sharedByEmail}. Bạn không có quyền chuyển tệp này vào thùng rác nhưng có thể gỡ khỏi danh sách của bạn bất kỳ lúc nào.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-10">Chọn một mục để xem chi tiết</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── ROW 3: BOTTOM BREADCRUMB INDICATOR ── */}
            <div className="h-8 px-4 sm:px-6 bg-[#f8fafd] dark:bg-slate-950 border-t border-gray-200/70 dark:border-slate-800 flex items-center text-[11.5px] text-gray-600 dark:text-slate-400 shrink-0 select-none">
                <div className="flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>Được chia sẻ với tôi</span>
                    {selectedItem && (
                        <>
                            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                            {selectedItem.isFolder ? (
                                <Folder className="w-3.5 h-3.5 text-gray-500 fill-gray-500/20 shrink-0" />
                            ) : (
                                <FileText className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                            )}
                            <span className="font-normal text-gray-800 dark:text-slate-200 truncate">
                                {selectedItem.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* ── CONTEXT MENU ── */}
            {contextMenu && (
                <div
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    className="fixed z-50 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Block 1: Open, Download, Rename, Copy */}
                    <div className="py-1">
                        <button
                            type="button"
                            onClick={() => handleItemDoubleClick(contextMenu.item)}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                                <span>Mở bằng</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDownload(contextMenu.item)}
                            className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <Download className="w-4 h-4 text-gray-500" />
                            <span>Tải xuống</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                toast('Bạn chỉ có quyền xem nên không thể đổi tên tệp này', { icon: '🔒' });
                                setContextMenu(null);
                            }}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-400 dark:text-slate-500 cursor-not-allowed select-none"
                            title="Bạn chỉ có quyền xem nên không thể đổi tên"
                        >
                            <div className="flex items-center gap-2.5">
                                <Edit3 className="w-4 h-4 text-gray-400" />
                                <span>Đổi tên</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">Ctrl+Alt+E</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                toast.success(`Đã tạo bản sao của "${contextMenu.item.name}" trong Drive của bạn`);
                                setContextMenu(null);
                            }}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Copy className="w-4 h-4 text-gray-500" />
                                <span>Tạo bản sao</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">Ctrl+C rồi đến Ctrl+V</span>
                        </button>
                    </div>

                    {/* Block 2: Hỏi Gemini, Bản tổng quan bằng âm thanh */}
                    <div className="py-1">
                        <button
                            type="button"
                            onClick={() => handleAskGemini(contextMenu.item)}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="w-4 h-4 text-[#0b57d0] dark:text-blue-400 fill-blue-500/20" />
                                <span>Hỏi Gemini</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-blue-900/60 dark:text-blue-200">
                                Mới
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                toast('Tính năng Bản tổng quan bằng âm thanh đang hoàn thiện', { icon: '🎙' });
                                setContextMenu(null);
                            }}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Mic className="w-4 h-4 text-gray-500" />
                                <span className="truncate">Tạo bản tổng quan bằng âm...</span>
                            </div>
                        </button>
                    </div>

                    {/* Block 3: Chia sẻ, Sắp xếp, Chi tiết */}
                    <div className="py-1">
                        <button
                            type="button"
                            onClick={() => {
                                router.push(`/files/permissions?name=${encodeURIComponent(contextMenu.item.name)}`);
                                setContextMenu(null);
                            }}
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <UserPlus className="w-4 h-4 text-gray-500" />
                                <span>Chia sẻ</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                toast('Thêm lối tắt vào Drive của tôi', { icon: '📁' });
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

                        <button
                            type="button"
                            onClick={() => {
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
                    </div>

                    {/* Block 4: Chuyển vào thùng rác (Disabled) & Gỡ bỏ khỏi danh sách */}
                    <div className="py-1">
                        <div
                            className="w-full px-3.5 py-1.5 flex items-center justify-between text-gray-400 dark:text-slate-500 cursor-not-allowed select-none"
                            title="Bạn không có quyền chuyển tệp này vào thùng rác vì bạn không phải là chủ sở hữu"
                        >
                            <div className="flex items-center gap-2.5">
                                <Trash2 className="w-4 h-4 text-gray-400" />
                                <span>Chuyển vào thùng rác</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">Delete</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleRemoveFromShared(contextMenu.item)}
                            className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer font-medium"
                        >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span>Gỡ khỏi danh sách của tôi</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SharedWithMePage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải...</span>
                </div>
            }
        >
            <SharedWithMeContent />
        </Suspense>
    );
}
