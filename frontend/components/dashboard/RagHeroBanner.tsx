'use client';

import React, { useState } from 'react';
import { RefreshCw, Download, Plus, ShieldCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface RagHeroBannerProps {
    userName?: string;
    userRole?: string;
    departmentName?: string | { name?: string } | null;
    totalFiles?: number;
    indexedFiles?: number;
    accuracy?: number | null;
    latencyMs?: number | null;
    qdrantStatus?: string;
    onUploadClick?: () => void;
    onReindex?: () => void;
}

const exportWeeklyDocxReport = (options: {
    companyName: string;
    totalFiles: number;
    indexedFiles: number;
    accuracy: number | null;
    avgLatencyMs: number | null;
    qdrantStatus: string;
    generatedBy: string;
}) => {
    // Stub for exporting docx report
    console.log('Exporting report:', options);
};

export default function RagHeroBanner({
    userName = '',
    userRole = '',
    departmentName = '',
    totalFiles = 0,
    indexedFiles = 0,
    accuracy = null,
    latencyMs = null,
    qdrantStatus = 'OPERATIONAL',
    onUploadClick,
    onReindex,
}: RagHeroBannerProps) {
    const [isReindexing, setIsReindexing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleReindex = () => {
        setIsReindexing(true);
        if (onReindex) onReindex();
        setTimeout(() => setIsReindexing(false), 800);
    };

    const handleExport = () => {
        setIsExporting(true);
        try {
            exportWeeklyDocxReport({
                companyName: 'DocuEnterprise',
                totalFiles,
                indexedFiles,
                accuracy,
                avgLatencyMs: latencyMs,
                qdrantStatus,
                generatedBy: userName || 'Admin',
            });
            toast.success('Đã tải xuống báo cáo tổng quan Word (.docx)!');
        } catch (e) {
            console.error(e);
            toast.error('Không thể tạo file báo cáo Word');
        } finally {
            setIsExporting(false);
        }
    };

    const deptDisplay = (typeof departmentName === 'object' && departmentName !== null && 'name' in departmentName)
        ? (departmentName.name || '')
        : (typeof departmentName === 'string' ? departmentName : '');

    const cleanName = userName ? userName.replace(/\s*\((Admin|User|Manager)\)/gi, '').trim() : '';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xs p-5 sm:p-6 transition-colors duration-200">
            {/* Background subtle gradient accents */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50/50 dark:bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-60 -bottom-20 w-60 h-60 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Greeting and Status Badges */}
                <div className="space-y-1.5 min-w-0">
                    {/* Main Greeting */}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                        Chào buổi sáng{cleanName ? `, ${cleanName}` : ''}
                    </h1>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {qdrantStatus && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                qdrantStatus.toLowerCase().includes('offline') || qdrantStatus.toLowerCase().includes('lỗi') || qdrantStatus.toLowerCase().includes('timeout')
                                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800/60'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    qdrantStatus.toLowerCase().includes('offline') || qdrantStatus.toLowerCase().includes('lỗi') || qdrantStatus.toLowerCase().includes('timeout')
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500 animate-pulse'
                                }`}></span>
                                {qdrantStatus.toUpperCase() === 'OPERATIONAL' ? 'Hệ thống AI: Sẵn sàng' : `Trạng thái AI: ${qdrantStatus}`}
                            </div>
                        )}

                        {deptDisplay && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                {deptDisplay}
                            </div>
                        )}

                        {latencyMs != null && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                                <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                Phản hồi: {latencyMs}ms
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    <button
                        type="button"
                        onClick={handleReindex}
                        disabled={isReindexing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isReindexing ? 'animate-spin' : ''}`} />
                        <span>Đồng bộ tri thức AI</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                        <span>Xuất báo cáo (.docx)</span>
                    </button>

                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Tải lên tài liệu</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
