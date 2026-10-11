'use client';

import { useState, useEffect } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import {
    Sparkles,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Layers,
    RefreshCw,
    Download,
    Search,
    FolderOpen,
    Building2,
    ArrowRightLeft,
    Eye
} from 'lucide-react';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import compareService, { CompareResponseDto } from '@/services/compare/compareService';
import FilePickerModal from '@/components/compare/FilePickerModal';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import DiffViewer from '@/components/compare/DiffViewer';
import toast from 'react-hot-toast';

export default function ComparePage() {
    usePageBreadcrumb(['So sánh tài liệu AI']);

    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [file1Id, setFile1Id] = useState<string | number>('');
    const [file2Id, setFile2Id] = useState<string | number>('');
    const [focusArea, setFocusArea] = useState<string>('Toàn diện (Điều khoản, số liệu, nghĩa vụ và rủi ro)');
    const [inputMode, setInputMode] = useState<'files' | 'text'>('files');
    const [customText1, setCustomText1] = useState<string>('');
    const [customText2, setCustomText2] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompareResponseDto | null>(null);
    const [showVisualDiff, setShowVisualDiff] = useState<boolean>(true);

    const [pickerTarget, setPickerTarget] = useState<'file1' | 'file2' | null>(null);

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

    const file1 = files.find(f => f.id.toString() === file1Id.toString());
    const file2 = files.find(f => f.id.toString() === file2Id.toString());

    const handleSelectFileFromModal = (file: FileItemDto) => {
        if (pickerTarget === 'file1') {
            setFile1Id(file.id);
        } else if (pickerTarget === 'file2') {
            setFile2Id(file.id);
        }
        setPickerTarget(null);
    };

    const handleSwapFiles = () => {
        if (!file1Id || !file2Id) return;
        const temp = file1Id;
        setFile1Id(file2Id);
        setFile2Id(temp);
        toast.success('Đã hoán đổi 2 tài liệu');
    };

    const loadSampleContract = () => {
        setCustomText1(
`Điều 5. Phạt vi phạm hợp đồng và Bồi thường thiệt hại
1. Bên nào vi phạm nghĩa vụ hợp đồng phải chịu phạt vi phạm với mức phạt tối đa bằng 8% giá trị phần nghĩa vụ bị vi phạm theo quy định tại Điều 301 Luật Thương mại 2005.
2. Trách nhiệm bồi thường thiệt hại tối đa của các bên không vượt quá tổng giá trị của Hợp đồng này.
3. Khi đơn phương chấm dứt hợp đồng vì lý do bất khả kháng, bên chấm dứt phải thông báo bằng văn bản trước ít nhất 30 ngày.`
        );
        setCustomText2(
`Điều 5. Phạt vi phạm hợp đồng và Bồi thường thiệt hại
1. Bên B nếu chậm bàn giao sản phẩm hoặc vi phạm bất kỳ điều khoản nào sẽ phải chịu phạt 15% tổng giá trị hợp đồng.
2. Bên B phải bồi thường vô điều kiện toàn bộ mọi thiệt hại phát sinh (bao gồm cả thiệt hại gián tiếp, lợi nhuận kỳ vọng bị mất) mà không bị giới hạn trần trách nhiệm.
3. Bên A có quyền đơn phương chấm dứt hợp đồng ngay lập tức mà không cần thông báo trước cho Bên B.`
        );
        setInputMode('text');
        toast.success('Đã nạp văn bản mẫu');
    };

    const handleCompare = async () => {
        if (inputMode === 'files' && (!file1Id || !file2Id)) {
            toast.error('Vui lòng chọn 2 tài liệu');
            return;
        }
        if (inputMode === 'text' && (!customText1.trim() || !customText2.trim())) {
            toast.error('Vui lòng nhập nội dung điều khoản');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const data = await compareService.compare({
                file1Name: inputMode === 'files' ? (file1?.name || 'Tài liệu 1') : 'Hợp đồng gốc (Bản chuẩn)',
                file1Content: inputMode === 'text' ? customText1 : '',
                file2Name: inputMode === 'files' ? (file2?.name || 'Tài liệu 2') : 'Hợp đồng đối chiếu (Bản sửa đổi)',
                file2Content: inputMode === 'text' ? customText2 : '',
                focusArea: focusArea
            });
            setResult(data);
            toast.success('Đã hoàn tất đối soát');
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
            return (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-red-50 text-red-700 border border-red-200/70 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" /> Rủi ro Cao
                </span>
            );
        }
        if (r.includes('TRUNG') || r === 'MEDIUM') {
            return (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200/70 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Rủi ro Trung bình
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Rủi ro Thấp
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ADDED':
                return <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Thêm mới</span>;
            case 'REMOVED':
                return <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-red-50 text-red-700 border border-red-200">Bị xóa</span>;
            default:
                return <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">Chỉnh sửa</span>;
        }
    };

    const handleExportReport = () => {
        if (!result) return;
        const f1 = inputMode === 'files' ? (file1?.name || 'Tài liệu 1') : 'Hợp đồng gốc';
        const f2 = inputMode === 'files' ? (file2?.name || 'Tài liệu 2') : 'Hợp đồng đối chiếu';

        const content = `# BÁO CÁO ĐỐI SOÁT TÀI LIỆU
Thời gian: ${new Date().toLocaleString('vi-VN')}
Tài liệu 1: ${f1}
Tài liệu 2: ${f2}
Độ tương đồng: ${result.similarityScore}%
Mức độ rủi ro: ${result.riskLevel}

---
## 1. TỔNG QUAN
${result.summary}

---
## 2. CHI TIẾT ĐIỀU KHOẢN THAY ĐỔI
${result.differences.map(d => `- [${d.clause}] (${d.status} - RỦI RO: ${d.risk}):
  + Bản 1: ${d.file1}
  + Bản 2: ${d.file2}
`).join('\n')}

---
## 3. ĐIỂM THỐNG NHẤT
${result.similarities.map(s => `- ${s}`).join('\n')}

---
## 4. KHUYẾN NGHỊ
${result.recommendations.map(r => `- ${r}`).join('\n')}
`;

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bao_cao_doi_soat_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã tải báo cáo');
    };

    return (
        <div className="w-full px-6 py-4 space-y-4 text-slate-800">
            {/* Header gọn gàng, thanh thoát */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        So sánh & Thẩm định Tài liệu
                        <span className="text-[11px] bg-slate-100 text-slate-600 font-normal px-2 py-0.5 rounded-md">
                            Semantic Diff
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                        Đối soát 2 phiên bản hợp đồng, phát hiện điều khoản sửa đổi và rủi ro pháp lý
                    </p>
                </div>
            </div>

            {/* Bảng chọn tài liệu tinh gọn, không chật chội */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
                {/* Tabs chuyển chế độ */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-100/70 p-0.5 rounded-lg">
                        <button
                            onClick={() => setInputMode('files')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                                inputMode === 'files'
                                    ? 'bg-white text-slate-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Chọn file từ kho
                        </button>
                        <button
                            onClick={() => setInputMode('text')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                                inputMode === 'text'
                                    ? 'bg-white text-slate-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Nhập trực tiếp (Demo)
                        </button>
                    </div>

                    {inputMode === 'text' && (
                        <button
                            onClick={loadSampleContract}
                            className="text-xs font-medium px-2.5 py-1 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 transition flex items-center gap-1"
                        >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Nạp mẫu hợp đồng rủi ro
                        </button>
                    )}
                </div>

                {inputMode === 'files' ? (
                    <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                        {/* File 1 Trigger Card */}
                        <div className="md:col-span-5 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Bản 1 (Bản gốc)
                                </span>
                                {file1?.ownerDepartmentName && (
                                    <span className="text-[11px] text-slate-400 font-normal">
                                        {file1.ownerDepartmentName}
                                    </span>
                                )}
                            </div>

                            <div
                                onClick={() => setPickerTarget('file1')}
                                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-2.5 min-h-[50px]"
                            >
                                {file1 ? (
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FileTypeIcon type={file1.fileType} className="w-4 h-4 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                                                {file1.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-normal">
                                                {file1.fileType?.toUpperCase()} {file1.size ? `• ${file1.size}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-normal">
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Bấm để chọn file bản gốc</span>
                                    </div>
                                )}

                                <span className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1">
                                    {file1 ? 'Đổi' : 'Chọn'}
                                </span>
                            </div>
                        </div>

                        {/* Nút đổi vị trí nhỏ gọn */}
                        <div className="md:col-span-1 flex justify-center py-1 md:py-0">
                            <button
                                type="button"
                                onClick={handleSwapFiles}
                                title="Đổi vị trí 2 tài liệu"
                                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* File 2 Trigger Card */}
                        <div className="md:col-span-5 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Bản 2 (Đối chiếu)
                                </span>
                                {file2?.ownerDepartmentName && (
                                    <span className="text-[11px] text-slate-400 font-normal">
                                        {file2.ownerDepartmentName}
                                    </span>
                                )}
                            </div>

                            <div
                                onClick={() => setPickerTarget('file2')}
                                className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-2.5 min-h-[50px]"
                            >
                                {file2 ? (
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FileTypeIcon type={file2.fileType} className="w-4 h-4 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                                                {file2.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-normal">
                                                {file2.fileType?.toUpperCase()} {file2.size ? `• ${file2.size}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-normal">
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Bấm để chọn file đối chiếu</span>
                                    </div>
                                )}

                                <span className="shrink-0 text-xs text-amber-700 hover:text-amber-800 font-medium px-2 py-1">
                                    {file2 ? 'Đổi' : 'Chọn'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700">Điều khoản Bản gốc (Bản A):</label>
                            <textarea
                                rows={5}
                                value={customText1}
                                onChange={(e) => setCustomText1(e.target.value)}
                                placeholder="Dán nội dung điều khoản gốc..."
                                className="w-full text-xs font-mono p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition leading-relaxed text-slate-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700">Điều khoản Đối chiếu (Bản B):</label>
                            <textarea
                                rows={5}
                                value={customText2}
                                onChange={(e) => setCustomText2(e.target.value)}
                                placeholder="Dán nội dung điều khoản sửa đổi..."
                                className="w-full text-xs font-mono p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition leading-relaxed text-slate-700"
                            />
                        </div>
                    </div>
                )}

                {/* Trọng tâm và Nút bấm cân đối */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal shrink-0">Trọng tâm:</span>
                        <select
                            value={focusArea}
                            onChange={(e) => setFocusArea(e.target.value)}
                            className="text-xs font-normal bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-slate-400 transition"
                        >
                            <option value="Toàn diện (Điều khoản, số liệu, nghĩa vụ và rủi ro)">Toàn diện (Điều khoản, nghĩa vụ, rủi ro)</option>
                            <option value="Điều khoản thanh toán & Giá trị hợp đồng">Điều khoản thanh toán & Chi phí</option>
                            <option value="Rủi ro pháp lý & Phạt vi phạm">Rủi ro pháp lý & Phạt vi phạm</option>
                            <option value="Trách nhiệm & Quyền hạn các bên">Trách nhiệm & Quyền hạn các bên</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCompare}
                        disabled={loading || (inputMode === 'files' && (!file1Id || !file2Id))}
                        className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang đối soát...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Tiến hành đối soát</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Bảng kết quả tinh giản, dễ đọc, không màu mè thái quá */}
            {result && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Thẻ tổng quan */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Kết quả thẩm định tổng quan
                                </h2>
                                <p className="text-[11px] text-slate-400 font-normal">Bản phân tích tổng hợp từ hệ thống AI</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-normal block">Tương đồng</span>
                                    <span className="text-xs font-semibold text-blue-600">{result.similarityScore}%</span>
                                </div>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <div>{getRiskBadge(result.riskLevel)}</div>
                                <button
                                    onClick={handleExportReport}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-normal transition"
                                    title="Tải báo cáo"
                                >
                                    <Download className="w-3 h-3" />
                                    Tải .md
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            {result.summary}
                        </p>
                    </div>

                    {/* Bảng so sánh chi tiết */}
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                Chi tiết điều khoản thay đổi ({result.differences.length} mục)
                            </h3>
                            <div className="flex items-center gap-3">
                                {showVisualDiff && (
                                    <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-500 font-normal">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Bị xóa / sửa đổi
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Thêm mới / thay thế
                                        </span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowVisualDiff(!showVisualDiff)}
                                    className={`px-2.5 py-1 rounded-md text-xs transition border flex items-center gap-1.5 ${
                                        showVisualDiff
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal'
                                    }`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{showVisualDiff ? 'Visual Diff: Đang bật' : 'Visual Diff: Tắt'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                                        <th className="py-2 px-3.5 w-1/4">Hạng mục</th>
                                        <th className="py-2 px-3.5 w-1/3 text-blue-700 bg-blue-50/20">
                                            Bản 1: {file1?.name || 'Bản gốc'}
                                        </th>
                                        <th className="py-2 px-3.5 w-1/3 text-amber-700 bg-amber-50/20">
                                            Bản 2: {file2?.name || 'Bản đối chiếu'}
                                        </th>
                                        <th className="py-2 px-3 text-center">Trạng thái & Rủi ro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.differences.map((diff, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/40 transition">
                                            <td className="py-2.5 px-3.5 font-medium text-slate-800 align-top">
                                                {diff.clause}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-600 leading-normal align-top font-normal">
                                                <DiffViewer
                                                    text={diff.file1}
                                                    oppositeText={diff.file2}
                                                    isOld={true}
                                                    showVisualDiff={showVisualDiff}
                                                />
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-700 leading-normal align-top font-normal bg-amber-50/10">
                                                <DiffViewer
                                                    text={diff.file2}
                                                    oppositeText={diff.file1}
                                                    isOld={false}
                                                    showVisualDiff={showVisualDiff}
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 text-center align-top space-y-1">
                                                <div>{getStatusBadge(diff.status)}</div>
                                                <div className="text-[10px] text-slate-400 font-normal">{diff.risk}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Điểm tương đồng & Khuyến nghị */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Điểm thống nhất
                            </h4>
                            <ul className="space-y-1.5 text-slate-600 font-normal">
                                {result.similarities.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Lưu ý & Khuyến nghị
                            </h4>
                            <ul className="space-y-1.5 text-slate-600 font-normal">
                                {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                        <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chọn file tinh gọn */}
            <FilePickerModal
                isOpen={pickerTarget !== null}
                onClose={() => setPickerTarget(null)}
                onSelectFile={handleSelectFileFromModal}
                title={pickerTarget === 'file1' ? 'Chọn Tài liệu 1 (Bản gốc)' : 'Chọn Tài liệu 2 (Đối chiếu)'}
                currentSelectedId={pickerTarget === 'file1' ? file1Id : file2Id}
                files={files}
            />
        </div>
    );
}
