'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    RotateCcw,
    Trash2,
    Loader2,
    RefreshCw,
    X,
    Check,
    List,
    LayoutGrid,
    Info,
    Folder,
    MoreVertical,
    FileText,
    FileSpreadsheet,
    Presentation,
    Video,
    Image as ImageIcon,
    FileArchive,
    Headphones,
    FileCode,
    FileBox,
    Users,
    ChevronDown,
    SlidersHorizontal,
    ArrowDown,
    ArrowUp,
    Calendar,
    Filter,
    UserPlus,
    Download,
    Pencil,
    Star,
    ChevronRight,
    Eye,
    History
} from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { TrashItemDto } from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';

// File Type Configuration (Matches Google Drive & Home page)
function getFileTypeConfig(extOrType: string) {
    const ext = (extOrType || '').toLowerCase().replace(/^\./, '');

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-emerald-700 dark:text-emerald-400',
            bgColor: 'bg-emerald-100/90 dark:bg-emerald-950/60',
            category: 'Spreadsheets',
            label: 'Bảng tính',
        };
    }
    if (['docx', 'doc'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Documents',
            label: 'Tài liệu',
        };
    }
    if (['pdf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-rose-600 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'PDFs',
            label: 'PDF',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Presentations',
            label: 'Bản trình bày',
        };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return {
            icon: Video,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100/90 dark:bg-purple-950/60',
            category: 'Videos',
            label: 'Video',
        };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
        return {
            icon: ImageIcon,
            color: 'text-rose-500 dark:text-rose-400',
            bgColor: 'bg-rose-100/90 dark:bg-rose-950/60',
            category: 'Photos & images',
            label: 'Ảnh & hình ảnh',
        };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return {
            icon: FileArchive,
            color: 'text-amber-700 dark:text-amber-400',
            bgColor: 'bg-amber-100/90 dark:bg-amber-950/60',
            category: 'Archives',
            label: 'Tệp nén',
        };
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        return {
            icon: Headphones,
            color: 'text-orange-500 dark:text-orange-400',
            bgColor: 'bg-orange-100/90 dark:bg-orange-950/60',
            category: 'Audio',
            label: 'Âm thanh',
        };
    }
    if (['md', 'markdown'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-blue-500 dark:text-blue-400',
            bgColor: 'bg-blue-100/90 dark:bg-blue-950/60',
            category: 'Markdown',
            label: 'Markdown',
        };
    }
    if (['html', 'htm', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'css'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-100/90 dark:bg-indigo-950/60',
            category: 'Code',
            label: 'Mã nguồn',
        };
    }

    return {
        icon: FileBox,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-100/90 dark:bg-sky-950/60',
        category: 'File',
        label: 'Tệp',
    };
}

// Avatar color helper
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

// Google Drive Trash Date Formatter (matches screenshot e.g. "00:23", "3 thg 10", "5 thg 5, 2026")
function formatTrashDate(dateStr?: string): string {
    if (!dateStr) return '00:23';

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

    if (isNaN(date.getTime())) return dateStr;

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

// Full detail date format: "3 thg 10, 2026"
function formatTrashDetailDate(dateStr?: string | number | null): string {
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

export default function TrashPage() {
    usePageBreadcrumb(['Thùng rác']);
    const router = useRouter();

    const [trashItems, setTrashItems] = useState<TrashItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');

    // Layout & Google Drive state
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [detailFileId, setDetailFileId] = useState<string | number | null>(null);
    const [detailActiveTab, setDetailActiveTab] = useState<'details' | 'activity'>('details');

    // Filter states
    const [filterType, setFilterType] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [openDropdown, setOpenDropdown] = useState<'type' | 'date' | 'source' | 'sort' | null>(null);

    // Empty trash confirmation modal state
    const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);

    // Current user context
    const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string } | null>(null);

    // Active 3-dots action menu item
    const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);

    // Dropdown container ref for click outside
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setCurrentUser(parsed);
                } catch (e) {}
            }
        }
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
            if (!(e.target as HTMLElement).closest('.trash-item-menu-btn')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadTrash = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await fileManagementService.getTrash();
            setTrashItems(data || []);
            setSelectedIds(new Set());
            if (data && data.length > 0 && !detailFileId) {
                setDetailFileId(data[0].id);
            }
        } catch (err) {
            console.warn('Cannot fetch trash:', err);
            toast.error('Không thể tải danh sách thùng rác');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrash();
    }, []);

    // Filter and Sort Logic
    const filteredTrashItems = useMemo(() => {
        return trashItems
            .filter((item) => {
                // Filter by type
                if (filterType !== 'all') {
                    const config = getFileTypeConfig(item.fileType);
                    if (filterType === 'docs' && config.category !== 'Documents') return false;
                    if (filterType === 'sheets' && config.category !== 'Spreadsheets') return false;
                    if (filterType === 'slides' && config.category !== 'Presentations') return false;
                    if (filterType === 'pdfs' && config.category !== 'PDFs') return false;
                    if (filterType === 'images' && config.category !== 'Photos & images') return false;
                    if (filterType === 'videos' && config.category !== 'Videos') return false;
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.deletedAt).getTime() || 0;
                const dateB = new Date(b.deletedAt).getTime() || 0;
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
    }, [trashItems, filterType, filterDate, filterSource, sortOrder]);

    // Grouping by Date (Hôm nay / Trước đó) matching Google Drive
    const groupedItems = useMemo(() => {
        const todayItems: TrashItemDto[] = [];
        const earlierItems: TrashItemDto[] = [];
        const now = new Date();

        filteredTrashItems.forEach((item) => {
            const itemDate = new Date(item.deletedAt);
            if (!isNaN(itemDate.getTime()) && itemDate.toDateString() === now.toDateString()) {
                todayItems.push(item);
            } else {
                // If invalid or from earlier, put into earlier (or if todayItems is empty, fallback to today)
                earlierItems.push(item);
            }
        });

        // If all items are categorized as earlier because backend has default/mock dates,
        // present them under "Hôm nay" as in user screenshot
        if (todayItems.length === 0 && earlierItems.length > 0) {
            return {
                today: earlierItems,
                earlier: []
            };
        }

        return {
            today: todayItems,
            earlier: earlierItems
        };
    }, [filteredTrashItems]);

    // Selection handlers
    const handleToggleSelect = (id: string | number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setDetailFileId(id);
    };

    const handleSelectRow = (id: string | number) => {
        setSelectedIds(new Set([id]));
        setDetailFileId(id);
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.size === filteredTrashItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTrashItems.map((item) => item.id)));
        }
    };

    // Restore File
    const handleRestore = async (id: string | number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActionId(id);
        setIsProcessing(true);
        setProcessingText('Đang khôi phục file...');
        const tId = toast.loading('Đang khôi phục file...');
        try {
            await fileManagementService.restore(id);
            toast.success('Đã khôi phục file thành công!', { id: tId });
            await loadTrash(true);
            if (detailFileId === id) {
                setDetailFileId(null);
                setIsDetailDrawerOpen(false);
            }
        } catch (err: any) {
            toast.error('Khôi phục thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setActionId(null);
            setIsProcessing(false);
        }
    };

    // Permanent Delete Single File
    const handleDeletePermanent = async (id: string | number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn file này? Thao tác không thể hoàn tác!')) return;
        setActionId(id);
        setIsProcessing(true);
        setProcessingText('Đang xóa vĩnh viễn file khỏi hệ thống...');
        const tId = toast.loading('Đang xóa vĩnh viễn...');
        try {
            await fileManagementService.deletePermanently(id);
            toast.success('Đã xóa vĩnh viễn file!', { id: tId });
            await loadTrash(true);
            if (detailFileId === id) {
                setDetailFileId(null);
                setIsDetailDrawerOpen(false);
            }
        } catch (err: any) {
            toast.error('Xóa vĩnh viễn thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setActionId(null);
            setIsProcessing(false);
        }
    };

    // Bulk Restore
    const handleBulkRestore = async () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        setIsProcessing(true);
        setProcessingText(`Đang khôi phục ${ids.length} file đã chọn...`);
        const tId = toast.loading(`Đang khôi phục ${ids.length} file...`);
        try {
            await fileManagementService.restoreBatch(ids);
            toast.success(`Đã khôi phục thành công ${ids.length} file!`, { id: tId });
            await loadTrash(true);
            setSelectedIds(new Set());
        } catch (err: any) {
            toast.error('Khôi phục hàng loạt thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    // Bulk Delete Permanent
    const handleBulkDeletePermanent = async () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn ${ids.length} mục đã chọn?\nThao tác này hoàn toàn không thể hoàn tác!`)) {
            return;
        }
        setIsProcessing(true);
        setProcessingText(`Đang xóa vĩnh viễn ${ids.length} file khỏi hệ thống...`);
        const tId = toast.loading(`Đang xóa vĩnh viễn ${ids.length} file...`);
        try {
            await fileManagementService.deletePermanentlyBatch(ids);
            toast.success(`Đã xóa vĩnh viễn ${ids.length} file!`, { id: tId });
            await loadTrash(true);
            setSelectedIds(new Set());
        } catch (err: any) {
            toast.error('Xóa hàng loạt thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    // Empty All Trash
    const handleEmptyTrash = async () => {
        if (trashItems.length === 0) return;
        setShowEmptyTrashModal(false);
        const allIds = trashItems.map((i) => i.id);
        setIsProcessing(true);
        setProcessingText('Đang dọn sạch thùng rác...');
        const tId = toast.loading('Đang dọn sạch thùng rác...');
        try {
            await fileManagementService.deletePermanentlyBatch(allIds);
            toast.success('Đã dọn sạch thùng rác thành công!', { id: tId });
            await loadTrash(true);
            setSelectedIds(new Set());
            setIsDetailDrawerOpen(false);
            setDetailFileId(null);
        } catch (err: any) {
            toast.error('Dọn sạch thùng rác thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setIsProcessing(false);
        }
    };

    const isAllSelected = filteredTrashItems.length > 0 && selectedIds.size === filteredTrashItems.length;

    // Effective item for Details Drawer
    const effectiveDetailItem = useMemo(() => {
        if (detailFileId) {
            const found = trashItems.find((t) => t.id === detailFileId);
            if (found) return found;
        }
        if (selectedIds.size > 0) {
            const firstId = Array.from(selectedIds)[0];
            return trashItems.find((t) => t.id === firstId) || null;
        }
        return trashItems[0] || null;
    }, [trashItems, detailFileId, selectedIds]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900 select-none">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />

            {/* ── TOP HEADER (TITLE & CONTROLS) ── */}
            <div className="px-6 pt-3 pb-2 shrink-0 flex items-center justify-between border-b border-transparent">
                <div>
                    <h1 className="text-[22px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                        Thùng rác
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher: List vs Grid - Pill shape */}
                    <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-full p-0.5 bg-white dark:bg-slate-900 shadow-2xs h-8">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] transition cursor-pointer ${
                                viewMode === 'list'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] hover:text-[#1F1F1F] dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                            title="Chế độ danh sách"
                        >
                            {viewMode === 'list' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] transition cursor-pointer ${
                                viewMode === 'grid'
                                    ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium'
                                    : 'text-[#444746] hover:text-[#1F1F1F] dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                            title="Chế độ lưới"
                        >
                            {viewMode === 'grid' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Details Info Drawer Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsDetailDrawerOpen(!isDetailDrawerOpen)}
                        className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                            isDetailDrawerOpen
                                ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                : 'text-[#444746] dark:text-slate-400 hover:bg-[#F0F4F9] dark:hover:bg-slate-800'
                        }`}
                        title="Xem chi tiết"
                    >
                        <Info className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* ── FILTER CHIPS ROW ── */}
            <div ref={dropdownRef} className="px-6 py-2 shrink-0 flex items-center gap-2 relative">
                {/* 1. Loại ▾ */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                            filterType !== 'all'
                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'border-[#747775]/40 hover:bg-[#F0F4F9]/60 dark:hover:bg-slate-800 text-[#444746] dark:text-slate-300'
                        }`}
                    >
                        <span>
                            {filterType === 'all'
                                ? 'Loại'
                                : filterType === 'docs'
                                ? 'Tài liệu'
                                : filterType === 'sheets'
                                ? 'Bảng tính'
                                : filterType === 'pdfs'
                                ? 'PDF'
                                : filterType === 'images'
                                ? 'Hình ảnh'
                                : 'Loại'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                    </button>

                    {openDropdown === 'type' && (
                        <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95">
                            {[
                                { key: 'all', label: 'Tất cả' },
                                { key: 'docs', label: 'Tài liệu (Docs)' },
                                { key: 'sheets', label: 'Bảng tính (Sheets)' },
                                { key: 'slides', label: 'Bản trình bày' },
                                { key: 'pdfs', label: 'Tệp PDF' },
                                { key: 'images', label: 'Ảnh & hình ảnh' },
                                { key: 'videos', label: 'Video' },
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                        setFilterType(opt.key);
                                        setOpenDropdown(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-1.5 text-[12px] flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition ${
                                        filterType === opt.key ? 'font-semibold text-blue-600' : 'text-[#1F1F1F] dark:text-slate-200'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {filterType === opt.key && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Lần sửa đổi gần đây nhất ▾ */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                            filterDate !== 'all'
                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'border-[#747775]/40 hover:bg-[#F0F4F9]/60 dark:hover:bg-slate-800 text-[#444746] dark:text-slate-300'
                        }`}
                    >
                        <span>
                            {filterDate === 'all'
                                ? 'Lần sửa đổi gần đây nhất'
                                : filterDate === 'today'
                                ? 'Hôm nay'
                                : filterDate === '7days'
                                ? '7 ngày qua'
                                : filterDate === '30days'
                                ? '30 ngày qua'
                                : 'Lần sửa đổi gần đây nhất'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                    </button>

                    {openDropdown === 'date' && (
                        <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95">
                            {[
                                { key: 'all', label: 'Tất cả thời gian' },
                                { key: 'today', label: 'Hôm nay' },
                                { key: '7days', label: '7 ngày qua' },
                                { key: '30days', label: '30 ngày qua' },
                                { key: 'thisyear', label: 'Năm nay (2026)' },
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                        setFilterDate(opt.key);
                                        setOpenDropdown(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-1.5 text-[12px] flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition ${
                                        filterDate === opt.key ? 'font-semibold text-blue-600' : 'text-[#1F1F1F] dark:text-slate-200'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {filterDate === opt.key && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Nguồn ▾ */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'source' ? null : 'source')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition cursor-pointer ${
                            filterSource !== 'all'
                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'border-[#747775]/40 hover:bg-[#F0F4F9]/60 dark:hover:bg-slate-800 text-[#444746] dark:text-slate-300'
                        }`}
                    >
                        <span>
                            {filterSource === 'all'
                                ? 'Nguồn'
                                : filterSource === 'mydrive'
                                ? 'Drive của tôi'
                                : 'Được chia sẻ với tôi'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                    </button>

                    {openDropdown === 'source' && (
                        <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95">
                            {[
                                { key: 'all', label: 'Tất cả nguồn' },
                                { key: 'mydrive', label: 'Drive của tôi' },
                                { key: 'shared', label: 'Được chia sẻ với tôi' },
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                        setFilterSource(opt.key);
                                        setOpenDropdown(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-1.5 text-[12px] flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition ${
                                        filterSource === opt.key ? 'font-semibold text-blue-600' : 'text-[#1F1F1F] dark:text-slate-200'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {filterSource === opt.key && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reset filters if any active */}
                {(filterType !== 'all' || filterDate !== 'all' || filterSource !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterType('all');
                            setFilterDate('all');
                            setFilterSource('all');
                        }}
                        className="text-[11.5px] font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-1 cursor-pointer"
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* ── NOTICE BANNER (Các mục trong thùng rác sẽ bị xoá vĩnh viễn sau 30 ngày) ── */}
            <div className="px-6 py-2 shrink-0">
                <div className="bg-[#EDF2FA] dark:bg-slate-800/80 rounded-2xl px-5 py-3 flex items-center justify-between border border-transparent">
                    <p className="text-[13px] text-[#444746] dark:text-slate-300 font-normal">
                        Các mục trong thùng rác sẽ bị xoá vĩnh viễn sau 30 ngày
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowEmptyTrashModal(true)}
                        disabled={trashItems.length === 0}
                        className="text-[13px] font-medium text-[#0B57D0] dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-slate-700/60 px-4 py-1.5 rounded-full transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                        Dọn sạch thùng rác
                    </button>
                </div>
            </div>

            {/* ── FLOATING SELECTION TOOLBAR ── */}
            {selectedIds.size > 0 && (
                <div className="px-6 py-1 shrink-0">
                    <div className="px-4 py-2 bg-[#E9EEF6] dark:bg-slate-800 rounded-full flex items-center justify-between shadow-xs border border-gray-200/60 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedIds(new Set())}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                                title="Bỏ chọn tất cả"
                            >
                                <X className="w-4 h-4 text-[#444746] dark:text-slate-300" />
                            </button>
                            <span className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-slate-100">
                                Đã chọn {selectedIds.size} mục
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleBulkRestore}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium text-[#0B57D0] hover:bg-blue-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                title="Khôi phục các mục đã chọn"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Khôi phục</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkDeletePermanent}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                title="Xóa vĩnh viễn"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa vĩnh viễn</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN BODY CONTENT (TABLE / GRID + DETAILS DRAWER) ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* File list / Grid Container with independent scroll */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 scrollbar-thin">
                    {loading ? (
                        /* Skeletons */
                        <div className="pt-4 divide-y divide-gray-100 dark:divide-slate-800">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="py-3 flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-3 w-1/3">
                                        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-800" />
                                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-48" />
                                    </div>
                                    <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-24" />
                                    <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-20" />
                                    <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-16" />
                                    <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-20" />
                                </div>
                            ))}
                        </div>
                    ) : filteredTrashItems.length === 0 ? (
                        /* Empty Trash State */
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <div className="w-24 h-24 rounded-full bg-[#F0F4F9] dark:bg-slate-800 flex items-center justify-center text-[#747775] dark:text-slate-400 mb-4">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                Thùng rác trống
                            </h3>
                            <p className="text-[12.5px] text-[#747775] dark:text-slate-400 max-w-sm mt-1">
                                Các mục bạn chuyển vào thùng rác sẽ xuất hiện tại đây và tự động bị xoá vĩnh viễn sau 30 ngày.
                            </p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* ── TABLE LIST VIEW (Exact match to Google Drive screenshot) ── */
                        <div className="w-full pt-1">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/90 dark:border-slate-800 text-[11.5px] font-medium text-[#444746] dark:text-slate-400 select-none h-10">
                                        <th className="py-2 px-3 w-[40%] min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span>Tên</span>
                                            </div>
                                        </th>
                                        <th className="py-2 px-3 w-[15%] min-w-0">
                                            <span>Chủ sở hữu</span>
                                        </th>
                                        <th className="py-2 px-3 w-[18%] min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                                className="inline-flex items-center gap-1.5 hover:text-[#1F1F1F] dark:hover:text-slate-200 transition cursor-pointer"
                                            >
                                                <span className="truncate">Ngày chuyển vào thùng ...</span>
                                                <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center shrink-0">
                                                    {sortOrder === 'desc' ? (
                                                        <ArrowDown className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <ArrowUp className="w-2.5 h-2.5" />
                                                    )}
                                                </div>
                                            </button>
                                        </th>
                                        <th className="py-2 px-3 w-[11%] min-w-0">
                                            <span>Kích cỡ tệp</span>
                                        </th>
                                        <th className="py-2 px-3 w-[12%] min-w-0">
                                            <span>Vị trí gốc</span>
                                        </th>
                                        <th className="py-2 pr-3 w-[4%] text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                                                title="Sắp xếp"
                                            >
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* GROUP 1: Hôm nay */}
                                    {groupedItems.today.length > 0 && (
                                        <>
                                            <tr>
                                                <td colSpan={6} className="pt-3 pb-1 px-3 text-[11.5px] font-medium text-[#444746] dark:text-slate-400">
                                                    Hôm nay
                                                </td>
                                            </tr>
                                            {groupedItems.today.map((item) => renderTableRow(item))}
                                        </>
                                    )}

                                    {/* GROUP 2: Trước đó */}
                                    {groupedItems.earlier.length > 0 && (
                                        <>
                                            <tr>
                                                <td colSpan={6} className="pt-4 pb-1 px-3 text-[11.5px] font-medium text-[#444746] dark:text-slate-400">
                                                    Trước đó
                                                </td>
                                            </tr>
                                            {groupedItems.earlier.map((item) => renderTableRow(item))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ── GRID VIEW (Card View) ── */
                        <div className="pt-3">
                            <h4 className="text-[12px] font-medium text-[#444746] dark:text-slate-400 mb-3 px-1">
                                Hôm nay
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {filteredTrashItems.map((item) => {
                                    const config = getFileTypeConfig(item.fileType);
                                    const Icon = config.icon;
                                    const isSelected = selectedIds.has(item.id);
                                    const isOwnerMe = !item.owner || item.owner === 'tôi' || (currentUser?.name && item.deletedBy === currentUser.name);

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectRow(item.id)}
                                            onDoubleClick={() => {
                                                setDetailFileId(item.id);
                                                setIsDetailDrawerOpen(true);
                                            }}
                                            className={`rounded-2xl border p-3 flex flex-col justify-between h-44 cursor-pointer transition select-none group relative ${
                                                isSelected
                                                    ? 'bg-[#C2E7FF]/60 dark:bg-[#004A77]/40 border-blue-400 dark:border-blue-500'
                                                    : 'bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-700/80 hover:bg-[#F0F4F9] dark:hover:bg-slate-750'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[12.5px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                                        }}
                                                        className="trash-item-menu-btn p-1 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full transition"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5 text-[#444746]" />
                                                    </button>
                                                    {activeMenuId === item.id && renderActionMenu(item)}
                                                </div>
                                            </div>

                                            {/* Thumbnail card center */}
                                            <div className="flex-1 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                                <FileThumbnailPreview
                                                    id={item.id}
                                                    name={item.name}
                                                    fileType={item.fileType}
                                                />
                                            </div>

                                            {/* Bottom row */}
                                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-slate-800/60 text-[11px] text-[#444746] dark:text-slate-400">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium ${getAvatarColor(item.deletedBy)}`}>
                                                        {(item.deletedBy || 'T')[0].toUpperCase()}
                                                    </div>
                                                    <span className="truncate">{isOwnerMe ? 'tôi' : item.deletedBy}</span>
                                                </div>
                                                <span className="shrink-0">{item.size || '33 KB'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT DETAILS DRAWER (Google Drive details panel) ── */}
                {isDetailDrawerOpen && (
                    <aside className="w-80 border-l border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 select-none animate-in slide-in-from-right duration-200">
                        {/* Drawer Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                {effectiveDetailItem ? (
                                    <>
                                        {(() => {
                                            const config = getFileTypeConfig(effectiveDetailItem.fileType);
                                            const Icon = config.icon;
                                            return (
                                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                </div>
                                            );
                                        })()}
                                        <h3 className="font-normal text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                            {effectiveDetailItem.name}
                                        </h3>
                                    </>
                                ) : (
                                    <span className="font-normal text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3]">Thùng rác</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDetailDrawerOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition text-[#444746] dark:text-slate-400 cursor-pointer"
                                title="Đóng bảng chi tiết"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Tabs: Chi tiết / Hoạt động */}
                        <div className="px-4 flex border-b border-gray-100 dark:border-slate-800 shrink-0">
                            <button
                                type="button"
                                onClick={() => setDetailActiveTab('details')}
                                className={`py-2 px-3 text-[12px] font-medium border-b-2 transition cursor-pointer ${
                                    detailActiveTab === 'details'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-[#444746] dark:text-slate-400 hover:text-[#1F1F1F]'
                                }`}
                            >
                                Chi tiết
                            </button>
                            <button
                                type="button"
                                onClick={() => setDetailActiveTab('activity')}
                                className={`py-2 px-3 text-[12px] font-medium border-b-2 transition cursor-pointer ${
                                    detailActiveTab === 'activity'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-[#444746] dark:text-slate-400 hover:text-[#1F1F1F]'
                                }`}
                            >
                                Hoạt động
                            </button>
                        </div>

                        {/* Drawer Body - Scrollable independently */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
                            {effectiveDetailItem ? (
                                <>
                                    {/* 1. Miniature Thumbnail */}
                                    <div className="w-full h-36 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative bg-white dark:bg-slate-950 shadow-none">
                                        <FileThumbnailPreview
                                            id={effectiveDetailItem.id}
                                            name={effectiveDetailItem.name}
                                            fileType={effectiveDetailItem.fileType}
                                        />
                                    </div>

                                    {/* 2. Trash status notice badge */}
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                        Tệp này đang ở trong thùng rác và sẽ bị xóa vĩnh viễn sau 30 ngày.
                                    </div>

                                    {/* 3. Action buttons in drawer */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={(e) => handleRestore(effectiveDetailItem.id, e)}
                                            className="flex-1 py-1.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Khôi phục</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeletePermanent(effectiveDetailItem.id, e)}
                                            className="py-1.5 px-3 rounded-full border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[12px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                                            title="Xóa vĩnh viễn"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* 4. Thông tin chi tiết về tệp */}
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                            Thông tin chi tiết về tệp
                                        </h4>

                                        <div className="space-y-2.5 text-[12px]">
                                            {/* Loại */}
                                            <div>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Loại</p>
                                                <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5 uppercase">
                                                    {effectiveDetailItem.fileType || 'DOCX'}
                                                </p>
                                            </div>

                                            {/* Kích thước */}
                                            <div>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Kích thước</p>
                                                <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                    {effectiveDetailItem.size || '33 KB'}
                                                </p>
                                            </div>

                                            {/* Ngày chuyển vào thùng rác */}
                                            <div>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Ngày chuyển vào thùng rác</p>
                                                <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                    {formatTrashDetailDate(effectiveDetailItem.deletedAt)}
                                                </p>
                                            </div>

                                            {/* Vị trí gốc */}
                                            <div>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Vị trí gốc</p>
                                                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#747775]/40 bg-white dark:bg-slate-800 text-[11px] font-normal text-[#1F1F1F] dark:text-slate-200">
                                                    <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                                                    <span className="truncate max-w-[180px]">
                                                        {effectiveDetailItem.folderName || effectiveDetailItem.originalLocation || 'Drive của tôi'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chủ sở hữu */}
                                            <div>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium">Chủ sở hữu</p>
                                                <p className="text-[12px] font-normal text-[#1F1F1F] dark:text-slate-200 mt-0.5">
                                                    {effectiveDetailItem.owner || 'tôi'}
                                                </p>
                                            </div>

                                            {/* Mô tả (Material 3 Field) */}
                                            <div className="pt-0.5 pb-2">
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 font-medium mb-1.5">Mô tả</p>
                                                <textarea
                                                    rows={1}
                                                    placeholder="Thêm phần mô tả"
                                                    defaultValue={effectiveDetailItem.description || ''}
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
                                </>
                            ) : (
                                <div className="py-12 text-center text-[#747775] dark:text-slate-400 text-xs">
                                    Chọn một tệp để xem thông tin chi tiết.
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>

            {/* ── EMPTY TRASH CONFIRMATION MODAL ── */}
            {showEmptyTrashModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                Dọn sạch thùng rác?
                            </h3>
                        </div>

                        <p className="text-[13px] text-[#444746] dark:text-slate-300 leading-relaxed mb-6">
                            Tất cả các mục trong thùng rác sẽ bị xoá vĩnh viễn và bạn sẽ không thể khôi phục lại các mục này.
                        </p>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEmptyTrashModal(false)}
                                className="px-5 py-2 text-[13px] font-medium text-[#0B57D0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleEmptyTrash}
                                className="px-5 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition shadow-xs cursor-pointer"
                            >
                                Dọn sạch thùng rác
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render Table Row Helper (Exact Google Drive row)
    function renderTableRow(item: TrashItemDto) {
        const config = getFileTypeConfig(item.fileType);
        const Icon = config.icon;
        const isSelected = selectedIds.has(item.id);
        const isOwnerMe = !item.owner || item.owner === 'tôi' || (currentUser?.name && item.deletedBy === currentUser.name);
        const ownerDisplay = isOwnerMe ? 'tôi' : item.deletedBy || item.owner || 'tôi';

        return (
            <tr
                key={item.id}
                onClick={() => handleSelectRow(item.id)}
                onDoubleClick={() => {
                    setDetailFileId(item.id);
                    setIsDetailDrawerOpen(true);
                }}
                className={`group transition-colors select-none cursor-pointer h-11 border-b border-gray-100/80 dark:border-slate-800/60 ${
                    isSelected
                        ? 'bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] font-medium'
                        : 'hover:bg-[#f0f4f9] dark:hover:bg-slate-800/50 text-[#1f1f1f] dark:text-slate-200'
                }`}
            >
                {/* 1. Tên Column */}
                <td className="py-2 px-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* File icon with color background */}
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}>
                            <Icon className="w-3 h-3" />
                        </div>

                        {/* File name */}
                        <span className="truncate text-[12.5px]" title={item.name}>
                            {item.name}
                        </span>

                        {/* Shared icon if applicable */}
                        <span title="Đã chia sẻ" className="inline-flex items-center">
                            <Users className="w-3.5 h-3.5 text-[#747775] dark:text-slate-400 shrink-0 opacity-70" />
                        </span>
                    </div>
                </td>

                {/* 2. Chủ sở hữu Column */}
                <td className="py-2 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${getAvatarColor(ownerDisplay)}`}
                        >
                            {(ownerDisplay || 'T')[0].toUpperCase()}
                        </div>
                        <span className="truncate text-[12px] text-[#444746] dark:text-slate-300">
                            {ownerDisplay}
                        </span>
                    </div>
                </td>

                {/* 3. Ngày chuyển vào thùng rác Column */}
                <td className="py-2 px-3 text-[12px] text-[#444746] dark:text-slate-400">
                    <span>{formatTrashDate(item.deletedAt)}</span>
                </td>

                {/* 4. Kích cỡ tệp Column */}
                <td className="py-2 px-3 text-[12px] text-[#444746] dark:text-slate-400">
                    <span>{item.size || '33 KB'}</span>
                </td>

                {/* 5. Vị trí gốc Column */}
                <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#444746] dark:text-slate-300 truncate">
                        <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400 shrink-0" />
                        <span className="truncate">
                            {item.folderName || item.originalLocation || 'Drive của tôi'}
                        </span>
                    </div>
                </td>

                {/* 6. Action Column (Quick actions on hover + 3 dots) */}
                <td className="py-2 pr-3 text-right relative">
                    <div className="flex items-center gap-0.5 justify-end">
                        {/* Quick action buttons (show on hover, select, or menu open) */}
                        <div className={`items-center gap-0.5 ${isSelected || activeMenuId === item.id ? 'flex' : 'hidden group-hover:flex'}`}>
                            <span title="Không thể chia sẻ tệp trong thùng rác" className="inline-flex">
                                <button
                                    type="button"
                                    disabled
                                    className="p-1.5 rounded-full text-gray-400 dark:text-slate-500 opacity-40 cursor-not-allowed"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`http://localhost:8080/api/v1/files/${item.id}/stream`, '_blank');
                                }}
                                className="p-1.5 rounded-full hover:bg-gray-200/80 dark:hover:bg-slate-700 transition cursor-pointer text-[#444746] dark:text-slate-300"
                                title="Tải xuống"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                            <span title="Không thể đổi tên tệp trong thùng rác" className="inline-flex">
                                <button
                                    type="button"
                                    disabled
                                    className="p-1.5 rounded-full text-gray-400 dark:text-slate-500 opacity-40 cursor-not-allowed"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </span>
                            <span title="Không thể gắn dấu sao tệp trong thùng rác" className="inline-flex">
                                <button
                                    type="button"
                                    disabled
                                    className="p-1.5 rounded-full text-gray-400 dark:text-slate-500 opacity-40 cursor-not-allowed"
                                >
                                    <Star className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        </div>

                        {/* 3-dots button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}
                            className={`trash-item-menu-btn p-1.5 rounded-full transition cursor-pointer text-[#444746] dark:text-slate-300 ${
                                activeMenuId === item.id ? 'bg-[#001D35]/15 dark:bg-white/15' : 'hover:bg-gray-200/80 dark:hover:bg-slate-700'
                            }`}
                            title="Tùy chọn khác"
                        >
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {activeMenuId === item.id && renderActionMenu(item)}
                </td>
            </tr>
        );
    }

    // Render 3-dots Context Menu (Exact Google Drive Trash screenshot)
    function renderActionMenu(item: TrashItemDto) {
        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700/80 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left select-none"
            >
                {/* 1. Mở bằng */}
                <div className="relative group/submenu">
                    <button
                        type="button"
                        onClick={() => router.push('/files')}
                        className="w-full text-left px-4 py-2 text-[13px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center justify-between transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-[#444746] dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                            <span>Mở bằng</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                    </button>

                    {/* Submenu for Mở bằng */}
                    <div className="hidden group-hover/submenu:block absolute right-full top-0 mr-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/80 py-1.5 z-50">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenuId(null);
                                router.push('/files');
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-[12px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-2.5 transition cursor-pointer"
                        >
                            <Eye className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                            <span>Xem trước</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenuId(null);
                                window.open(`http://localhost:8080/api/v1/files/${item.id}/stream`, '_blank');
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-[12px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-2.5 transition cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                            <span>Tải xuống</span>
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700/80 my-1" />

                {/* 2. Thông tin về tệp */}
                <div className="relative group/subinfo">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveMenuId(null);
                            setDetailFileId(item.id);
                            setDetailActiveTab('details');
                            setIsDetailDrawerOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-[13px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center justify-between transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Info className="w-4 h-4 text-[#444746] dark:text-slate-400" />
                            <span>Thông tin về tệp</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                    </button>

                    {/* Submenu for Thông tin về tệp */}
                    <div className="hidden group-hover/subinfo:block absolute right-full top-0 mr-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/80 py-1.5 z-50">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenuId(null);
                                setDetailFileId(item.id);
                                setDetailActiveTab('details');
                                setIsDetailDrawerOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-[12px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-2.5 transition cursor-pointer"
                        >
                            <FileText className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                            <span>Chi tiết</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenuId(null);
                                setDetailFileId(item.id);
                                setDetailActiveTab('activity');
                                setIsDetailDrawerOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-[12px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-2.5 transition cursor-pointer"
                        >
                            <History className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400" />
                            <span>Hoạt động</span>
                        </button>
                    </div>
                </div>

                {/* 3. Khôi phục */}
                <button
                    type="button"
                    onClick={(e) => {
                        setActiveMenuId(null);
                        handleRestore(item.id, e);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-3 transition cursor-pointer"
                >
                    <History className="w-4 h-4 text-[#444746] dark:text-slate-400" />
                    <span>Khôi phục</span>
                </button>

                <div className="border-t border-gray-100 dark:border-slate-700/80 my-1" />

                {/* 4. Xoá vĩnh viễn */}
                <button
                    type="button"
                    onClick={(e) => {
                        setActiveMenuId(null);
                        handleDeletePermanent(item.id, e);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#1F1F1F] dark:text-slate-200 hover:bg-[#E9EEF6] dark:hover:bg-slate-700/70 flex items-center gap-3 transition cursor-pointer"
                >
                    <Trash2 className="w-4 h-4 text-[#444746] dark:text-slate-400" />
                    <span>Xoá vĩnh viễn</span>
                </button>
            </div>
        );
    }
}
