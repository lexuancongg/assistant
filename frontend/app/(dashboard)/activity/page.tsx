'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Check,
    List,
    LayoutGrid,
    Info,
    Share2,
    Users,
    FileSpreadsheet,
    FileText,
    FileCode,
    FileBox,
    Presentation,
    Video,
    Archive,
    Image as ImageIcon,
    Headphones,
    Folder,
    ExternalLink,
    MoreVertical,
    Download,
    Clock,
    X,
    RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import activityService, { ActivityLogDto } from '@/services/activity/activityService';
import accessRequestService, { AccessRequestDto } from '@/services/access/accessRequestService';
import { WsNotification } from '@/hooks/useWebSocketNotification';
import FileThumbnailPreview from '@/components/files/FileThumbnailPreview';

// Unified Activity Item interface
interface UnifiedActivityItem {
    id: string;
    rawId: string | number;
    kind: 'LOG' | 'REQUEST' | 'REALTIME';
    name: string;
    fileId?: string | number | null;
    fileType?: string | null;
    actionText: string;
    actorName: string;
    ownerName: string;
    location: string;
    timestamp: string;
    rawTime: number;
    accessRequest?: AccessRequestDto;
}

// Visual configuration helper matching Home page & Google Drive
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
        color: 'text-gray-600 dark:text-slate-400',
        bgColor: 'bg-gray-100 dark:bg-slate-800',
        category: 'Files',
    };
}

function getAvatarColor(name?: string) {
    const colors = [
        'bg-[#0b57d0]',
        'bg-[#7c3aed]',
        'bg-[#0891b2]',
        'bg-[#059669]',
        'bg-[#d97706]',
        'bg-[#e11d48]',
        'bg-[#4f46e5]',
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Format date matching Home format: e.g. "19 thg 9" or "28/09/2026"
function formatDriveDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return dateStr;
    }
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} thg ${month}`;
}

export default function ActivityPage() {
    usePageBreadcrumb(['Activity']);
    const router = useRouter();

    const [logs, setLogs] = useState<ActivityLogDto[]>([]);
    const [requests, setRequests] = useState<AccessRequestDto[]>([]);
    const [liveNotifs, setLiveNotifs] = useState<WsNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);
    const [processingRequestId, setProcessingRequestId] = useState<string | number | null>(null);
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

    // Current user state
    const [currentUser, setCurrentUser] = useState({ name: 'Lê Xuân Công', email: 'admin@enterprise.ai' });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.name || parsed.email) {
                        setCurrentUser({
                            name: parsed.name || 'Lê Xuân Công',
                            email: parsed.email || 'admin@enterprise.ai',
                        });
                    }
                } catch {}
            }
            const authUsername = window.localStorage.getItem('authUsername');
            if (authUsername) {
                setCurrentUser((prev) => ({ ...prev, email: authUsername }));
            }
        }
    }, []);

    const isMe = (nameOrEmail?: string) => {
        if (!nameOrEmail) return true;
        const raw = nameOrEmail.trim().toLowerCase();
        if (raw === 'tôi' || raw === 'me' || raw === 'bạn' || raw === 'you') return true;

        const curEmail = (currentUser?.email || '').trim().toLowerCase();
        const curName = (currentUser?.name || '').trim().toLowerCase();
        const authUser = (typeof window !== 'undefined' ? window.localStorage.getItem('authUsername') || '' : '').trim().toLowerCase();

        if (curEmail && (raw === curEmail || raw.includes(curEmail) || curEmail.startsWith(raw) || curEmail.includes(raw))) return true;
        if (authUser && (raw === authUser || raw.includes(authUser) || authUser.startsWith(raw) || authUser.includes(raw))) return true;
        if (curName && (raw === curName || raw.includes(curName) || curName.includes(raw))) return true;
        if (raw.includes('lê xuân công') || raw.includes('admin') || raw.includes('cong')) return true;

        return false;
    };

    // Mặc định hiển thị danh sách (list), đồng bộ với localStorage nếu có
    useEffect(() => {
        try {
            const saved = localStorage.getItem('activity_view_mode') as 'list' | 'grid' | null;
            if (saved === 'list' || saved === 'grid') {
                setViewMode(saved);
            } else {
                setViewMode('list');
            }
        } catch {
            setViewMode('list');
        }
    }, []);

    const handleChangeViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        try {
            localStorage.setItem('activity_view_mode', mode);
        } catch {}
    };

    // Load logs and pending requests
    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsData, reqsData] = await Promise.all([
                activityService.getActivityLogs().catch(() => []),
                accessRequestService.getPendingRequests().catch(() => []),
            ]);
            setLogs(logsData);
            setRequests(reqsData);
        } catch (err) {
            console.error('Failed to load activity data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // WebSocket real-time updates
    useEffect(() => {
        const handleWs = (e: any) => {
            const notif: WsNotification = e.detail;
            setLiveNotifs((prev) => [notif, ...prev.slice(0, 29)]);
        };
        window.addEventListener('new_ws_notification', handleWs);
        return () => window.removeEventListener('new_ws_notification', handleWs);
    }, []);

    // Close action menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.action-menu-container')) {
                setActiveActionMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle Access Request approval
    const handleApprove = async (id: string | number, name: string) => {
        setProcessingRequestId(id);
        try {
            await accessRequestService.approveRequest(id);
            toast.success(`Đã cấp quyền cho ${name}`);
            setRequests((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
        } catch {
            toast.error('Không thể phê duyệt yêu cầu');
        } finally {
            setProcessingRequestId(null);
        }
    };

    // Handle Access Request rejection
    const handleReject = async (id: string | number, name: string) => {
        setProcessingRequestId(id);
        try {
            await accessRequestService.rejectRequest(id);
            toast.success(`Đã từ chối yêu cầu của ${name}`);
            setRequests((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
        } catch {
            toast.error('Không thể từ chối yêu cầu');
        } finally {
            setProcessingRequestId(null);
        }
    };

    // Merge and unify items into Google Drive format
    const unifiedItems: UnifiedActivityItem[] = useMemo(() => {
        const result: UnifiedActivityItem[] = [];

        // 1. Pending Access Requests (Notifications)
        requests.forEach((req) => {
            const date = new Date(req.createdAt || Date.now());
            const reqLocation = req.folderName || (req.fileName ? 'Kho tài liệu' : 'Kho của tôi');
            const isReqMe = isMe(req.requesterName);
            const reqName = isReqMe ? 'Bạn' : (req.requesterName?.includes('@') ? req.requesterName.split('@')[0] : (req.requesterName || 'Người dùng'));
            const owner = isReqMe ? 'tôi' : reqName;

            result.push({
                id: `req-${req.id}`,
                rawId: req.id,
                kind: 'REQUEST',
                name: req.fileName || req.folderName || 'Tài liệu cần duyệt',
                fileId: req.fileId,
                fileType: req.folderId ? 'folder' : 'file',
                actionText: `${reqName} yêu cầu quyền ${req.requestedLevel === 'EDITOR' ? 'Chỉnh sửa' : 'Xem'}`,
                actorName: reqName,
                ownerName: owner,
                location: reqLocation,
                timestamp: formatDriveDate(req.createdAt),
                rawTime: date.getTime(),
                accessRequest: req,
            });
        });

        // 2. Real-time notifications
        liveNotifs.forEach((notif) => {
            const date = new Date(notif.timestamp || Date.now());
            const isUploaderMe = isMe(notif.uploaderName);
            const actor = isUploaderMe ? 'Bạn' : (notif.uploaderName?.includes('@') ? notif.uploaderName.split('@')[0] : (notif.uploaderName || 'Người dùng'));
            const owner = isUploaderMe ? 'tôi' : actor;

            result.push({
                id: `ws-${notif.id}`,
                rawId: notif.id,
                kind: 'REALTIME',
                name: notif.fileName || 'Tài liệu mới',
                fileId: notif.fileId,
                fileType: 'file',
                actionText: `${actor} đã chia sẻ`,
                actorName: actor,
                ownerName: owner,
                location: notif.folderName || 'Shared with me',
                timestamp: formatDriveDate(date.toISOString()),
                rawTime: date.getTime(),
            });
        });

        // 3. Activity Logs from backend
        logs.forEach((log) => {
            let actionLabel = 'đã thao tác';
            const logType = (log.type || '').toLowerCase();
            if (logType === 'upload') {
                actionLabel = 'đã tải lên';
            } else if (logType === 'share') {
                actionLabel = 'đã chia sẻ';
            } else if (logType === 'delete') {
                actionLabel = 'đã xóa tệp';
            } else if (logType === 'download') {
                actionLabel = 'đã tải xuống';
            } else if (logType === 'update') {
                actionLabel = 'đã sửa đổi';
            } else if (log.action) {
                actionLabel = log.action;
            }

            const rawTime = log.timestamp ? new Date(log.timestamp).getTime() : 0;
            const isActorMe = isMe(log.actorName);
            const actor = isActorMe ? 'Bạn' : (log.actorName?.includes('@') ? log.actorName.split('@')[0] : (log.actorName || 'Bạn'));

            const isOwnerMe = isMe(log.ownerName || log.actorName);
            const owner = isOwnerMe ? 'tôi' : (log.ownerName?.includes('@') ? log.ownerName.split('@')[0] : (log.ownerName || 'tôi'));

            result.push({
                id: `log-${log.id}`,
                rawId: log.id,
                kind: 'LOG',
                name: log.targetName || 'Tài liệu không tên',
                fileId: log.fileId,
                fileType: log.fileType,
                actionText: `${actor} ${actionLabel}`,
                actorName: actor,
                ownerName: owner,
                location: log.location || (log.type === 'share' ? 'Shared with me' : 'Drive của tôi'),
                timestamp: formatDriveDate(log.timestamp),
                rawTime: isNaN(rawTime) ? 0 : rawTime,
            });
        });

        // Sort descending by time
        return result.sort((a, b) => b.rawTime - a.rawTime);
    }, [requests, liveNotifs, logs, currentUser]);

    const handleOpenFile = (item: UnifiedActivityItem) => {
        if (item.fileId) {
            router.push('/files');
        } else {
            router.push('/files');
        }
    };

    return (
        <div className="flex-1 h-full bg-white dark:bg-[#0B1120] text-gray-900 dark:text-slate-100 flex flex-col overflow-hidden">
            {/* 1. Header: Title and Info Button matching Home */}
            <div className="px-6 pt-3 pb-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-[20px] font-normal text-[#1f1f1f] dark:text-slate-100 tracking-normal select-none">
                        Activity
                    </h1>
                    <button
                        type="button"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        className={`p-1.5 rounded-full transition cursor-pointer ${
                            showInfoPanel
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                        title="Chi tiết & Hoạt động"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area matching Home style */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8">
                    <div>
                        {/* Section Header: Title & List/Grid switcher identical to Home's Tệp đề xuất */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1f1f1f] dark:text-slate-200 select-none">
                                <span>Hoạt động</span>
                            </div>

                            {/* View Switcher: List vs Grid - Pill shape matching Home */}
                            <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-full p-0.5 bg-white dark:bg-slate-900 shadow-2xs h-6">
                                <button
                                    type="button"
                                    onClick={() => handleChangeViewMode('list')}
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
                                    onClick={() => handleChangeViewMode('grid')}
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

                        {loading ? (
                            /* Loading Skeletons matching Home */
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
                        ) : unifiedItems.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 text-xs">
                                Không tìm thấy hoạt động nào.
                            </div>
                        ) : viewMode === 'list' ? (
                            /* TABLE LIST VIEW (Exact match to Home's table in media_1791092126303.png) */
                            <div className="w-full">
                                <table className="w-full table-fixed text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200/80 dark:border-slate-800 text-[11.5px] font-medium text-[#444746] dark:text-slate-400 select-none h-9">
                                            <th className="py-2 px-3 w-[34%] min-w-0">Tên</th>
                                            <th className="py-2 px-3 w-[28%] min-w-0">Hành động</th>
                                            <th className="py-2 px-3 w-[15%] min-w-0">Chủ sở hữu</th>
                                            <th className="py-2 px-3 w-[15%] min-w-0">Vị trí</th>
                                            <th className="py-2 pr-3 w-[8%] text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/80 dark:divide-slate-800/60 text-[12.5px]">
                                        {unifiedItems.slice(0, visibleCount).map((item) => {
                                            const ext = (item.fileType || item.name.split('.').pop() || '').toLowerCase();
                                            const config = getFileTypeConfig(ext);
                                            const Icon = config.icon;
                                            const isOwnerMe = item.ownerName === 'tôi' || isMe(item.ownerName);
                                            const ownerDisplay = isOwnerMe ? 'tôi' : (item.ownerName ? (item.ownerName.includes('@') ? item.ownerName.split('@')[0] : item.ownerName) : 'tôi');
                                            const avatarClass = isOwnerMe ? 'bg-[#0b57d0] text-white' : getAvatarColor(ownerDisplay);
                                            const initial = isOwnerMe
                                                ? (currentUser?.name ? currentUser.name.trim()[0].toUpperCase() : 't')
                                                : (ownerDisplay ? ownerDisplay.trim()[0].toUpperCase() : 'U');

                                            return (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => handleOpenFile(item)}
                                                    className="group transition-colors select-none cursor-pointer h-11 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/50 text-[#1f1f1f] dark:text-slate-200"
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
                                                                title={item.name}
                                                            >
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 2. Hành động Column */}
                                                    <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                        <span
                                                            className="truncate block text-[11.5px]"
                                                            title={`${item.actionText}${item.timestamp ? ` • ${item.timestamp}` : ''}`}
                                                        >
                                                            {item.actionText}
                                                            {item.timestamp && ` • ${item.timestamp}`}
                                                        </span>
                                                    </td>

                                                    {/* 3. Chủ sở hữu Column */}
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

                                                    {/* 4. Vị trí Column */}
                                                    <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                        <div
                                                            className="flex items-center gap-1.5 truncate text-[11.5px]"
                                                            title={item.location}
                                                        >
                                                            <Folder className="w-3.5 h-3.5 text-[#444746] dark:text-slate-400 fill-[#444746]/20 shrink-0" />
                                                            <span className="truncate">{item.location}</span>
                                                        </div>
                                                    </td>

                                                    {/* 5. Menu Action Column */}
                                                    <td className="py-2 pr-3 text-right">
                                                        <div className="flex items-center justify-end gap-0.5">
                                                            {/* Quick Approve/Reject for requests */}
                                                            {item.kind === 'REQUEST' && item.accessRequest && (
                                                                <div
                                                                    className="flex items-center gap-1 mr-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        disabled={processingRequestId === item.rawId}
                                                                        onClick={() => handleReject(item.rawId, item.actorName)}
                                                                        className="p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                                                        title="Từ chối yêu cầu"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={processingRequestId === item.rawId}
                                                                        onClick={() => handleApprove(item.rawId, item.actorName)}
                                                                        className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-2xs cursor-pointer"
                                                                        title="Duyệt quyền"
                                                                    >
                                                                        {processingRequestId === item.rawId ? (
                                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Check className="w-3 h-3 stroke-[2.5]" />
                                                                        )}
                                                                        Duyệt
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Quick hover action buttons */}
                                                            <div
                                                                className="items-center gap-0.5 transition-opacity hidden group-hover:flex"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {item.fileId && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const url = `http://localhost:8080/api/v1/files/${item.fileId}/stream`;
                                                                            const a = document.createElement('a');
                                                                            a.href = url;
                                                                            a.download = item.name;
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
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(
                                                                            window.location.origin +
                                                                                (item.fileId ? '/files' : '/files')
                                                                        );
                                                                        toast.success('Đã sao chép liên kết tệp!');
                                                                    }}
                                                                    className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
                                                                    title="Sao chép đường dẫn"
                                                                >
                                                                    <Share2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>

                                                            {/* 3 dots icon */}
                                                            <div className="relative action-menu-container" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setActiveActionMenuId(
                                                                            activeActionMenuId === item.id ? null : item.id
                                                                        )
                                                                    }
                                                                    className="menu-trigger-btn p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                                                                    title="Tùy chọn khác"
                                                                >
                                                                    <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                                </button>

                                                                {activeActionMenuId === item.id && (
                                                                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800 py-1.5 z-30 text-left text-xs">
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveActionMenuId(null);
                                                                                handleOpenFile(item);
                                                                            }}
                                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                            Mở tệp
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveActionMenuId(null);
                                                                                navigator.clipboard.writeText(
                                                                                    window.location.origin +
                                                                                        (item.fileId ? '/files' : '/files')
                                                                                );
                                                                                toast.success('Đã sao chép liên kết tệp!');
                                                                            }}
                                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer"
                                                                        >
                                                                            <Share2 className="w-3.5 h-3.5" />
                                                                            Sao chép đường dẫn
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Xem thêm button matching Home */}
                                {unifiedItems.length > visibleCount && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setVisibleCount((prev) => prev + 15)}
                                            className="text-[12px] font-medium text-[#0b57d0] dark:text-blue-400 hover:underline cursor-pointer py-1"
                                        >
                                            Xem thêm
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* GRID VIEW matching Home's grid cards */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
                                {unifiedItems.slice(0, visibleCount).map((item) => {
                                    const ext = (item.fileType || item.name.split('.').pop() || '').toLowerCase();
                                    const config = getFileTypeConfig(ext);
                                    const Icon = config.icon;
                                    const isOwnerMe = item.ownerName === 'tôi' || isMe(item.ownerName);
                                    const ownerDisplay = isOwnerMe ? 'tôi' : (item.ownerName ? (item.ownerName.includes('@') ? item.ownerName.split('@')[0] : item.ownerName) : 'tôi');
                                    const avatarClass = isOwnerMe ? 'bg-[#0b57d0] text-white' : getAvatarColor(ownerDisplay);
                                    const initial = isOwnerMe
                                        ? (currentUser?.name ? currentUser.name.trim()[0].toUpperCase() : 't')
                                        : (ownerDisplay ? ownerDisplay.trim()[0].toUpperCase() : 'U');

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleOpenFile(item)}
                                            className="rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 group relative shadow-2xs cursor-pointer select-none bg-[#f0f4f9] hover:bg-[#e6edf7] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200/90 dark:hover:border-slate-700/80"
                                        >
                                            <div>
                                                {/* Top: Icon + Title + Menu */}
                                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                        <div
                                                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate cursor-pointer hover:underline"
                                                            title={item.name}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenFile(item);
                                                        }}
                                                        className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                                                        title="Tùy chọn khác"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5 pointer-events-none" />
                                                    </button>
                                                </div>

                                                {/* Preview box */}
                                                <div
                                                    className="w-full h-32 my-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition relative"
                                                    title={`Xem trước: ${item.name}`}
                                                >
                                                    <FileThumbnailPreview
                                                        id={item.fileId || undefined}
                                                        name={item.name}
                                                        fileType={item.fileType}
                                                    />
                                                </div>
                                            </div>

                                            {/* Bottom Information: Google Drive single-line style */}
                                            <div className="mt-1 flex items-center gap-2 min-w-0">
                                                <div
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs ${avatarClass}`}
                                                >
                                                    {initial}
                                                </div>
                                                <span
                                                    className="text-[11px] text-gray-600 dark:text-slate-300 truncate"
                                                    title={`${item.actionText}${item.timestamp ? ` • ${item.timestamp}` : ''}`}
                                                >
                                                    {item.actionText}{item.timestamp ? ` • ${item.timestamp}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Details / Info Panel (Collapsible) matching Home */}
                {showInfoPanel && (
                    <div className="w-[320px] bg-white dark:bg-[#1E1F20] border-l border-[#E0E2E0]/70 dark:border-slate-800 flex flex-col shrink-0 h-full shadow-none z-20 overflow-hidden animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-[#E0E2E0]/70 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
                            <h3 className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                Chi tiết hoạt động
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowInfoPanel(false)}
                                className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                                title="Đóng bảng chi tiết"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                                    <span className="text-gray-500">Tổng số hoạt động:</span>
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {unifiedItems.length}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                                    <span className="text-gray-500">Yêu cầu quyền chờ duyệt:</span>
                                    <span className="font-semibold text-amber-600">{requests.length}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                                    <span className="text-gray-500">Thao tác tải lên & cập nhật:</span>
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {logs.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
