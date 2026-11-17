'use client';

import React, { useState, useEffect, useRef } from 'react';
import { History, X, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import fileManagementService, { FileVersionDto } from '@/services/files/fileManagementService';

interface VersionManagementModalProps {
    file: {
        id: string | number;
        name: string;
        [key: string]: any;
    };
    onClose: () => void;
    onVersionUploaded?: () => void;
}

export function VersionManagementModal({
    file,
    onClose,
    onVersionUploaded,
}: VersionManagementModalProps) {
    const [versions, setVersions] = useState<FileVersionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await fileManagementService.getFileVersions(file.id);
            setVersions(data);
        } catch (err: any) {
            console.error('Failed to load file versions:', err);
            toast.error('Không thể tải danh sách phiên bản');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVersions();
    }, [file.id]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const pickedFile = e.target.files?.[0];
        if (!pickedFile) return;

        setUploading(true);
        const toastId = toast.loading('Đang tải lên phiên bản mới...');
        try {
            await fileManagementService.uploadNewVersion(file.id, pickedFile);
            toast.success('Đã tải lên phiên bản mới thành công!', { id: toastId });
            await loadVersions();
            if (onVersionUploaded) onVersionUploaded();
        } catch (err: any) {
            console.error('Failed to upload version:', err);
            toast.error('Tải lên phiên bản mới thất bại: ' + (err?.message || ''), { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownloadVersion = async (version: FileVersionDto) => {
        try {
            toast.loading(`Đang tạo liên kết tải xuống phiên bản ${version.versionNo}...`, { id: `dl-v-${version.id}` });
            const tokenRes = await fileManagementService.createDownloadToken(file.id);
            const targetUrl = tokenRes.directUrl || (tokenRes.downloadUrl?.startsWith('http') ? tokenRes.downloadUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${tokenRes.downloadUrl}`);
            const a = document.createElement('a');
            a.href = targetUrl;
            a.download = `v${version.versionNo}_${file.name}`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`Đang tải xuống phiên bản ${version.versionNo}`, { id: `dl-v-${version.id}` });
        } catch (err: any) {
            toast.error('Lỗi khi tải phiên bản', { id: `dl-v-${version.id}` });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Quản lý phiên bản</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs">{file.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div>
                            <p className="text-xs font-medium text-gray-800 dark:text-slate-200">Tải lên phiên bản mới</p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">Thêm phiên bản mới mà vẫn giữ nguyên liên kết và phân quyền của tệp</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploading ? 'Đang tải...' : 'Tải lên'}</span>
                        </button>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Lịch sử phiên bản</h3>
                        {loading ? (
                            <div className="py-8 text-center text-xs text-gray-400">Đang tải danh sách phiên bản...</div>
                        ) : versions.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-400">Chưa có thông tin phiên bản</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                {versions.map((v) => (
                                    <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition">
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-300 font-bold text-xs shrink-0 mt-0.5">
                                                v{v.versionNo}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-800 dark:text-slate-200">
                                                        Phiên bản {v.versionNo}
                                                    </span>
                                                    {v.isCurrent && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                                                            Hiện tại
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                                    {v.uploadedByName || v.uploadedByEmail || 'Người dùng'} • {v.sizeFormatted || `${v.sizeBytes} B`} • {v.createdAt ? new Date(v.createdAt).toLocaleString('vi-VN') : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadVersion(v)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                            title="Tải xuống phiên bản này"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end bg-gray-50/50 dark:bg-slate-800/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
export default VersionManagementModal;
