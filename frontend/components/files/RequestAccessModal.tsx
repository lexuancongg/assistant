'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FileText, Folder, Loader2, ChevronDown, Check, Clock, CheckCircle2 } from 'lucide-react';
import accessRequestService from '@/services/access/accessRequestService';
import fileManagementService from '@/services/files/fileManagementService';
import forderService from '@/services/forder/forderService';
import toast from 'react-hot-toast';

interface RequestAccessModalProps {
    isOpen: boolean;
    folderId?: number | string;
    folderName?: string;
    fileId?: number | string;
    fileName?: string;
    onClose: () => void;
}

export default function RequestAccessModal({
    isOpen,
    folderId,
    folderName,
    fileId,
    fileName,
    onClose,
}: RequestAccessModalProps) {
    const [reason, setReason] = useState('');
    const [level, setLevel] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [realName, setRealName] = useState<string>(fileName || folderName || '');
    const [hasPending, setHasPending] = useState(false);
    const [checkingPending, setCheckingPending] = useState(true);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Kiểm tra xem đã có yêu cầu PENDING chưa và lấy thông tin đối tượng
    useEffect(() => {
        if (!isOpen) return;

        setCheckingPending(true);
        // Check trùng lặp request đang chờ duyệt
        accessRequestService.checkPending(fileId, folderId)
            .then((pending) => {
                setHasPending(pending);
            })
            .catch(() => {})
            .finally(() => {
                setCheckingPending(false);
            });

        if (fileName) {
            setRealName(fileName);
            return;
        }
        if (folderName) {
            setRealName(folderName);
            return;
        }

        if (fileId) {
            fileManagementService.getFilePublicInfo(fileId)
                .then((info) => {
                    if (info?.name) setRealName(info.name);
                })
                .catch(() => {});
        } else if (folderId) {
            forderService.getFolderPublicInfo(folderId)
                .then((info) => {
                    if (info?.name) setRealName(info.name);
                })
                .catch(() => {});
        }
    }, [isOpen, fileId, fileName, folderId, folderName]);

    if (!isOpen) return null;

    const isFolder = !!folderId;
    const displayName = realName || (isFolder ? 'Thư mục' : 'Tài liệu');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await accessRequestService.createRequest({
                folderId,
                folderName: isFolder ? displayName : undefined,
                fileId,
                fileName: !isFolder ? displayName : undefined,
                reason: reason.trim() || 'Xin cấp quyền truy cập tài liệu',
                requestedLevel: level,
            });
            toast.success('Đã gửi yêu cầu cấp quyền thành công!');
            setHasPending(true);
            setReason('');
            setIsDropdownOpen(false);
        } catch (err: any) {
            const errorMsg = err?.message || 'Không thể gửi yêu cầu cấp quyền. Vui lòng thử lại sau.';
            toast.error(errorMsg);
            if (errorMsg.includes('đang chờ duyệt')) {
                setHasPending(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div 
                className="w-full max-w-[440px] bg-white dark:bg-[#1E1F20] rounded-[24px] shadow-[0_4px_28px_rgba(0,0,0,0.22)] p-6 text-[#1F1F1F] dark:text-[#E3E3E3] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header chuẩn Google Drive */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-[21px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                            {hasPending ? 'Yêu cầu đang chờ duyệt' : 'Bạn cần có quyền truy cập'}
                        </h2>
                        <p className="text-[13px] text-[#444746] dark:text-[#C4C7C5] mt-1">
                            {hasPending
                                ? 'Yêu cầu của bạn đã được ghi nhận và đang chờ xem xét.'
                                : 'Gửi yêu cầu tới người quản lý để được cấp quyền truy cập.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#444746] dark:text-neutral-400 hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 transition cursor-pointer shrink-0 -mr-1 -mt-1"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {checkingPending ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#0B57D0]" />
                        <span className="text-xs">Đang kiểm tra quyền...</span>
                    </div>
                ) : hasPending ? (
                    /* GIAO DIỆN KHI ĐÃ GỬI YÊU CẦU: KHÔNG HIỂN THỊ FORM NỮA */
                    <div className="mt-5 space-y-4">
                        {/* Tên tệp / thư mục */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] bg-[#E8F0FE] dark:bg-[#041E49]/40 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3]">
                            {isFolder ? (
                                <Folder className="w-4 h-4 text-[#0B57D0] fill-current shrink-0" />
                            ) : (
                                <FileText className="w-4 h-4 text-[#0B57D0] shrink-0" />
                            )}
                            <span className="font-medium truncate" title={displayName}>
                                {displayName}
                            </span>
                        </div>

                        {/* Thẻ trạng thái chờ duyệt */}
                        <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-[#F0F4F9] dark:bg-neutral-800/70 border border-[#DADCE0] dark:border-neutral-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                <Clock className="w-4 h-4 text-[#0B57D0] dark:text-blue-400" />
                            </div>
                            <div className="text-[13px] leading-relaxed">
                                <p className="font-medium text-[#1F1F1F] dark:text-white">
                                    Đã gửi yêu cầu cấp quyền
                                </p>
                                <p className="mt-0.5 text-[12.5px] text-[#5F6368] dark:text-neutral-400">
                                    Bạn đã gửi yêu cầu truy cập cho mục này. Chủ sở hữu hoặc Quản trị viên sẽ xem xét và cấp quyền cho bạn sớm nhất.
                                </p>
                            </div>
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center justify-end pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] active:scale-[0.98] text-white text-[13.5px] font-medium transition cursor-pointer shadow-none"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                ) : (
                    /* FORM NHẬP YÊU CẦU: CHỈ HIỂN THỊ KHI CHƯA GỬI */
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        {/* Tên tệp / thư mục */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] bg-[#E8F0FE] dark:bg-[#041E49]/40 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3]">
                            {isFolder ? (
                                <Folder className="w-4 h-4 text-[#0B57D0] fill-current shrink-0" />
                            ) : (
                                <FileText className="w-4 h-4 text-[#0B57D0] shrink-0" />
                            )}
                            <span className="font-medium truncate" title={displayName}>
                                {displayName}
                            </span>
                        </div>

                        {/* Quyền mong muốn & Dropdown Custom Google Drive */}
                        <div className="flex items-center justify-between py-0.5 relative" ref={dropdownRef}>
                            <span className="text-[13px] text-[#444746] dark:text-neutral-300">
                                Quyền mong muốn
                            </span>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#EDF2FA] hover:bg-[#E2E8F0] dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1F1F1F] dark:text-[#E3E3E3] text-[13px] font-medium transition cursor-pointer select-none"
                                >
                                    <span>{level === 'VIEWER' ? 'Người xem' : 'Người chỉnh sửa'}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-neutral-400" />
                                </button>

                                {/* Dropdown Menu popover theo đúng style Google Drive */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#282A2C] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-neutral-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                                        <div className="px-4 py-1 text-[11px] font-semibold text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider select-none">
                                            VAI TRÒ
                                        </div>

                                        {/* Option Người xem */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLevel('VIEWER');
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F0F4F9] dark:hover:bg-neutral-700/60 transition cursor-pointer text-left"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                {level === 'VIEWER' && (
                                                    <Check className="w-4 h-4 text-[#0B57D0]" />
                                                )}
                                            </div>
                                            <span className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                Người xem
                                            </span>
                                        </button>

                                        {/* Option Người chỉnh sửa */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLevel('EDITOR');
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F0F4F9] dark:hover:bg-neutral-700/60 transition cursor-pointer text-left"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                {level === 'EDITOR' && (
                                                    <Check className="w-4 h-4 text-[#0B57D0]" />
                                                )}
                                            </div>
                                            <span className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                Người chỉnh sửa
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lời nhắn (không bắt buộc) */}
                        <div>
                            <textarea
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Lời nhắn (không bắt buộc)"
                                className="w-full h-[62px] bg-transparent border border-[#747775] hover:border-[#1F1F1F] dark:border-neutral-600 dark:hover:border-neutral-400 focus:!border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0] rounded-[6px] px-3 py-2 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] outline-none transition resize-none placeholder-[#747775]"
                            />
                        </div>

                        {/* Footer Buttons chuẩn Google Drive */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-full text-[13.5px] font-medium text-[#0B57D0] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 transition cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] active:scale-[0.98] text-white text-[13.5px] font-medium transition cursor-pointer disabled:opacity-50 shadow-none"
                            >
                                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>Yêu cầu</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
