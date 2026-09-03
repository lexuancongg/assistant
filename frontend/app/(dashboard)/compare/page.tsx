'use client';

import { useState, useEffect } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import {
    GitCompare,
    Sparkles,
    FileText,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Scale,
    ShieldAlert,
    Lightbulb,
    Layers,
    RefreshCw,
    Download
} from 'lucide-react';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import compareService, { CompareResponseDto } from '@/services/compare/compareService';
import toast from 'react-hot-toast';

export default function ComparePage() {
    usePageBreadcrumb(['So sánh tài liệu AI']);

    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [file1Id, setFile1Id] = useState<string>('');
    const [file2Id, setFile2Id] = useState<string>('');
    const [focusArea, setFocusArea] = useState<string>('Toàn diện (Điều khoản, số liệu, nghĩa vụ và rủi ro)');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompareResponseDto | null>(null);

    useEffect(() => {
        fileManagementService.getActiveFiles().then(data => {
            setFiles(data);
            if (data.length >= 2) {
                setFile1Id(data[0].id);
                setFile2Id(data[1].id);
            } else if (data.length === 1) {
                setFile1Id(data[0].id);
                setFile2Id(data[0].id);
            }
        }).catch(err => console.warn('Fetch files failed:', err));
    }, []);

    const file1 = files.find(f => f.id === file1Id);
    const file2 = files.find(f => f.id === file2Id);

    const handleCompare = async () => {
        if (!file1Id || !file2Id) {
            toast.error('Vui lòng chọn đủ 2 tài liệu để so sánh');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const data = await compareService.compare({
                file1Name: file1?.name || 'Tài liệu 1',
                file2Name: file2?.name || 'Tài liệu 2',
                focusArea: focusArea
            });
            setResult(data);
            toast.success('Đã hoàn tất phân tích đối soát 2 tài liệu!');
        } catch (err: any) {
            console.error('Compare failed:', err);
            toast.error('Lỗi khi so sánh tài liệu');
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadge = (risk?: string) => {
        const r = (risk || '').toUpperCase();
        if (r.includes('CAO') || r === 'HIGH') {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200/70 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-600"/> Rủi ro Cao</span>;
        }
        if (r.includes('TRUNG') || r === 'MEDIUM') {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600"/> Rủi ro Trung bình</span>;
        }
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600"/> Rủi ro Thấp</span>;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ADDED':
                return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800">Thêm mới</span>;
            case 'REMOVED':
                return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-red-100 text-red-800">Bị xóa</span>;
            default:
                return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800">Chỉnh sửa</span>;
        }
    };

    const handleExportReport = () => {
        if (!result) return;
        const f1 = files.find(f => f.id === file1Id)?.name || 'Tài liệu 1';
        const f2 = files.find(f => f.id === file2Id)?.name || 'Tài liệu 2';

        const lines = [
            `# BÁO CÁO ĐỐI SOÁT & THẨM ĐỊNH TÀI LIỆU AI`,
            `*Tài liệu gốc (A):* ${f1}`,
            `*Tài liệu đối chiếu (B):* ${f2}`,
            `*Thời gian lập báo cáo:* ${new Date().toLocaleString('vi-VN')}`,
            `*Độ tương đồng:* ${result.similarityScore}% | *Mức độ rủi ro:* ${result.riskLevel}`,
            `\n---\n`,
            `## 1. TÓM TẮT NHẬN ĐỊNH CỦA CHUYÊN GIA AI`,
            `${result.summary}\n`,
            `## 2. BẢNG ĐỐI SOÁT CHI TIẾT TỪNG ĐIỀU KHOẢN`,
            `| Điều khoản | ${f1} | ${f2} | Trạng thái | Rủi ro |`,
            `| :--- | :--- | :--- | :--- | :--- |`,
        ];

        result.differences.forEach((d) => {
            lines.push(`| **${d.clause}** | ${d.file1 || '-'} | ${d.file2 || '-'} | ${d.status} | ${d.risk || '-'} |`);
        });

        lines.push(`\n## 3. KHUYẾN NGHỊ XỬ LÝ & ĐÀM PHÁN`);
        result.recommendations.forEach((rec, idx) => {
            lines.push(`${idx + 1}. ${rec}`);
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bao_Cao_Tham_Dinh_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã tải báo cáo thẩm định thành công!');
    };

    return (
        <div className="px-6 pt-5 pb-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        So sánh & Thẩm định Tài liệu AI
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Semantic Contract Diff
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Đối soát 2 phiên bản tài liệu/hợp đồng, tự động phát hiện rủi ro, điều khoản bị sửa đổi hoặc cắt giảm
                    </p>
                </div>
            </div>

            {/* Selection Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* File 1 */}
                    <div className="md:col-span-4 space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Tài liệu 1 (Bản gốc / Phiên bản A)
                        </label>
                        <select
                            value={file1Id}
                            onChange={(e) => setFile1Id(e.target.value)}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 transition"
                        >
                            {files.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.fileType?.toUpperCase()})</option>
                            ))}
                        </select>
                    </div>

                    {/* Icon compare */}
                    <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <GitCompare className="w-4 h-4" />
                        </div>
                    </div>

                    {/* File 2 */}
                    <div className="md:col-span-4 space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Tài liệu 2 (Bản đối chiếu / Phiên bản B)
                        </label>
                        <select
                            value={file2Id}
                            onChange={(e) => setFile2Id(e.target.value)}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 transition"
                        >
                            {files.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.fileType?.toUpperCase()})</option>
                            ))}
                        </select>
                    </div>

                    {/* Action */}
                    <div className="md:col-span-3 flex flex-col justify-end space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Trọng tâm đối soát</label>
                        <select
                            value={focusArea}
                            onChange={(e) => setFocusArea(e.target.value)}
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 transition"
                        >
                            <option value="Toàn diện (Điều khoản, số liệu, nghĩa vụ và rủi ro)">Toàn diện</option>
                            <option value="Điều khoản thanh toán & Giá trị hợp đồng">Thanh toán & Chi phí</option>
                            <option value="Rủi ro pháp lý & Phạt vi phạm">Pháp lý & Chế tài</option>
                            <option value="Trách nhiệm & Quyền hạn các bên">Nghĩa vụ các bên</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleCompare}
                        disabled={loading || !file1Id || !file2Id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                AI đang phân tích và đối soát 2 tài liệu...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                Tiến hành So sánh bằng AI
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Summary Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Kết quả Thẩm định & Đối soát Tổng quan
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Bản phân tích được tổng hợp bởi AI Enterprise Engine</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span className="text-[11px] text-gray-400 font-medium block">Độ tương đồng</span>
                                    <span className="text-sm font-bold text-blue-600">{result.similarityScore}%</span>
                                </div>
                                <div>{getRiskBadge(result.riskLevel)}</div>
                                <button
                                    onClick={handleExportReport}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold shadow-xs transition ml-2"
                                    title="Tải báo cáo đối soát"
                                >
                                    <Download className="w-3.5 h-3.5 text-blue-600" />
                                    Tải Báo cáo (.md)
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-800 leading-relaxed mt-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                            {result.summary}
                        </p>
                    </div>

                    {/* Detailed Differences Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" />
                                Bảng Đối soát Chi tiết Các Điều khoản Thay đổi ({result.differences.length} hạng mục)
                            </h3>
                            <span className="text-xs text-gray-400 font-medium">Đối chiếu song song</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                                        <th className="py-3 px-4 w-1/4">Hạng mục / Điều khoản</th>
                                        <th className="py-3 px-4 w-1/3 text-blue-800 bg-blue-50/30">Bản 1: {file1?.name}</th>
                                        <th className="py-3 px-4 w-1/3 text-amber-800 bg-amber-50/30">Bản 2: {file2?.name}</th>
                                        <th className="py-3 px-4 text-center">Trạng thái & Rủi ro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.differences.map((diff, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/40 transition">
                                            <td className="py-3 px-4 font-bold text-gray-900 align-top">
                                                {diff.clause}
                                            </td>
                                            <td className="py-3 px-4 text-gray-700 leading-relaxed bg-blue-50/10 align-top border-r border-gray-50">
                                                {diff.file1}
                                            </td>
                                            <td className="py-3 px-4 text-gray-700 leading-relaxed bg-amber-50/10 align-top border-r border-gray-50 font-medium">
                                                {diff.file2}
                                            </td>
                                            <td className="py-3 px-4 text-center align-top space-y-1">
                                                <div>{getStatusBadge(diff.status)}</div>
                                                <div className="text-[10px] font-semibold text-gray-400 mt-1">{diff.risk}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Similarities & Recommendations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Similarities */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Các điểm Thống nhất & Tương đồng
                            </h3>
                            <ul className="space-y-2 text-xs text-gray-700">
                                {result.similarities.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                Khuyến nghị Xử lý & Lưu ý từ Chuyên gia AI
                            </h3>
                            <ul className="space-y-2 text-xs text-gray-700">
                                {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                        <span className="font-medium text-gray-800">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
