'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Shield, Folder, FileText, Clock, RefreshCw, User, Sparkles, ExternalLink } from 'lucide-react';
import accessRequestService, { AccessRequestDto } from '@/services/access/accessRequestService';
import { WsNotification } from '@/hooks/useWebSocketNotification';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'requests' | 'shares'>('requests');
    const [requests, setRequests] = useState<AccessRequestDto[]>([]);
    const [liveNotifs, setLiveNotifs] = useState<WsNotification[]>([]);
    const [processingId, setProcessingId] = useState<string | number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchRequests = async () => {
        try {
            const data = await accessRequestService.getPendingRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load pending requests:', err);
        }
    };

    const initialFetchDoneRef = useRef(false);

    useEffect(() => {
        if (!initialFetchDoneRef.current) {
            initialFetchDoneRef.current = true;
            fetchRequests();
        }
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    // Listen for WebSocket notifications
    useEffect(() => {
        const handleWsNotification = (e: any) => {
            const newNotif: WsNotification = e.detail;
            setLiveNotifs((prev) => [newNotif, ...prev.slice(0, 19)]);
        };

        window.addEventListener('new_ws_notification', handleWsNotification);
        return () => {
            window.removeEventListener('new_ws_notification', handleWsNotification);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleApprove = async (id: string | number, requesterName: string, folderName?: string) => {
        setProcessingId(id);
        try {
            await accessRequestService.approveRequest(id as any);
            toast.success(`Đã cấp quyền cho ${requesterName}`);
            setRequests((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
        } catch (err) {
            toast.error('Không thể phê duyệt yêu cầu');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string | number, requesterName: string) => {
        setProcessingId(id);
        try {
            await accessRequestService.rejectRequest(id as any);
            toast.success(`Đã từ chối yêu cầu của ${requesterName}`);
            setRequests((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
        } catch (err) {
            toast.error('Không thể từ chối yêu cầu');
        } finally {
            setProcessingId(null);
        }
    };

    const totalCount = requests.length + liveNotifs.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200 group outline-none cursor-pointer"
                aria-label="Thông báo"
            >
                <Bell className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors" strokeWidth={2} />
                {totalCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 ring-2 ring-white dark:ring-slate-900 text-[9px] flex items-center justify-center rounded-full text-white font-bold leading-none animate-pulse">
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 bg-gray-200/60 dark:bg-slate-700/60 p-0.5 rounded-lg text-xs font-semibold">
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                    activeTab === 'requests'
                                        ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                }`}
                            >
                                Yêu cầu cấp quyền ({requests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('shares')}
                                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                                    activeTab === 'shares'
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                File mới ({liveNotifs.length})
                            </button>
                        </div>

                        <button
                            onClick={fetchRequests}
                            className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded transition cursor-pointer"
                            title="Làm mới"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                        {activeTab === 'requests' ? (
                            requests.length > 0 ? (
                                requests.map((req) => (
                                    <div key={req.id} className="p-3 hover:bg-gray-50/60 transition space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                                    {req.requesterAvatar || req.requesterName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                                        {req.requesterName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate">{req.requesterEmail}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] bg-purple-50 text-purple-700 font-medium px-1.5 py-0.2 rounded border border-purple-100 shrink-0">
                                                {req.requestedLevel === 'EDITOR' ? 'Quyền sửa' : 'Quyền xem'}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 space-y-1">
                                            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                                                {req.folderId ? (
                                                    <>
                                                        <Folder className="w-3 h-3 text-blue-600 fill-blue-500 shrink-0" strokeWidth={1.5} />
                                                        <span className="truncate">{req.folderName || 'Thư mục tài liệu'}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText className="w-3 h-3 text-emerald-500" />
                                                        <span className="truncate">{req.fileName || 'Tài liệu'}</span>
                                                    </>
                                                )}
                                            </div>
                                            {req.reason && (
                                                <p className="text-[11px] text-gray-500 italic line-clamp-2">
                                                    "{req.reason}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                disabled={processingId === req.id}
                                                onClick={() => handleReject(req.id, req.requesterName)}
                                                className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-gray-200 transition"
                                            >
                                                Từ chối
                                            </button>
                                            <button
                                                type="button"
                                                disabled={processingId === req.id}
                                                onClick={() => handleApprove(req.id, req.requesterName, req.folderName)}
                                                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-2xs"
                                            >
                                                {processingId === req.id ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                                )}
                                                Duyệt quyền
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    Không có yêu cầu cấp quyền nào đang chờ.
                                </div>
                            )
                        ) : (
                            liveNotifs.length > 0 ? (
                                liveNotifs.map((notif) => (
                                    <div key={notif.id} className="p-3 hover:bg-gray-50/60 transition space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                                        {notif.fileName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {notif.uploaderName} · {notif.folderName}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                                Realtime
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-gray-600 pl-9">
                                            {notif.message}
                                        </p>

                                        <div className="pl-9 pt-1">
                                            <Link
                                                href='/files'
                                                onClick={() => setIsOpen(false)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                                            >
                                                Mở tài liệu
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    Chưa có tài liệu mới nào được chia sẻ trong phiên này.
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer link to Activity page */}
                    <div className="p-2.5 bg-gray-50/90 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 text-center">
                        <Link
                            href="/activity"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 transition"
                        >
                            Xem tất cả trong Activity
                            <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}