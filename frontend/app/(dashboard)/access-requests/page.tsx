'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
    KeyRound,
    Check,
    X,
    CheckCircle2,
    XCircle,
    Folder,
    FileSpreadsheet,
    FileText,
    Presentation,
    Archive,
    Image as ImageIcon,
    FileBox,
    ExternalLink,
    Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import accessRequestService, { AccessRequestDto } from '@/services/access/accessRequestService';

// File Type visual configuration matching Google Drive style
function getFileTypeConfig(extOrType: string, isFolder = false) {
    if (isFolder) {
        return {
            icon: Folder,
            color: 'text-[#444746] dark:text-slate-300',
            bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
            category: 'Thư mục',
        };
    }

    const ext = (extOrType || '').toLowerCase().replace(/^\./, '');

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-[#0f9d58] dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
            category: 'Bảng tính',
        };
    }
    if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-[#1a73e8] dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
            category: 'Tài liệu',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-[#f29900] dark:text-amber-400',
            bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
            category: 'Trình bày',
        };
    }
    if (ext === 'pdf') {
        return {
            icon: FileText,
            color: 'text-[#ea4335] dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
            category: 'PDF',
        };
    }

    return {
        icon: FileBox,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
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
    const safeStr = identifier || 'user';
    for (let i = 0; i < safeStr.length; i++) {
        hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Format date into human-friendly Vietnamese string
function formatRequestDate(dateStr?: string): string {
    if (!dateStr) return 'Vừa xong';
    try {
        let d: Date;
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ')[0].split('/');
            d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
            d = new Date(dateStr);
        }
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
        return dateStr;
    }
}

function AccessRequestsContent() {
    usePageBreadcrumb(['Bảo mật & Quản trị', 'Yêu cầu quyền truy cập']);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'my'>('pending');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

    const [pendingRequests, setPendingRequests] = useState<AccessRequestDto[]>([]);
    const [allRequests, setAllRequests] = useState<AccessRequestDto[]>([]);
    const [myRequests, setMyRequests] = useState<AccessRequestDto[]>([]);

    const [selectedRequest, setSelectedRequest] = useState<AccessRequestDto | null>(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);

    // Fetch data from real backend
    const loadRequests = async () => {
        setLoading(true);
        try {
            const [pending, all, my] = await Promise.all([
                accessRequestService.getPendingRequests().catch(() => []),
                accessRequestService.getAllRequests().catch(() => []),
                accessRequestService.getMyRequests().catch(() => []),
            ]);

            setPendingRequests(pending);
            setAllRequests(all);
            setMyRequests(my);

            // Auto-select first pending request if any
            if (pending.length > 0 && !selectedRequest) {
                setSelectedRequest(pending[0]);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách yêu cầu quyền:', err);
            toast.error('Không thể tải danh sách yêu cầu quyền truy cập');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // Filter requests according to tab and status filter
    const currentList = useMemo(() => {
        let base: AccessRequestDto[] = [];
        if (activeTab === 'pending') {
            base = pendingRequests;
        } else if (activeTab === 'all') {
            base = allRequests;
        } else {
            base = myRequests;
        }

        return base.filter((r) => {
            // Filter by status if tab is 'all' or 'my'
            if (activeTab !== 'pending' && statusFilter !== 'ALL' && r.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [activeTab, statusFilter, pendingRequests, allRequests, myRequests]);

    // Handle Approve Request
    const handleApprove = async (request: AccessRequestDto, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setActionLoadingId(request.id);
        try {
            await accessRequestService.approveRequest(request.id);
            toast.success(`Đã phê duyệt quyền ${request.requestedLevel} cho ${request.requesterName}`);
            await loadRequests();
            if (selectedRequest?.id === request.id) {
                setSelectedRequest((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
            }
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi khi phê duyệt yêu cầu');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Reject Request
    const handleReject = async (request: AccessRequestDto, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setActionLoadingId(request.id);
        try {
            await accessRequestService.rejectRequest(request.id);
            toast.success(`Đã từ chối yêu cầu cấp quyền của ${request.requesterName}`);
            await loadRequests();
            if (selectedRequest?.id === request.id) {
                setSelectedRequest((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
            }
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi khi từ chối yêu cầu');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] bg-white dark:bg-slate-900 font-sans select-none overflow-hidden">
            {/* ── ROW 1: GOOGLE DRIVE STYLE TITLE ── */}
            <div className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
                <h1 className="text-[22px] font-normal text-[#1F1F1F] dark:text-slate-100">
                    Yêu cầu quyền truy cập
                </h1>
            </div>

            {/* ── ROW 2: GOOGLE MATERIAL UNDERLINE TABS ── */}
            <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-slate-800 px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('pending');
                            setStatusFilter('ALL');
                        }}
                        className={`relative pb-3 pt-1 text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'pending'
                                ? 'text-[#0b57d0] dark:text-[#c2e7ff]'
                                : 'text-[#444746] dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Chờ tôi phê duyệt</span>
                        {pendingRequests.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                                {pendingRequests.length}
                            </span>
                        )}
                        {activeTab === 'pending' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0b57d0] dark:bg-[#c2e7ff] rounded-t-full" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('all');
                            setStatusFilter('ALL');
                        }}
                        className={`relative pb-3 pt-1 text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'all'
                                ? 'text-[#0b57d0] dark:text-[#c2e7ff]'
                                : 'text-[#444746] dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Tất cả yêu cầu</span>
                        <span className="text-[11px] text-gray-400">({allRequests.length})</span>
                        {activeTab === 'all' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0b57d0] dark:bg-[#c2e7ff] rounded-t-full" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('my');
                            setStatusFilter('ALL');
                        }}
                        className={`relative pb-3 pt-1 text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'my'
                                ? 'text-[#0b57d0] dark:text-[#c2e7ff]'
                                : 'text-[#444746] dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Yêu cầu của tôi</span>
                        <span className="text-[11px] text-gray-400">({myRequests.length})</span>
                        {activeTab === 'my' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0b57d0] dark:bg-[#c2e7ff] rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Status Filter Chips (for Tab 'all' or 'my') */}
                {activeTab !== 'pending' && (
                    <div className="flex items-center gap-1.5 pb-2.5">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1 rounded-full text-[12px] font-medium transition cursor-pointer ${
                                    statusFilter === st
                                        ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                        : 'text-[#444746] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {st === 'ALL' && 'Tất cả'}
                                {st === 'PENDING' && 'Chờ duyệt'}
                                {st === 'APPROVED' && 'Đã duyệt'}
                                {st === 'REJECTED' && 'Đã từ chối'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── ROW 3: MAIN LIST TABLE & RIGHT DETAILS DRAWER ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Đang tải danh sách yêu cầu quyền...</span>
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                {activeTab === 'pending'
                                    ? 'Không có yêu cầu nào đang chờ xử lý'
                                    : 'Không tìm thấy yêu cầu phù hợp'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                {activeTab === 'pending'
                                    ? 'Tuyệt vời! Tất cả các yêu cầu xin cấp quyền truy cập tài liệu đã được phê duyệt đầy đủ.'
                                    : 'Bạn có thể thay đổi bộ lọc hoặc tìm kiếm theo từ khóa khác.'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full pb-8">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200/80 dark:border-slate-800 text-[12px] font-normal text-[#444746] dark:text-slate-400 select-none h-10">
                                        <th className="py-2 px-3 w-[32%] min-w-0 font-normal">
                                            <span>Tài liệu / Thư mục</span>
                                        </th>
                                        <th className="py-2 px-3 w-[22%] min-w-0 font-normal">
                                            <span>Người yêu cầu</span>
                                        </th>
                                        <th className="py-2 px-3 w-[14%] min-w-0 font-normal">
                                            <span>Quyền xin</span>
                                        </th>
                                        <th className="py-2 px-3 w-[16%] min-w-0 font-normal">
                                            <span>Thời gian</span>
                                        </th>
                                        <th className="py-2 pr-3 w-[16%] text-right font-normal">
                                            <span>Thao tác</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] divide-y divide-gray-100 dark:divide-slate-800/60">
                                    {currentList.map((req) => {
                                        const isFolder = Boolean(req.folderId && !req.fileId);
                                        const targetName = req.fileName || req.folderName || 'Tài liệu bảo mật';
                                        const ext = targetName.split('.').pop() || '';
                                        const config = getFileTypeConfig(ext, isFolder);
                                        const Icon = config.icon;
                                        const avatarClass = getAvatarColor(req.requesterEmail || req.requesterName);
                                        const initial = (req.requesterName || req.requesterEmail || 'U').charAt(0).toUpperCase();
                                        const isSelected = selectedRequest?.id === req.id;
                                        const isBusy = actionLoadingId === req.id;

                                        return (
                                            <tr
                                                key={req.id}
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setShowDetailDrawer(true);
                                                }}
                                                className={`group transition-colors cursor-pointer select-none h-13 ${
                                                    isSelected
                                                        ? 'bg-[#c2e7ff]/40 dark:bg-[#004a77]/40 text-[#001d35] dark:text-blue-100'
                                                        : 'hover:bg-[#f2f6fc] dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-100'
                                                }`}
                                            >
                                                {/* 1. Target Name */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="shrink-0 flex items-center justify-center">
                                                            {isFolder ? (
                                                                <Folder className="w-4.5 h-4.5 text-[#5f6368] dark:text-slate-400 fill-[#5f6368]/20" />
                                                            ) : (
                                                                <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p
                                                                className="truncate text-[13px] font-medium text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                                                                title={targetName}
                                                            >
                                                                {targetName}
                                                            </p>
                                                            {req.reason && (
                                                                <p
                                                                    className="truncate text-[11px] text-gray-500 dark:text-slate-400 italic max-w-xs"
                                                                    title={req.reason}
                                                                >
                                                                    &ldquo;{req.reason}&rdquo;
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Requester */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 font-normal">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarClass}`}
                                                        >
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[12px] font-medium text-gray-800 dark:text-slate-200">
                                                                {req.requesterName}
                                                            </p>
                                                            <p className="truncate text-[10.5px] text-gray-400">
                                                                {req.requesterEmail}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 3. Requested Level */}
                                                <td className="py-2 px-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                            req.requestedLevel === 'EDITOR'
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                        }`}
                                                    >
                                                        <Shield className="w-3 h-3" />
                                                        <span>{req.requestedLevel === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}</span>
                                                    </span>
                                                </td>

                                                {/* 4. Timestamp */}
                                                <td className="py-2 px-3 text-[#444746] dark:text-slate-400 text-[11.5px] whitespace-nowrap">
                                                    {formatRequestDate(req.createdAt)}
                                                </td>

                                                {/* 5. Status / Actions */}
                                                <td className="py-2 pr-3 text-right">
                                                    {req.status === 'PENDING' ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={(e) => handleApprove(req, e)}
                                                                className="px-2.5 py-1 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full text-[11.5px] font-medium shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                                title="Phê duyệt quyền"
                                                            >
                                                                <Check className="w-3 h-3 stroke-[2.5]" />
                                                                <span>Duyệt</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={(e) => handleReject(req, e)}
                                                                className="px-2.5 py-1 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-gray-300 dark:border-slate-700 rounded-full text-[11.5px] font-medium shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                                title="Từ chối yêu cầu"
                                                            >
                                                                <X className="w-3 h-3 stroke-[2.5]" />
                                                                <span>Từ chối</span>
                                                            </button>
                                                        </div>
                                                    ) : req.status === 'APPROVED' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Đã phê duyệt</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-500 dark:text-rose-400">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Đã từ chối</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── RIGHT DETAILS DRAWER ── */}
                {showDetailDrawer && selectedRequest && (
                    <div className="w-88 border-l border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 transition-all select-none overflow-y-auto">
                        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/80 dark:border-slate-800 shrink-0">
                            <span className="text-xs font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                <KeyRound className="w-4 h-4 text-[#0b57d0]" />
                                <span>Chi tiết yêu cầu quyền</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowDetailDrawer(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 text-xs space-y-4">
                            {/* Target Item Card */}
                            <div className="p-3 bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl space-y-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Mục được yêu cầu
                                </span>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                                        {selectedRequest.folderId && !selectedRequest.fileId ? (
                                            <Folder className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-xs truncate">
                                            {selectedRequest.fileName || selectedRequest.folderName || 'Tài liệu'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {selectedRequest.folderName ? `Thư mục: ${selectedRequest.folderName}` : 'Tệp tin'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Requester Card */}
                            <div className="p-3 bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl space-y-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Người gửi yêu cầu
                                </span>
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                                            selectedRequest.requesterEmail || selectedRequest.requesterName
                                        )}`}
                                    >
                                        {(selectedRequest.requesterName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-xs truncate">
                                            {selectedRequest.requesterName}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {selectedRequest.requesterEmail}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Access */}
                            <div className="p-3 bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl space-y-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Lý do xin cấp quyền
                                </span>
                                <p className="text-gray-700 dark:text-slate-200 leading-relaxed text-[11.5px] bg-gray-50 dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                                    {selectedRequest.reason || 'Không có lý do chi tiết được cung cấp.'}
                                </p>
                            </div>

                            {/* Request Info Summary */}
                            <div className="bg-white dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2 text-[11.5px]">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Quyền xin cấp</span>
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {selectedRequest.requestedLevel === 'EDITOR' ? 'Chỉnh sửa (EDITOR)' : 'Chỉ xem (VIEWER)'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Thời gian tạo</span>
                                    <span className="font-medium text-gray-700 dark:text-slate-300">
                                        {formatRequestDate(selectedRequest.createdAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Trạng thái</span>
                                    <span
                                        className={`font-semibold ${
                                            selectedRequest.status === 'APPROVED'
                                                ? 'text-emerald-600'
                                                : selectedRequest.status === 'REJECTED'
                                                ? 'text-rose-500'
                                                : 'text-amber-600'
                                        }`}
                                    >
                                        {selectedRequest.status === 'APPROVED' && 'Đã phê duyệt'}
                                        {selectedRequest.status === 'REJECTED' && 'Đã từ chối'}
                                        {selectedRequest.status === 'PENDING' && 'Đang chờ duyệt'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons in Drawer */}
                            {selectedRequest.status === 'PENDING' && (
                                <div className="pt-2 space-y-2">
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedRequest.id}
                                        onClick={() => handleApprove(selectedRequest)}
                                        className="w-full py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                        <span>Phê duyệt và Cấp quyền ngay</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedRequest.id}
                                        onClick={() => handleReject(selectedRequest)}
                                        className="w-full py-2 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4 stroke-[2.5]" />
                                        <span>Từ chối yêu cầu này</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AccessRequestsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải...</span>
                </div>
            }
        >
            <AccessRequestsContent />
        </Suspense>
    );
}
