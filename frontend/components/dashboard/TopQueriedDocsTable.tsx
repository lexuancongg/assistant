import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, ArrowRight, Lock, Shield, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { TopDocDto } from '@/services/dashboard/dashboardService';

interface TopQueriedDocsTableProps {
    totalFiles?: number;
    documents?: TopDocDto[];
}

export default function TopQueriedDocsTable({ totalFiles = 28, documents }: TopQueriedDocsTableProps) {
    const router = useRouter();
    const docs = documents && documents.length > 0 ? documents : [];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        Tài liệu tra cứu nhiều nhất tuần này
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Tài liệu được nhân viên tra cứu và trích xuất thông tin nhiều nhất
                    </p>
                </div>
                <Link
                    href="/files"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    <span>Xem tất cả {totalFiles.toLocaleString()} file</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-xs min-w-[650px] border-collapse">
                    <thead>
                        <tr className="border-y border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-4 text-left font-semibold">Tên tài liệu</th>
                            <th className="py-2.5 px-3 text-left font-semibold whitespace-nowrap">Phòng ban</th>
                            <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">Quyền truy cập</th>
                            <th className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">Lượt trích dẫn</th>
                            <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">Độ hữu ích</th>
                            <th className="py-2.5 px-4 text-right font-semibold whitespace-nowrap">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                        {docs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                                    Chưa có tài liệu nào trong hệ thống
                                </td>
                            </tr>
                        ) : (
                            docs.map((doc) => (
                                <tr
                                    key={doc.id}
                                    onClick={() => router.push('/files')}
                                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                >
                                    {/* Name & Format */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                                                    doc.format === 'pdf'
                                                        ? 'bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                                                        : doc.format === 'docx'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                                                }`}
                                            >
                                                {doc.format}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[220px] md:max-w-[280px] lg:max-w-[340px]">
                                                    {doc.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                                                    {doc.version} • {doc.size}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Department */}
                                    <td className="py-3 px-3 text-gray-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-[11px]">
                                            {doc.department || 'Chung'}
                                        </span>
                                    </td>

                                    {/* RBAC Badge */}
                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                                doc.rbac.type === 'confidential'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
                                                    : doc.rbac.type === 'restricted' || doc.rbac.type === 'internal'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
                                            }`}
                                        >
                                            {doc.rbac.type === 'confidential' && <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                                            {(doc.rbac.type === 'restricted' || doc.rbac.type === 'internal') && <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                                            {doc.rbac.type === 'public' && <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                            {doc.rbac.label}
                                        </span>
                                    </td>

                                    {/* RAG queries */}
                                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 dark:text-slate-100 text-xs">
                                        {doc.ragQueries.toLocaleString()}
                                    </td>

                                    {/* Helpfulness */}
                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                        {doc.helpfulness === 'N/A' ? (
                                            <span className="text-gray-400 dark:text-slate-500 text-xs">Chưa có</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40">
                                                {doc.helpfulness}
                                            </span>
                                        )}
                                    </td>

                                    {/* Action */}
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push('/files');
                                            }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                                            title="Xem chi tiết tài liệu"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
