'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import fileManagementService from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';

interface OnlyOfficeEditorModalProps {
    file: {
        id: number | string;
        name: string;
        fileType?: string;
    };
    onClose: () => void;
    onFileSaved?: () => void;
}

export default function OnlyOfficeEditorModal({
    file,
    onClose,
    onFileSaved
}: OnlyOfficeEditorModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string>('http://localhost:8083');
    const containerRef = useRef<HTMLDivElement>(null);
    const docEditorInstance = useRef<any>(null);

    // Save mode dialog states
    const [isModified, setIsModified] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [saveMode, setSaveMode] = useState<'OVERWRITE' | 'NEW_VERSION'>('OVERWRITE');
    const [changeDescription, setChangeDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initEditor = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch ONLYOFFICE Config from backend
                const configData = await fileManagementService.getOnlyOfficeConfig(file.id);
                if (!isMounted) return;

                const hostServer = configData.serverUrl || 'http://localhost:8083';
                setServerUrl(hostServer);

                // 2. Load DocsAPI script from ONLYOFFICE Document Server
                const scriptId = 'onlyoffice-api-script';
                const scriptSrc = `${hostServer}/web-apps/apps/api/documents/api.js`;

                const loadScriptPromise = new Promise<void>((resolve, reject) => {
                    if ((window as any).DocsAPI) {
                        resolve();
                        return;
                    }
                    const existingScript = document.getElementById(scriptId);
                    if (existingScript) {
                        existingScript.remove();
                    }
                    const script = document.createElement('script');
                    script.id = scriptId;
                    script.src = scriptSrc;
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Không thể kết nối đến máy chủ ONLYOFFICE Document Server tại "${hostServer}"`));
                    document.body.appendChild(script);
                });

                await loadScriptPromise;
                if (!isMounted) return;

                // 3. Initialize DocEditor
                if (containerRef.current) {
                    containerRef.current.innerHTML = '<div id="onlyoffice-inner-frame" style="width:100%;height:100%;"></div>';

                    const editorConfig = {
                        ...configData,
                        events: {
                            onDocumentStateChange: (event: any) => {
                                if (event?.data) {
                                    setIsModified(true);
                                }
                            },
                            onRequestSave: () => {
                                toast.success('Đang lưu tệp về máy chủ...');
                                if (onFileSaved) onFileSaved();
                            },
                            onError: (event: any) => {
                                console.error('[ONLYOFFICE Error]', event);
                                const errorDesc = event?.data?.description || event?.data?.message || (typeof event?.data === 'string' ? event.data : '');
                                if (errorDesc) {
                                    toast.error(`ONLYOFFICE: ${errorDesc}`);
                                }
                            }
                        }
                    };

                    docEditorInstance.current = new (window as any).DocsAPI.DocEditor('onlyoffice-inner-frame', editorConfig);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('ONLYOFFICE Init Error:', err);
                    setError(err?.message || 'Không thể khởi tạo ONLYOFFICE Editor');
                    setLoading(false);
                }
            }
        };

        initEditor();

        return () => {
            isMounted = false;
            if (docEditorInstance.current && typeof docEditorInstance.current.destroyEditor === 'function') {
                try {
                    docEditorInstance.current.destroyEditor();
                } catch (e) {}
            }
        };
    }, [file.id]);

    const handleCloseClick = () => {
        if (!isModified) {
            // Không có chỉnh sửa -> đóng trực tiếp
            onClose();
            return;
        }
        // Có chỉnh sửa -> hiển thị popup hỏi lưu
        setShowConfirmModal(true);
    };

    const handleDiscardChanges = async () => {
        try {
            setIsSaving(true);
            await fileManagementService.setOnlyOfficeSaveOptions(file.id, {
                saveMode: 'DISCARD'
            });
            toast.success('Đã hủy bỏ các thay đổi');
        } catch (e) {
            console.error('Failed to set discard option:', e);
        } finally {
            setIsSaving(false);
            setShowConfirmModal(false);
            if (docEditorInstance.current && typeof docEditorInstance.current.destroyEditor === 'function') {
                try {
                    docEditorInstance.current.destroyEditor();
                } catch (e) {}
            }
            onClose();
        }
    };

    const handleSaveAndExit = async () => {
        try {
            setIsSaving(true);
            await fileManagementService.setOnlyOfficeSaveOptions(file.id, {
                saveMode,
                changeDescription: changeDescription.trim() || undefined
            });
            toast.success('Đang lưu tài liệu...');
            if (onFileSaved) onFileSaved();
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi xảy ra khi lưu tùy chọn');
        } finally {
            setIsSaving(false);
            setShowConfirmModal(false);
            if (docEditorInstance.current && typeof docEditorInstance.current.destroyEditor === 'function') {
                try {
                    docEditorInstance.current.destroyEditor();
                } catch (e) {}
            }
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f9fafb] dark:bg-slate-900 animate-in fade-in duration-100">
            {/* Top Bar - Clean Word Online Style */}
            <header className="h-11 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-[13px] font-medium text-gray-800 dark:text-slate-100 truncate max-w-lg">
                        {file.name}
                    </span>
                    {isModified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Đã chỉnh sửa
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCloseClick}
                        title="Đóng trình soạn thảo"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Editor Container / Error View */}
            <main className="flex-1 w-full h-[calc(100vh-2.75rem)] relative overflow-hidden bg-white dark:bg-slate-950">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 z-20 gap-2.5">
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        <p className="text-[12px] text-gray-500 dark:text-slate-400">
                            Loading document...
                        </p>
                    </div>
                )}

                {error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">
                            Cannot connect to Document Server
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Could not connect to ONLYOFFICE Document Server at <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 rounded font-mono text-[11px] text-gray-800 dark:text-slate-200">{serverUrl}</code>.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-medium text-gray-700 dark:text-slate-300 transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full" />
                )}
            </main>

            {/* Save Options Confirmation Modal - True Neutral Gray Tone */}
            {showConfirmModal && (
                <div 
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150"
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div
                        className="bg-[#F2F2F2] dark:bg-[#262626] rounded-xl border border-[#E0E0E0] dark:border-[#383838] shadow-xl max-w-[380px] w-full p-5 space-y-4 animate-in zoom-in-95 duration-150 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-gray-800 dark:text-neutral-200">
                            Lưu thay đổi tài liệu
                        </h3>

                        {/* 2 input tròn nằm trên 1 hàng: Ghi đè & Phiên bản mới */}
                        <div className="flex items-center gap-6 pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-neutral-300">
                                <input
                                    type="radio"
                                    name="saveMode"
                                    value="OVERWRITE"
                                    checked={saveMode === 'OVERWRITE'}
                                    onChange={() => setSaveMode('OVERWRITE')}
                                    className="w-4 h-4 accent-gray-700 dark:accent-gray-300 cursor-pointer"
                                />
                                <span>Ghi đè</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-neutral-300">
                                <input
                                    type="radio"
                                    name="saveMode"
                                    value="NEW_VERSION"
                                    checked={saveMode === 'NEW_VERSION'}
                                    onChange={() => setSaveMode('NEW_VERSION')}
                                    className="w-4 h-4 accent-gray-700 dark:accent-gray-300 cursor-pointer"
                                />
                                <span>Phiên bản mới</span>
                            </label>
                        </div>

                        {/* Ô input nhập mô tả thay đổi: Viền xám trung tính, không màu xanh */}
                        <div>
                            <input
                                autoFocus
                                type="text"
                                value={changeDescription}
                                onChange={(e) => setChangeDescription(e.target.value)}
                                placeholder="Mô tả thay đổi..."
                                className="w-full text-xs px-3.5 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-[#1A1B1E] text-gray-800 dark:text-neutral-200 placeholder-gray-400 focus:outline-none focus:border-gray-500 dark:focus:border-neutral-400 transition"
                            />
                        </div>

                        {/* Actions tone xám trung tính */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleDiscardChanges}
                                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-200/60 dark:hover:bg-neutral-700/50 rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                                Hủy thay đổi
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleSaveAndExit}
                                className="px-4 py-1.5 text-xs font-medium bg-[#3C4043] hover:bg-[#202124] text-white dark:bg-[#E8EAED] dark:text-[#202124] dark:hover:bg-white rounded-lg transition cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu & Thoát'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
