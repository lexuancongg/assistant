'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Folder,
    FileSpreadsheet,
    FileText,
    Presentation,
    FileBox,
    Loader2,
    MoreHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import accessRequestService, { AccessRequestDto } from '@/services/access/accessRequestService';
import UserAvatar from '@/components/common/UserAvatar';

// File Type icon config matching Google Drive
function getFileTypeConfig(extOrType: string, isFolder = false) {
    if (isFolder) {
        return {
            icon: Folder,
            color: 'text-[#5f6368] dark:text-neutral-400 fill-[#5f6368]/20',
        };
    }

    const ext = (extOrType || '').toLowerCase().replace(/^\./, '');

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-[#0f9d58]',
        };
    }
    if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-[#0b57d0]',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-[#f29900]',
        };
    }
    if (ext === 'pdf') {
        return {
            icon: FileText,
            color: 'text-[#ea4335]',
        };
    }

    return {
        icon: FileBox,
        color: 'text-[#0b57d0]',
    };
}

// Format date into clean string: "18 thg 11, 16:18"
function formatRequestDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        let d: Date;
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ')[0].split('/');
            d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
            d = new Date(dateStr);
        }
        if (isNaN(d.getTime())) return dateStr;
        const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return `${d.getDate()} thg ${d.getMonth() + 1}, ${time}`;
    } catch {
        return dateStr;
    }
}

function AccessRequestsContent() {
    usePageBreadcrumb(['Bảo mật & Quản trị', 'Yêu cầu quyền truy cập']);
    const router = useRouter();

    const [userRole, setUserRole] = useState<string>('USER');
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'my'>('pending');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

    const [pendingRequests, setPendingRequests] = useState<AccessRequestDto[]>([]);
    const [allRequests, setAllRequests] = useState<AccessRequestDto[]>([]);
    const [myRequests, setMyRequests] = useState<AccessRequestDto[]>([]);

    const [selectedRequest, setSelectedRequest] = useState<AccessRequestDto | null>(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-action-menu]')) {
                setOpenMenuId(null);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = window.localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const role = (parsed.role || 'USER').toUpperCase();
                    setUserRole(role);
                    if (role !== 'ADMIN') {
                        setActiveTab('my');
                    }
                }
            } catch (e) {}
        }
    }, []);

    // Fetch data
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
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

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
            toast.success(`Đã phê duyệt cho ${request.requesterName}`);
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
            toast.success(`Đã từ chối yêu cầu của ${request.requesterName}`);
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
        <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#1E1F20] font-sans select-none">
            {/* Header tiêu đề chuẩn Google Drive */}
            <div className="px-6 pt-4 pb-2 shrink-0">
                <h1 className="text-[22px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                    Yêu cầu quyền truy cập
                </h1>
            </div>

            {/* Google Material Tabs */}
            <div className="flex items-center border-b border-[#E0E0E0] dark:border-neutral-800 px-6 shrink-0">
                <div className="flex items-center gap-6">
                    {userRole === 'ADMIN' && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('pending');
                                    setStatusFilter('ALL');
                                }}
                                className={`relative pb-3 pt-1 text-[13.5px] transition-colors cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'pending'
                                        ? 'text-[#0B57D0] dark:text-[#A8C7FA] font-medium'
                                        : 'text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-neutral-200'
                                }`}
                            >
                                <span>Chờ phê duyệt</span>
                                {pendingRequests.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDF2FA] dark:bg-neutral-800 text-[#0B57D0] dark:text-[#A8C7FA]">
                                        {pendingRequests.length}
                                    </span>
                                )}
                                {activeTab === 'pending' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0B57D0] dark:bg-[#A8C7FA] rounded-t-full" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('all');
                                    setStatusFilter('ALL');
                                }}
                                className={`relative pb-3 pt-1 text-[13.5px] transition-colors cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'all'
                                        ? 'text-[#0B57D0] dark:text-[#A8C7FA] font-medium'
                                        : 'text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-neutral-200'
                                }`}
                            >
                                <span>Tất cả yêu cầu</span>
                                <span className="text-[11px] text-[#747775]">({allRequests.length})</span>
                                {activeTab === 'all' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0B57D0] dark:bg-[#A8C7FA] rounded-t-full" />
                                )}
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('my');
                            setStatusFilter('ALL');
                        }}
                        className={`relative pb-3 pt-1 text-[13.5px] transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'my'
                                ? 'text-[#0B57D0] dark:text-[#A8C7FA] font-medium'
                                : 'text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-neutral-200'
                        }`}
                    >
                        <span>Yêu cầu của tôi</span>
                        <span className="text-[11px] text-[#747775]">({myRequests.length})</span>
                        {activeTab === 'my' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0B57D0] dark:bg-[#A8C7FA] rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Danh sách Table */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-[#747775] gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#0B57D0]" />
                            <span className="text-xs">Đang tải...</span>
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center text-[#747775]">
                            <p className="text-[14px] text-[#444746] dark:text-neutral-300">
                                {activeTab === 'pending'
                                    ? 'Không có yêu cầu nào đang chờ xử lý'
                                    : 'Không tìm thấy yêu cầu phù hợp'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full pb-8">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E0E0E0] dark:border-neutral-800 text-[13px] font-normal text-[#444746] dark:text-neutral-400 select-none h-11">
                                        <th className="py-2 px-3 w-[36%] min-w-0 font-normal">
                                            <span>Tên</span>
                                        </th>
                                        <th className="py-2 px-3 w-[22%] min-w-0 font-normal">
                                            <span>Người yêu cầu</span>
                                        </th>
                                        <th className="py-2 px-3 w-[15%] min-w-0 font-normal">
                                            <span>Quyền xin</span>
                                        </th>
                                        <th className="py-2 px-3 w-[13%] min-w-0 font-normal">
                                            <span>Ngày yêu cầu</span>
                                        </th>
                                        <th className="py-2 pr-3 w-[14%] text-right font-normal">
                                            <span>Thao tác</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F0F0] dark:divide-neutral-800/60">
                                    {currentList.map((req) => {
                                        const isFolder = Boolean(req.folderId && !req.fileId);
                                        const targetName = req.fileName || req.folderName || 'Tài liệu';
                                        const ext = targetName.split('.').pop() || '';
                                        const config = getFileTypeConfig(ext, isFolder);
                                        const Icon = config.icon;
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
                                                className={`group transition-colors cursor-pointer select-none h-12 ${
                                                    isSelected
                                                        ? 'bg-[#EDF2FA] dark:bg-neutral-800/80'
                                                        : 'hover:bg-[#F8FAFD] dark:hover:bg-neutral-800/40 text-[#1F1F1F] dark:text-[#E3E3E3]'
                                                }`}
                                            >
                                                {/* 1. Tên tệp / thư mục */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                                                        <span
                                                            className="truncate text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3]"
                                                            title={req.reason ? `${targetName} (Lời nhắn: ${req.reason})` : targetName}
                                                        >
                                                            {targetName}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 2. Người yêu cầu */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <UserAvatar
                                                            name={req.requesterName}
                                                            email={req.requesterEmail}
                                                            avatarUrl={req.requesterAvatar}
                                                            size="md"
                                                        />
                                                        <span className="truncate text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                            {req.requesterName || req.requesterEmail}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 3. Quyền xin */}
                                                <td className="py-2 px-3 text-[13px] text-[#444746] dark:text-neutral-400 font-normal">
                                                    {req.requestedLevel === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}
                                                </td>

                                                {/* 4. Ngày yêu cầu */}
                                                <td className="py-2 px-3 text-[13px] text-[#444746] dark:text-neutral-400 font-normal whitespace-nowrap">
                                                    {formatRequestDate(req.createdAt)}
                                                </td>

                                                {/* 5. Thao tác */}
                                                <td className="py-2 pr-3 text-right">
                                                    {req.status === 'PENDING' && userRole === 'ADMIN' ? (
                                                        <div className="relative inline-block text-right" data-action-menu>
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === req.id ? null : req.id);
                                                                }}
                                                                className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition cursor-pointer ${
                                                                    openMenuId === req.id
                                                                        ? 'bg-[#E8EAED] dark:bg-neutral-700 text-[#1F1F1F]'
                                                                        : 'text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] hover:bg-[#1F1F1F]/8 dark:hover:bg-white/10'
                                                                }`}
                                                                title="Thao tác"
                                                            >
                                                                {isBusy ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin text-[#0B57D0]" />
                                                                ) : (
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                )}
                                                            </button>

                                                            {openMenuId === req.id && (
                                                                <div
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-neutral-700 py-1.5 z-50 w-36 animate-in fade-in duration-100 text-left"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            setOpenMenuId(null);
                                                                            handleApprove(req, e);
                                                                        }}
                                                                        className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-neutral-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer transition-colors"
                                                                    >
                                                                        <span>Duyệt</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            setOpenMenuId(null);
                                                                            handleReject(req, e);
                                                                        }}
                                                                        className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-neutral-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer transition-colors"
                                                                    >
                                                                        <span>Không duyệt</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : req.status === 'PENDING' ? (
                                                        <span className="text-[13px] text-[#444746] dark:text-neutral-400">
                                                            Đang chờ
                                                        </span>
                                                    ) : req.status === 'APPROVED' ? (
                                                        <span className="text-[13px] font-medium text-[#137333] dark:text-emerald-400">
                                                            Đã duyệt
                                                        </span>
                                                    ) : (
                                                        <span className="text-[13px] text-[#747775]">
                                                            Đã từ chối
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

                {/* Right Detail Drawer */}
                {showDetailDrawer && selectedRequest && (
                    <div className="w-80 border-l border-[#E0E0E0] dark:border-neutral-800 bg-white dark:bg-[#1E1F20] flex flex-col shrink-0 select-none overflow-y-auto">
                        <div className="h-12 px-4 flex items-center justify-between border-b border-[#E0E0E0] dark:border-neutral-800 shrink-0">
                            <span className="text-[14px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                Chi tiết yêu cầu
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowDetailDrawer(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#444746] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 cursor-pointer"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 text-[13px]">
                            {/* Mục được yêu cầu */}
                            <div>
                                <span className="text-[11.5px] font-medium text-[#747775] uppercase tracking-wider">
                                    Tài liệu
                                </span>
                                <p className="mt-1 font-medium text-[#1F1F1F] dark:text-[#E3E3E3] break-words">
                                    {selectedRequest.fileName || selectedRequest.folderName || 'Tài liệu'}
                                </p>
                            </div>

                            {/* Người gửi */}
                            <div>
                                <span className="text-[11.5px] font-medium text-[#747775] uppercase tracking-wider">
                                    Người gửi
                                </span>
                                <p className="mt-1 font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                    {selectedRequest.requesterName}
                                </p>
                                <p className="text-[12px] text-[#747775]">
                                    {selectedRequest.requesterEmail}
                                </p>
                            </div>

                            {/* Quyền xin */}
                            <div>
                                <span className="text-[11.5px] font-medium text-[#747775] uppercase tracking-wider">
                                    Quyền xin
                                </span>
                                <p className="mt-1 text-[#1F1F1F] dark:text-[#E3E3E3]">
                                    {selectedRequest.requestedLevel === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}
                                </p>
                            </div>

                            {/* Lời nhắn */}
                            {selectedRequest.reason && (
                                <div>
                                    <span className="text-[11.5px] font-medium text-[#747775] uppercase tracking-wider">
                                        Lời nhắn
                                    </span>
                                    <p className="mt-1 text-[#444746] dark:text-neutral-300 bg-[#F0F4F9] dark:bg-neutral-800 p-2.5 rounded-[8px] leading-relaxed">
                                        {selectedRequest.reason}
                                    </p>
                                </div>
                            )}

                            {/* Thời gian */}
                            <div>
                                <span className="text-[11.5px] font-medium text-[#747775] uppercase tracking-wider">
                                    Thời gian gửi
                                </span>
                                <p className="mt-1 text-[#444746] dark:text-neutral-300">
                                    {formatRequestDate(selectedRequest.createdAt)}
                                </p>
                            </div>

                            {/* Actions trong drawer */}
                            {selectedRequest.status === 'PENDING' && userRole === 'ADMIN' && (
                                <div className="pt-2 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedRequest.id}
                                        onClick={() => handleReject(selectedRequest)}
                                        className="h-[32px] px-4 rounded-full text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#1F1F1F]/8 dark:hover:bg-white/10 transition cursor-pointer"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === selectedRequest.id}
                                        onClick={() => handleApprove(selectedRequest)}
                                        className="h-[32px] px-5 rounded-full text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#E8EAED] hover:bg-[#DADCE0] dark:bg-neutral-800 dark:hover:bg-neutral-700 transition cursor-pointer shadow-none"
                                    >
                                        Duyệt
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
                <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#1E1F20]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0B57D0]" />
                </div>
            }
        >
            <AccessRequestsContent />
        </Suspense>
    );
}
