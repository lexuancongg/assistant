'use client';

import React, { useState, useMemo } from 'react';
import {
    FileText,
    FileSpreadsheet,
    Presentation,
    Video,
    Image as ImageIcon,
    Archive,
    Headphones,
    FileCode,
    File,
    Folder,
    HardDrive,
    ArrowRight,
    MessageSquare,
    Info,
    X,
    Clock,
    Pencil,
    ExternalLink,
} from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import activityService, { ActivityLogDto } from '@/services/activity/activityService';

interface FileActivityDrawerTabProps {
    file: {
        id?: number | string;
        name?: string;
        fileType?: string;
        createdAt?: string;
        updatedAt?: string;
        uploadedByName?: string;
        uploadedByEmail?: string;
        uploadedByAvatarUrl?: string;
        avatarUrl?: string;
        owner?: string;
        folderName?: string | null;
        description?: string;
        isMe?: boolean;
    } | null;
    activityLogs?: ActivityLogDto[];
}

// Visual configuration helper for file types inside chips
function getActivityFileConfig(extOrType: string) {
    const ext = (extOrType || '').toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return {
            icon: FileSpreadsheet,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-100 dark:bg-emerald-950/60',
            badge: 'XLS',
        };
    }
    if (['docx', 'doc'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-950/60',
            badge: 'DOC',
        };
    }
    if (['pdf'].includes(ext)) {
        return {
            icon: FileText,
            color: 'text-rose-600 dark:text-rose-400',
            bgColor: 'bg-rose-100 dark:bg-rose-950/60',
            badge: 'PDF',
        };
    }
    if (['pptx', 'ppt'].includes(ext)) {
        return {
            icon: Presentation,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100 dark:bg-amber-950/60',
            badge: 'PPT',
        };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
        return {
            icon: ImageIcon,
            color: 'text-rose-500 dark:text-rose-400',
            bgColor: 'bg-rose-100 dark:bg-rose-950/60',
            badge: 'IMG',
        };
    }
    if (['md', 'markdown'].includes(ext)) {
        return {
            icon: FileCode,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-950/60',
            badge: 'MD',
        };
    }
    return {
        icon: File,
        color: 'text-gray-600 dark:text-slate-400',
        bgColor: 'bg-gray-100 dark:bg-slate-800',
        badge: ext.toUpperCase().slice(0, 3) || 'FILE',
    };
}

// Google Drive style date-time format: "15:46 16 thg 11"
function formatGoogleDriveActivityTime(dateInput?: string | number | null): string {
    if (!dateInput) return 'Vừa xong';
    let d: Date;
    if (typeof dateInput === 'number') {
        d = new Date(dateInput);
    } else if (dateInput.includes('/') && dateInput.includes(':')) {
        // e.g. "16/11/2026 15:46"
        const parts = dateInput.split(' ');
        const dateParts = parts[0].split('/');
        const timePart = parts[1] || '00:00';
        d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}:00`);
    } else {
        d = new Date(dateInput);
    }

    if (isNaN(d.getTime())) return String(dateInput);

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = d.getDate();
    const month = d.getMonth() + 1;

    return `${hours}:${minutes} ${day} thg ${month}`;
}

// Group key calculation
function getActivityGroupKey(dateInput?: string | number | null): string {
    if (!dateInput) return 'Gần đây';
    let d: Date;
    if (typeof dateInput === 'number') {
        d = new Date(dateInput);
    } else if (typeof dateInput === 'string' && dateInput.includes('/') && dateInput.includes(':')) {
        const parts = dateInput.split(' ');
        const dateParts = parts[0].split('/');
        const timePart = parts[1] || '00:00';
        d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}:00`);
    } else {
        d = new Date(dateInput);
    }

    if (isNaN(d.getTime())) return 'Gần đây';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays <= 7) return 'Tuần này';
    if (diffDays <= 14) return 'Tuần trước';
    if (diffDays <= 30) return 'Tháng này';
    return 'Trước đây';
}

interface NormalizedActivityItem {
    id: string | number;
    actionType: 'EDIT' | 'UPLOAD' | 'MOVE' | 'RENAME' | 'SHARE' | 'DELETE' | 'OTHER';
    actionText: string;
    formattedTime: string;
    groupKey: string;
    actorName: string;
    actorEmail?: string;
    actorAvatarUrl?: string;
    isCurrentUser: boolean;
    fileName: string;
    fileType: string;
    fromFolder?: string;
    toFolder?: string;
    changeDescription?: string;
    rawDate: number;
}

export default function FileActivityDrawerTab({
    file,
    activityLogs,
}: FileActivityDrawerTabProps) {
    const [selectedDetailNote, setSelectedDetailNote] = useState<NormalizedActivityItem | null>(null);
    const [fetchedLogs, setFetchedLogs] = useState<ActivityLogDto[]>([]);

    React.useEffect(() => {
        let isCancelled = false;
        const fetchLogs = () => {
            activityService.getActivityLogs()
                .then((logs) => {
                    if (!isCancelled && logs) setFetchedLogs(logs);
                })
                .catch(() => {});
        };

        fetchLogs();

        const handleUpdate = () => {
            fetchLogs();
            setTimeout(fetchLogs, 2000);
        };

        window.addEventListener('activity-log-updated', handleUpdate);
        const timer = setInterval(fetchLogs, 5000);

        return () => {
            isCancelled = true;
            window.removeEventListener('activity-log-updated', handleUpdate);
            clearInterval(timer);
        };
    }, [file?.id, file?.updatedAt]);

    const effectiveLogs = fetchedLogs.length > 0 ? fetchedLogs : (activityLogs || []);

    // Get current logged-in user
    const currentUser = useMemo(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                if (stored) return JSON.parse(stored);
            }
        } catch (e) {}
        return null;
    }, []);

    // Build list of filtered activities for the current file
    const items = useMemo(() => {
        if (!file) return [];

        const fileIdStr = file.id ? String(file.id) : '';
        const fileName = file.name || '';
        const ext = file.fileType || fileName.split('.').pop() || '';

        // 1. Filter out all AI indexing / semantic vector logs
        const matched = effectiveLogs.filter((log) => {
            // Exclude AI query / indexing
            const actionStr = (log.action || '').toLowerCase();
            const typeStr = (log.type || '').toLowerCase();
            if (
                actionStr.includes('chỉ mục ai') ||
                actionStr.includes('semantic vector') ||
                actionStr.includes('rag engine') ||
                actionStr.includes('ai_query') ||
                typeStr.includes('ai_query')
            ) {
                return false;
            }

            // Match by file ID or file name
            const logFileId = log.fileId != null ? String(log.fileId) : '';
            const logTarget = (log.targetName || '').trim();

            if (fileIdStr && logFileId && fileIdStr === logFileId) return true;
            if (fileName && logTarget && fileName.toLowerCase() === logTarget.toLowerCase()) return true;

            return false;
        });

        const list: NormalizedActivityItem[] = [];

        matched.forEach((log) => {
            const rawDate = log.createdAtIso
                ? new Date(log.createdAtIso).getTime()
                : (log.timestamp ? new Date(log.timestamp).getTime() : Date.now());

            const isActorMe = !!(
                (currentUser?.email && log.actorEmail && currentUser.email.toLowerCase() === log.actorEmail.toLowerCase()) ||
                (currentUser?.name && log.actorName && currentUser.name.toLowerCase() === log.actorName.toLowerCase()) ||
                log.actorName === 'tôi' ||
                log.actorName === 'me'
            );

            const meta = log.metadata || {};
            const metaAction = String(meta.action || '').toUpperCase();
            let actionType: NormalizedActivityItem['actionType'] = 'OTHER';
            let actionText = '';

            if (metaAction === 'MOVE_FILE') {
                actionType = 'MOVE';
                actionText = isActorMe ? 'Bạn đã di chuyển một mục' : `${log.actorName} đã di chuyển một mục`;
            } else if (
                metaAction === 'ONLYOFFICE_NEW_VERSION' ||
                metaAction === 'ONLYOFFICE_OVERWRITE' ||
                log.type === 'update' ||
                log.type === 'UPDATE' ||
                meta.changeDescription
            ) {
                actionType = 'EDIT';
                actionText = isActorMe ? 'Bạn đã chỉnh sửa một mục' : `${log.actorName} đã chỉnh sửa một mục`;
            } else if (log.type === 'upload' || log.type === 'UPLOAD') {
                actionType = 'UPLOAD';
                actionText = isActorMe ? 'Bạn đã tải lên một mục' : `${log.actorName} đã tải lên một mục`;
            } else if (log.type === 'share' || log.type === 'SHARE') {
                actionType = 'SHARE';
                actionText = isActorMe ? 'Bạn đã chia sẻ một mục' : `${log.actorName} đã chia sẻ một mục`;
            } else if (log.type === 'delete' || log.type === 'DELETE') {
                actionType = 'DELETE';
                actionText = isActorMe ? 'Bạn đã xóa một mục' : `${log.actorName} đã xóa một mục`;
            } else {
                actionText = isActorMe ? `Bạn ${log.action}` : `${log.actorName} ${log.action}`;
            }

            const changeDescription = (meta.changeDescription || log.changeDescription || '') as string;
            const fromFolder = (meta.fromFolder || '') as string;
            const toFolder = (meta.toFolder || '') as string;

            list.push({
                id: log.id,
                actionType,
                actionText,
                formattedTime: formatGoogleDriveActivityTime(log.createdAtIso || log.timestamp),
                groupKey: getActivityGroupKey(log.createdAtIso || log.timestamp),
                actorName: log.actorName || 'Người dùng',
                actorEmail: log.actorEmail || undefined,
                actorAvatarUrl: log.actorAvatarUrl || undefined,
                isCurrentUser: isActorMe,
                fileName: log.targetName || fileName,
                fileType: log.fileType || ext,
                fromFolder,
                toFolder,
                changeDescription: changeDescription.trim() ? changeDescription.trim() : undefined,
                rawDate: isNaN(rawDate) ? Date.now() : rawDate,
            });
        });

        // If no matching activities found in DB logs, synthesize realistic activities from the file metadata
        if (list.length === 0 && file) {
            const isMe = !!(
                file.isMe ||
                (currentUser?.email && file.uploadedByEmail && currentUser.email.toLowerCase() === file.uploadedByEmail.toLowerCase()) ||
                (currentUser?.name && file.uploadedByName && currentUser.name.toLowerCase() === file.uploadedByName.toLowerCase()) ||
                file.owner === 'tôi'
            );

            // 1. Synthetic Edit Activity if file has been modified or has a description
            if (file.updatedAt && file.createdAt && file.updatedAt !== file.createdAt) {
                list.push({
                    id: `synth-edit-${file.id}`,
                    actionType: 'EDIT',
                    actionText: isMe ? 'Bạn đã chỉnh sửa một mục' : `${file.uploadedByName || file.owner || 'Người dùng'} đã chỉnh sửa một mục`,
                    formattedTime: formatGoogleDriveActivityTime(file.updatedAt),
                    groupKey: getActivityGroupKey(file.updatedAt),
                    actorName: file.uploadedByName || file.owner || 'Người dùng',
                    actorEmail: file.uploadedByEmail,
                    actorAvatarUrl: file.uploadedByAvatarUrl || file.avatarUrl,
                    isCurrentUser: isMe,
                    fileName,
                    fileType: ext,
                    changeDescription: file.description || undefined,
                    rawDate: new Date(file.updatedAt).getTime(),
                });
            }

            // 2. Synthetic Upload Activity
            list.push({
                id: `synth-upload-${file.id}`,
                actionType: 'UPLOAD',
                actionText: isMe ? 'Bạn đã tải lên một mục' : `${file.uploadedByName || file.owner || 'Người dùng'} đã tải lên một mục`,
                formattedTime: formatGoogleDriveActivityTime(file.createdAt || file.updatedAt),
                groupKey: getActivityGroupKey(file.createdAt || file.updatedAt),
                actorName: file.uploadedByName || file.owner || 'Người dùng',
                actorEmail: file.uploadedByEmail,
                actorAvatarUrl: file.uploadedByAvatarUrl || file.avatarUrl,
                isCurrentUser: isMe,
                fileName,
                fileType: ext,
                rawDate: new Date(file.createdAt || file.updatedAt || Date.now()).getTime(),
            });
        }

        // Sort descending by rawDate
        list.sort((a, b) => b.rawDate - a.rawDate);

        return list;
    }, [file, effectiveLogs, currentUser]);

    // Group items by groupKey preserving chronological order
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: NormalizedActivityItem[] } = {};
        const groupOrder: string[] = [];

        items.forEach((item) => {
            if (!groups[item.groupKey]) {
                groups[item.groupKey] = [];
                groupOrder.push(item.groupKey);
            }
            groups[item.groupKey].push(item);
        });

        return groupOrder.map((key) => ({
            key,
            activities: groups[key],
        }));
    }, [items]);

    if (!file) {
        return (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs">
                Chọn một tệp để xem lịch sử hoạt động
            </div>
        );
    }

    if (groupedItems.length === 0) {
        return (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs">
                Chưa có hoạt động nào được ghi nhận cho tệp này
            </div>
        );
    }

    const fileConfig = getActivityFileConfig(file.fileType || file.name?.split('.').pop() || '');
    const FileTypeIcon = fileConfig.icon;

    return (
        <div className="space-y-6 pb-6 select-none">
            {groupedItems.map((group) => (
                <div key={group.key} className="space-y-4">
                    {/* Group Title: e.g. "Tuần này", "Hôm nay", "Hôm qua" */}
                    <h4 className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                        {group.key}
                    </h4>

                    {/* Group Activity Entries */}
                    <div className="space-y-5">
                        {group.activities.map((act) => {
                            const actConfig = getActivityFileConfig(act.fileType);
                            const ActIcon = actConfig.icon;

                            return (
                                <div key={act.id} className="flex items-start gap-3">
                                    {/* Left: User Avatar (Exact match to Google Drive media_1795143658698_8736b290.png) */}
                                    <div className="pt-0.5 shrink-0">
                                        <UserAvatar
                                            name={act.actorName}
                                            email={act.actorEmail}
                                            avatarUrl={act.actorAvatarUrl}
                                            isCurrentUser={act.isCurrentUser}
                                            size="lg"
                                        />
                                    </div>

                                    {/* Right: Action Description, Timestamp, and Chips */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        {/* Action Text */}
                                        <div className="text-[13px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] leading-snug">
                                            {act.actionText}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-[11.5px] text-[#747775] dark:text-slate-400">
                                            {act.formattedTime}
                                        </div>

                                        {/* Chips & Tree Hierarchy (Exact visual match to Google Drive) */}
                                        {act.actionType === 'UPLOAD' ? (
                                            <div className="space-y-1 pt-0.5">
                                                {/* Parent location chip */}
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                    <HardDrive className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                    <span className="truncate max-w-[200px]">
                                                        {file.folderName || 'Drive của tôi'}
                                                    </span>
                                                </div>

                                                {/* Indented file item chip with tree branch └ */}
                                                <div className="flex items-center gap-2 pl-3">
                                                    <span className="text-gray-400 dark:text-slate-500 font-mono text-xs select-none">
                                                        └
                                                    </span>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${actConfig.bgColor} ${actConfig.color}`}>
                                                            <ActIcon className="w-3 h-3" />
                                                        </div>
                                                        <span className="truncate max-w-[170px]" title={act.fileName}>
                                                            {act.fileName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : act.actionType === 'MOVE' ? (
                                            <div className="space-y-1 pt-0.5">
                                                {/* Move source & target folders */}
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                        <span className="truncate max-w-[100px]" title={act.fromFolder || 'Kho tri thức'}>
                                                            {act.fromFolder || 'Kho tri thức'}
                                                        </span>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                        <span className="truncate max-w-[100px]" title={act.toFolder || 'Kho tri thức'}>
                                                            {act.toFolder || 'Kho tri thức'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Indented file chip */}
                                                <div className="flex items-center gap-2 pl-3">
                                                    <span className="text-gray-400 dark:text-slate-500 font-mono text-xs select-none">
                                                        └
                                                    </span>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${actConfig.bgColor} ${actConfig.color}`}>
                                                            <ActIcon className="w-3 h-3" />
                                                        </div>
                                                        <span className="truncate max-w-[170px]" title={act.fileName}>
                                                            {act.fileName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Regular action (Edit, Share, etc.) */
                                            <div className="space-y-1.5 pt-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* File Chip */}
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-gray-800 dark:text-slate-200 font-medium max-w-full shadow-2xs">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${actConfig.bgColor} ${actConfig.color}`}>
                                                            <ActIcon className="w-3 h-3" />
                                                        </div>
                                                        <span className="truncate max-w-[180px]" title={act.fileName}>
                                                            {act.fileName}
                                                        </span>
                                                    </div>

                                                    {/* Edit Description Note / Popup Button */}
                                                    {act.changeDescription && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDetailNote(act)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0B57D0] dark:text-blue-300 text-[11px] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer shrink-0"
                                                            title="Bấm để xem nội dung / mục đích chỉnh sửa"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            <span>Nội dung chỉnh sửa</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Inline preview of changeDescription if available */}
                                                {act.changeDescription && (
                                                    <div
                                                        onClick={() => setSelectedDetailNote(act)}
                                                        className="p-2 rounded-lg bg-[#F0F4F9]/80 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/60 text-[11.5px] text-[#444746] dark:text-slate-300 leading-relaxed cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition"
                                                    >
                                                        <span className="font-semibold text-gray-700 dark:text-slate-200">Mục đích: </span>
                                                        <span className="italic">"{act.changeDescription}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* POPUP MODAL: "Nội dung chỉnh sửa" (Mục đích nó là ở đây) */}
            {selectedDetailNote && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150"
                    onClick={() => setSelectedDetailNote(null)}
                >
                    <div
                        className="bg-white dark:bg-[#202124] rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0B57D0] dark:text-blue-300 flex items-center justify-center">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-[14.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                        Chi tiết nội dung chỉnh sửa
                                    </h3>
                                    <p className="text-[11.5px] text-gray-500 dark:text-slate-400">
                                        Ghi chú được lưu khi chỉnh sửa tài liệu
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDetailNote(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-3 py-1">
                            {/* File Name */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400 block mb-1">
                                    Tên tệp
                                </label>
                                <div className="text-[13px] font-normal text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-gray-200/60 dark:border-slate-700 truncate">
                                    {selectedDetailNote.fileName}
                                </div>
                            </div>

                            {/* Actor & Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400 block mb-1">
                                        Người chỉnh sửa
                                    </label>
                                    <div className="text-[12.5px] text-gray-800 dark:text-slate-200">
                                        {selectedDetailNote.isCurrentUser ? 'Bạn' : selectedDetailNote.actorName}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400 block mb-1">
                                        Thời gian
                                    </label>
                                    <div className="text-[12.5px] text-gray-800 dark:text-slate-200">
                                        {selectedDetailNote.formattedTime}
                                    </div>
                                </div>
                            </div>

                            {/* Edit description (Mục đích nó là ở đây) */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400 block mb-1">
                                    Mục đích / Nội dung chỉnh sửa đã ghi
                                </label>
                                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-800/70 text-[13px] text-gray-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                                    {selectedDetailNote.changeDescription || 'Không có mô tả chi tiết'}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setSelectedDetailNote(null)}
                                className="px-5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-[13px] font-medium transition cursor-pointer shadow-xs"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
