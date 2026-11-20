'use client';

import React, { useState, useEffect } from 'react';
import { 
    Sparkles, 
    X, 
    RefreshCw, 
    Copy, 
    Check, 
    Download, 
    FileText, 
    ShieldCheck, 
    Building2, 
    Calendar, 
    DollarSign, 
    Edit3, 
    Save, 
    AlertCircle,
    Info,
    Receipt,
    Mail,
    FileSpreadsheet
} from 'lucide-react';
import fileManagementService from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';

interface FileExtractionModalProps {
    file: {
        id: number | string;
        name: string;
        fileType?: string;
        storagePath?: string;
    };
    onClose: () => void;
}

const DOC_TYPE_LABELS: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    CONTRACT: {
        label: 'Hợp đồng (Contract)',
        color: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
        icon: FileText
    },
    INVOICE: {
        label: 'Hóa đơn (Invoice)',
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
        icon: Receipt
    },
    EMAIL: {
        label: 'Email / Thư từ',
        color: 'text-sky-700 dark:text-sky-300',
        bgColor: 'bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
        icon: Mail
    },
    OTHER: {
        label: 'Tài liệu chung / Khác',
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
        icon: FileSpreadsheet
    }
};

const FIELD_LABELS: Record<string, string> = {
    // Contract
    partyA: 'Bên A (Bên phát hành/chủ quản)',
    partyB: 'Bên B (Đối tác/khách hàng)',
    partyARepresentative: 'Đại diện bên A',
    partyBRepresentative: 'Đại diện bên B',
    contractNumber: 'Số hợp đồng',
    contractType: 'Loại hợp đồng',
    signedDate: 'Ngày ký',
    startDate: 'Ngày hiệu lực',
    endDate: 'Ngày hết hạn',
    durationMonths: 'Thời hạn (tháng)',
    totalContractValue: 'Tổng giá trị hợp đồng',
    recurringAmount: 'Số tiền định kỳ',
    recurringPeriod: 'Chu kỳ thanh toán',
    deposit: 'Tiền đặt cọc',
    currency: 'Loại tiền tệ',
    paymentTerms: 'Điều khoản thanh toán',
    autoRenew: 'Tự động gia hạn',
    noticeDays: 'Thời hạn báo trước (ngày)',

    // Invoice
    invoiceNumber: 'Số hóa đơn',
    supplier: 'Đơn vị bán / Nhà cung cấp',
    taxCode: 'Mã số thuế',
    invoiceDate: 'Ngày hóa đơn',
    dueDate: 'Hạn thanh toán',
    amount: 'Tiền trước thuế',
    vat: 'Tiền thuế VAT',
    totalAmount: 'Tổng tiền thanh toán',

    // Email
    sender: 'Người gửi',
    receiver: 'Người nhận',
    subject: 'Tiêu đề',
    category: 'Phân loại',
    priority: 'Độ ưu tiên',
    sentAt: 'Thời gian gửi'
};

export default function FileExtractionModal({ file, onClose }: FileExtractionModalProps) {
    const [loading, setLoading] = useState(true);
    const [extracting, setExtracting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editDocType, setEditDocType] = useState('OTHER');
    const [editSummary, setEditSummary] = useState('');
    const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData(false);
    }, [file.id]);

    const loadData = async (force: boolean) => {
        try {
            if (force) {
                setExtracting(true);
            } else {
                setLoading(true);
            }

            // First check if already extracted
            let res = await fileManagementService.getFileExtraction(file.id);
            if (!res || force) {
                // Trigger AI extraction
                res = await fileManagementService.extractFileData(file.id, force);
                toast.success('Bóc tách dữ liệu AI thành công!');
            }
            setData(res);
            if (res) {
                setEditDocType(res.documentType || 'OTHER');
                setEditSummary(res.summary || '');
                setEditMetadata(res.metadata || {});
            }
        } catch (err: any) {
            console.error('Failed to extract file data:', err);
            toast.error(err?.message || 'Không thể trích xuất dữ liệu');
        } finally {
            setLoading(false);
            setExtracting(false);
        }
    };

    const handleCopy = (text: string, fieldKey: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success(`Đã sao chép: ${text.slice(0, 30)}...`);
    };

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            const res = await fileManagementService.updateFileExtraction(file.id, {
                documentType: editDocType,
                summary: editSummary,
                metadata: editMetadata
            });
            setData(res);
            setIsEditing(false);
            toast.success('Đã lưu thông tin chỉnh sửa!');
        } catch (err: any) {
            toast.error(err?.message || 'Không thể lưu chỉnh sửa');
        } finally {
            setSaving(false);
        }
    };

    const handleExportJson = () => {
        if (!data) return;
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extraction_${file.name.replace(/\.[^/.]+$/, '')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        if (!data || !data.metadata) return;
        const rows: string[] = ['Thuộc tính,Giá trị'];
        rows.push(`"Loại tài liệu","${data.documentType || ''}"`);
        rows.push(`"Tóm tắt","${(data.summary || '').replace(/"/g, '""')}"`);
        Object.entries(data.metadata).forEach(([k, v]) => {
            const label = FIELD_LABELS[k] || k;
            const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
            rows.push(`"${label.replace(/"/g, '""')}","${valStr.replace(/"/g, '""')}"`);
        });
        const csvContent = '\uFEFF' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extraction_${file.name.replace(/\.[^/.]+$/, '')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const docTypeInfo = DOC_TYPE_LABELS[data?.documentType || 'OTHER'] || DOC_TYPE_LABELS.OTHER;
    const DocIcon = docTypeInfo.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div 
                className="bg-white dark:bg-[#1E1F22] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/50 via-white to-blue-50/40 dark:from-purple-950/20 dark:via-slate-900 dark:to-blue-950/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                    Khai thác dữ liệu thông minh (AI Extract)
                                </h3>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                                    Gemini 3.1
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-md" title={file.name}>
                                Tệp: <span className="font-medium text-gray-700 dark:text-slate-300">{file.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadData(true)}
                            disabled={extracting || loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                            title="Yêu cầu AI phân tích và bóc tách lại từ đầu"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${extracting ? 'animate-spin text-purple-600' : ''}`} />
                            <span>{extracting ? 'Đang bóc tách...' : 'Bóc tách lại'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full border-4 border-purple-100 dark:border-purple-950 border-t-purple-600 animate-spin" />
                                <Sparkles className="w-6 h-6 text-purple-600 absolute inset-0 m-auto" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Đang bóc tách và phân loại tài liệu...
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    AI đang đọc cấu trúc, phát hiện thực thể và các điều khoản có giá trị
                                </p>
                            </div>
                        </div>
                    ) : !data ? (
                        <div className="py-12 text-center space-y-3">
                            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                            <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                                Chưa có dữ liệu bóc tách cho tài liệu này.
                            </p>
                            <button
                                type="button"
                                onClick={() => loadData(true)}
                                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition cursor-pointer shadow-xs"
                            >
                                Bắt đầu bóc tách bằng AI
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Summary & DocType Top Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Doc Type Card */}
                                <div className={`p-4 rounded-xl border ${docTypeInfo.bgColor} flex items-center gap-3`}>
                                    <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                                        <DocIcon className={`w-5 h-5 ${docTypeInfo.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                            Phân loại tài liệu
                                        </p>
                                        <p className={`text-sm font-semibold truncate ${docTypeInfo.color}`}>
                                            {docTypeInfo.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Confidence Score */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                            Độ tin cậy của AI
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                {Math.round((data.confidence ?? 0.95) * 100)}%
                                            </span>
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                                (Rất cao)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Extractor Info */}
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                            Lần cập nhật cuối
                                        </p>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                                            {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <span>Tóm tắt nội dung cốt lõi (Executive Summary)</span>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center gap-1 text-[11.5px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Chỉnh sửa thông tin</span>
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editSummary}
                                        onChange={(e) => setEditSummary(e.target.value)}
                                        rows={3}
                                        className="w-full text-xs p-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-normal">
                                        {data.summary || 'Chưa có bản tóm tắt nội dung.'}
                                    </p>
                                )}
                            </div>

                            {/* Structured Attributes Table */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Các thuộc tính bóc tách có cấu trúc ({Object.keys(data.metadata || {}).length} trường)
                                    </h4>
                                    {isEditing && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 rounded-md cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md cursor-pointer shadow-xs disabled:opacity-50"
                                            >
                                                <Save className="w-3 h-3" />
                                                <span>{saving ? 'Đang lưu...' : 'Lưu lại'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs">
                                    {Object.keys(data.metadata || {}).length === 0 ? (
                                        <div className="p-6 text-center text-xs text-gray-500 dark:text-slate-400">
                                            Không phát hiện thuộc tính đặc thù trong văn bản này.
                                        </div>
                                    ) : (
                                        Object.entries(data.metadata || {}).map(([key, val]) => {
                                            const label = FIELD_LABELS[key] || key;
                                            const displayVal = val === null || val === undefined 
                                                ? '—' 
                                                : typeof val === 'object' 
                                                    ? JSON.stringify(val) 
                                                    : String(val);

                                            return (
                                                <div 
                                                    key={key} 
                                                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition gap-4 text-xs"
                                                >
                                                    <div className="w-1/3 min-w-[150px] font-medium text-gray-600 dark:text-slate-400">
                                                        {label}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editMetadata[key] ?? ''}
                                                                onChange={(e) => setEditMetadata({
                                                                    ...editMetadata,
                                                                    [key]: e.target.value
                                                                })}
                                                                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                                            />
                                                        ) : (
                                                            <span className={`font-normal ${displayVal === '—' ? 'text-gray-400 italic' : 'text-gray-900 dark:text-slate-100'}`}>
                                                                {displayVal}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!isEditing && displayVal !== '—' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(displayVal, key)}
                                                            className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded transition cursor-pointer shrink-0"
                                                            title="Sao chép giá trị"
                                                        >
                                                            {copiedField === key ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2">
                        {data && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleExportCsv}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 transition cursor-pointer shadow-2xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Xuất CSV / Excel</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportJson}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 transition cursor-pointer shadow-2xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Xuất JSON</span>
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-1.5 rounded-full bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-medium transition cursor-pointer shadow-xs"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
