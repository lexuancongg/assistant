'use client';

import { useState } from 'react';
import { X, KeyRound, Folder, FileText, Send, RefreshCw } from 'lucide-react';
import accessRequestService from '@/services/access/accessRequestService';
import toast from 'react-hot-toast';

interface RequestAccessModalProps {
    isOpen: boolean;
    folderId?: number;
    folderName?: string;
    fileId?: string;
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
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do xin cấp quyền');
            return;
        }

        setSubmitting(true);
        try {
            await accessRequestService.createRequest({
                folderId,
                folderName,
                fileId,
                fileName,
                reason: reason.trim(),
                requestedLevel: level,
            });
            toast.success('Đã gửi yêu cầu cấp quyền thành công! Quản trị viên sẽ xem xét.');
            onClose();
            setReason('');
        } catch (err) {
            toast.error('Không thể gửi yêu cầu cấp quyền. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Yêu cầu quyền truy cập</h2>
                            <p className="text-[11px] text-gray-400">Gửi đề xuất tới Quản trị viên để được cấp quyền</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="py-3 space-y-3">
                    {/* Target Information */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            Mục tiêu xin cấp quyền
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            {folderId ? (
                                <>
                                    <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-xs font-semibold text-gray-800 truncate">
                                        {folderName || `Thư mục #${folderId}`}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-xs font-semibold text-gray-800 truncate">
                                        {fileName || `Tài liệu #${fileId}`}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Level selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Mức quyền mong muốn</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setLevel('VIEWER')}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                                    level === 'VIEWER'
                                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-1 ring-blue-600/30'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <p className="font-semibold">Chỉ xem & tải</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Xem nội dung và tải về máy</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setLevel('EDITOR')}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                                    level === 'EDITOR'
                                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-1 ring-blue-600/30'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <p className="font-semibold">Chỉnh sửa</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Toàn quyền thêm/sửa/xóa</p>
                            </button>
                        </div>
                    </div>

                    {/* Reason input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">
                            Lý do cần truy cập <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ví dụ: Tôi cần tra cứu số liệu hợp đồng để lập báo cáo tài chính quý 3..."
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                        >
                            {submitting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                            Gửi yêu cầu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}