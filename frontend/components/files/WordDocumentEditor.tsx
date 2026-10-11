'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Indent,
    Outdent,
    Heading1,
    Heading2,
    Heading3,
    Table as TableIcon,
    Minus,
    Calendar,
    Save,
    Download,
    Printer,
    Maximize2,
    Minimize2,
    RotateCcw,
    RotateCw,
    RemoveFormatting,
    FileText,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    X,
    ZoomIn,
    ZoomOut,
    Link as LinkIcon,
    Highlighter,
    Palette,
    Shield,
    FileCheck
} from 'lucide-react';
import { convertHtmlElementToDocxBlob } from '@/utils/docxExportHelper';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';

interface WordDocumentEditorProps {
    file: FileItemDto;
    initialHtml: string;
    isSaving?: boolean;
    onSaveNewVersion: (fileBlob: Blob, nextVerStr: string) => Promise<void>;
    onClose: () => void;
}

type RibbonTab = 'home' | 'insert' | 'layout' | 'review';

const FONT_FAMILIES = [
    { label: 'Calibri (Mặc định)', value: 'Calibri, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' }
];

const FONT_SIZES = [
    { label: '10 pt', value: '13px' },
    { label: '11 pt', value: '14.5px' },
    { label: '12 pt (Chuẩn)', value: '16px' },
    { label: '14 pt', value: '18.5px' },
    { label: '16 pt', value: '21px' },
    { label: '18 pt', value: '24px' },
    { label: '24 pt', value: '32px' },
    { label: '32 pt', value: '42px' }
];

const COLOR_PALETTE = [
    { label: 'Đen mặc định', value: '#111827' },
    { label: 'Xanh dương Word', value: '#1e40af' },
    { label: 'Xanh ngọc', value: '#0f766e' },
    { label: 'Đỏ thắm', value: '#b91c1c' },
    { label: 'Tím', value: '#6b21a8' },
    { label: 'Cam', value: '#c2410c' },
    { label: 'Xám đậm', value: '#4b5563' }
];

const HIGHLIGHT_PALETTE = [
    { label: 'Không màu', value: 'transparent' },
    { label: 'Vàng rực', value: '#fef08a' },
    { label: 'Xanh lá nhạt', value: '#bbf7d0' },
    { label: 'Xanh lam nhạt', value: '#bae6fd' },
    { label: 'Hồng phấn', value: '#fbcfe8' },
    { label: 'Cam nhạt', value: '#fed7aa' }
];

function getNextVersion(currentVersion?: string): string {
    if (!currentVersion) return 'v2.0';
    const match = currentVersion.match(/v?(\d+)(\.(\d+))?/i);
    if (match && match[1]) {
        const major = parseInt(match[1], 10);
        return `v${major + 1}.0`;
    }
    return `${currentVersion}.1`;
}

export default function WordDocumentEditor({
    file,
    initialHtml,
    onSaveNewVersion,
    onClose
}: WordDocumentEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<RibbonTab>('home');
    const [zoom, setZoom] = useState<number>(100);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [selectedFont, setSelectedFont] = useState<string>('Calibri, sans-serif');
    const [selectedSize, setSelectedSize] = useState<string>('16px');
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);
    const [marginMode, setMarginMode] = useState<'normal' | 'narrow' | 'wide'>('normal');

    const nextVerStr = getNextVersion(file?.version);

    // Cập nhật nội dung ban đầu vào editor
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml || '<p>Bắt đầu nhập nội dung văn bản...</p>';
            updateCounts();
        }
    }, [initialHtml]);

    // Tính toán số từ & ký tự
    const updateCounts = useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || '';
        const trimmed = text.trim();
        setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
        setCharCount(text.length);
    }, []);

    const handleInput = () => {
        setIsDirty(true);
        updateCounts();
    };

    // Thực thi lệnh định dạng tài liệu
    const exec = (command: string, value: string | undefined = undefined) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        setIsDirty(true);
        updateCounts();
    };

    // Xử lý đổi Heading / FormatBlock
    const handleHeadingChange = (tag: string) => {
        exec('formatBlock', `<${tag}>`);
    };

    // Chèn bảng biểu
    const handleInsertTable = (rows = 3, cols = 3) => {
        if (!editorRef.current) return;
        let html = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;">';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                if (r === 0) {
                    html += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: 600; text-align: left;">Tiêu đề ${c + 1}</th>`;
                } else {
                    html += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Dữ liệu ${r}.${c + 1}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</table><p></p>';
        exec('insertHTML', html);
    };

    // Chèn dấu ngày tháng
    const handleInsertDate = () => {
        const dateStr = new Date().toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const html = `<span style="display: inline-block; padding: 2px 8px; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 4px; font-weight: 500; font-size: 13px;">📅 ${dateStr}</span>&nbsp;`;
        exec('insertHTML', html);
    };

    // Chèn đường phân cách
    const handleInsertDivider = () => {
        exec('insertHTML', '<hr style="border: none; border-top: 1.5px solid #cbd5e1; margin: 20px 0;" /><p></p>');
    };

    // Chèn khung lưu ý / Callout Box
    const handleInsertCallout = (type: 'info' | 'warning' | 'security') => {
        let style = 'padding: 12px 16px; margin: 16px 0; border-radius: 6px; font-size: 14px;';
        let content = '';
        if (type === 'info') {
            style += 'background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1e3a8a;';
            content = '<strong>📌 Lưu ý điều khoản:</strong> Nội dung bổ sung cần được phê duyệt bởi Trưởng bộ phận phụ trách.';
        } else if (type === 'warning') {
            style += 'background-color: #fffbeb; border-left: 4px solid #f59e0b; color: #78350f;';
            content = '<strong>⚠️ Cảnh báo bảo mật:</strong> Tài liệu này thuộc quyền sở hữu nội bộ của doanh nghiệp, nghiêm cấm sao chép ra ngoài.';
        } else {
            style += 'background-color: #fef2f2; border-left: 4px solid #ef4444; color: #7f1d1d;';
            content = '<strong>🔒 Phân cấp bảo mật:</strong> Mức độ TỐI MẬT. Chỉ nhân sự được cấp quyền Biên tập (Editor) mới được phép thay đổi.';
        }
        exec('insertHTML', `<div style="${style}">${content}</div><p></p>`);
    };

    // Chèn khối chữ ký phê duyệt
    const handleInsertSignatureBlock = () => {
        const html = `
            <table style="width: 100%; border: none; margin-top: 40px; margin-bottom: 20px;">
                <tr>
                    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
                        <p style="font-weight: 600; margin-bottom: 4px;">NGƯỜI LẬP BIỂU</p>
                        <p style="font-style: italic; color: #64748b; font-size: 13px; margin-bottom: 60px;">(Ký và ghi rõ họ tên)</p>
                        <p style="font-weight: 500;">${file.uploadedByName || 'Người biên tập'}</p>
                    </td>
                    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
                        <p style="font-weight: 600; margin-bottom: 4px;">ĐẠI DIỆN PHÊ DUYỆT</p>
                        <p style="font-style: italic; color: #64748b; font-size: 13px; margin-bottom: 60px;">(Ký, đóng dấu và ghi rõ họ tên)</p>
                        <p style="font-weight: 500;">Ban Lãnh Đạo</p>
                    </td>
                </tr>
            </table>
            <p></p>
        `;
        exec('insertHTML', html);
    };

    // Xóa định dạng
    const handleClearFormatting = () => {
        exec('removeFormat');
        exec('formatBlock', '<p>');
    };

    // Đổi font family
    const handleFontFamily = (font: string) => {
        setSelectedFont(font);
        exec('fontName', font);
    };

    // Đổi font size
    const handleFontSize = (sizeVal: string) => {
        setSelectedSize(sizeVal);
        // Trong contentEditable chuẩn, dùng font size qua span style
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = sizeVal;
            span.appendChild(range.extractContents());
            range.insertNode(span);
            setIsDirty(true);
            updateCounts();
        }
    };

    // Lưu thành phiên bản mới (vX.0)
    const handleSave = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        try {
            const docxBlob = await convertHtmlElementToDocxBlob(editorRef.current, file.name);
            await onSaveNewVersion(docxBlob, nextVerStr);
            setIsDirty(false);
        } catch (err: any) {
            console.error('Lỗi khi lưu phiên bản Word:', err);
            toast.error(err?.message || 'Không thể tạo phiên bản Word mới.');
        } finally {
            setIsSaving(false);
        }
    };

    // Tải xuống file .docx trực tiếp về máy tính
    const handleDownloadDocx = async () => {
        if (!editorRef.current) return;
        try {
            toast.loading('Đang khởi tạo file Word (.docx)...', { id: 'download-docx' });
            const docxBlob = await convertHtmlElementToDocxBlob(editorRef.current, file.name);
            const url = URL.createObjectURL(docxBlob);
            const a = document.createElement('a');
            a.href = url;
            const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Tai-lieu';
            a.download = `${cleanName}_${nextVerStr}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Đã tải xuống file Word thành công!', { id: 'download-docx' });
        } catch (err) {
            console.error('Lỗi tải file Word:', err);
            toast.error('Không thể xuất file Word', { id: 'download-docx' });
        }
    };

    // In tài liệu
    const handlePrint = () => {
        if (!editorRef.current) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${file.name || 'Tài liệu'}</title>
                        <style>
                            body { font-family: 'Times New Roman', Times, serif; padding: 40px; font-size: 14pt; line-height: 1.6; color: #111; }
                            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            h1 { font-size: 20pt; margin-bottom: 16px; }
                            h2 { font-size: 16pt; margin-top: 20px; margin-bottom: 12px; }
                            h3 { font-size: 14pt; margin-top: 16px; margin-bottom: 8px; }
                            @page { size: A4; margin: 20mm; }
                        </style>
                    </head>
                    <body>
                        ${editorRef.current.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 300);
        }
    };

    // Căn lề trang A4
    const getPaddingClass = () => {
        if (marginMode === 'narrow') return 'p-8';
        if (marginMode === 'wide') return 'p-20';
        return 'p-14'; // Normal 2.5cm
    };

    return (
        <div className={`flex flex-col bg-slate-100 rounded-xl border border-slate-300 shadow-xl overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : 'min-h-[780px]'
        }`}>
            {/* ========================================================================= */}
            {/* 1. THANH TIÊU ĐỀ WORD (WORD BRANDED TITLE BAR)                             */}
            {/* ========================================================================= */}
            <div className="bg-[#185abd] text-white px-4 py-2 flex items-center justify-between select-none shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-white text-[#185abd] flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        W
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate max-w-xs md:max-w-md" title={file.name}>
                                {file.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white tracking-wide">
                                DOCX EDITOR
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-900 shadow-2xs">
                                Dự thảo {nextVerStr}
                            </span>
                        </div>
                        <div className="text-[11px] text-blue-100 flex items-center gap-2">
                            <span>{isDirty ? '● Có thay đổi chưa lưu' : '✓ Đã đồng bộ nội dung'}</span>
                            <span>•</span>
                            <span>Tự động lập chỉ mục AI khi lưu</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadDocx}
                        className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        title="Tải file Word (.docx) về máy tính"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tải về (.docx)</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        title="In tài liệu văn bản"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">In</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition cursor-pointer"
                        title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ml-1"
                        title={`Lưu và tạo ngay phiên bản ${nextVerStr}`}
                    >
                        {isSaving ? (
                            <>
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Lưu {nextVerStr}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu, có chắc chắn muốn thoát khỏi trình soạn thảo Word?')) {
                                return;
                            }
                            onClose();
                        }}
                        className="p-1.5 rounded hover:bg-red-600 text-white text-xs transition cursor-pointer ml-1"
                        title="Đóng trình soạn thảo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. THANH RIBBON TABS (TRANG ĐẦU, CHÈN, BỐ CỤC, XEM LẠI)                     */}
            {/* ========================================================================= */}
            <div className="bg-white border-b border-slate-200 px-4 pt-1 flex items-center gap-1 select-none text-xs">
                <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className={`px-3 py-1.5 font-medium border-b-2 transition ${
                        activeTab === 'home'
                            ? 'border-[#185abd] text-[#185abd] font-bold'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Trang đầu (Home)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('insert')}
                    className={`px-3 py-1.5 font-medium border-b-2 transition ${
                        activeTab === 'insert'
                            ? 'border-[#185abd] text-[#185abd] font-bold'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Chèn (Insert)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('layout')}
                    className={`px-3 py-1.5 font-medium border-b-2 transition ${
                        activeTab === 'layout'
                            ? 'border-[#185abd] text-[#185abd] font-bold'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Bố trí & Căn lề (Layout)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className={`px-3 py-1.5 font-medium border-b-2 transition ${
                        activeTab === 'review'
                            ? 'border-[#185abd] text-[#185abd] font-bold'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Xem lại & Trợ lý AI (Review)
                </button>
            </div>

            {/* ========================================================================= */}
            {/* 3. DẢI CÔNG CỤ RIBBON (RIBBON TOOLBAR)                                      */}
            {/* ========================================================================= */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs text-slate-700 shadow-2xs">
                {activeTab === 'home' && (
                    <>
                        {/* Lịch sử Undo / Redo */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300">
                            <button
                                type="button"
                                onClick={() => exec('undo')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
                                title="Hoàn tác (Ctrl+Z)"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('redo')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
                                title="Làm lại (Ctrl+Y)"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Chọn Phông chữ & Cỡ chữ */}
                        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-300">
                            <select
                                value={selectedFont}
                                onChange={(e) => handleFontFamily(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-blue-500 font-sans"
                                title="Chọn phông chữ"
                            >
                                {FONT_FAMILIES.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>

                            <select
                                value={selectedSize}
                                onChange={(e) => handleFontSize(e.target.value)}
                                className="px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-blue-500 font-mono w-24"
                                title="Chọn cỡ chữ"
                            >
                                {FONT_SIZES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Kiểu chữ Bold, Italic, Underline, Strikethrough */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300">
                            <button
                                type="button"
                                onClick={() => exec('bold')}
                                className="p-1.5 rounded hover:bg-slate-200 font-bold text-slate-800 transition"
                                title="Chữ đậm (Ctrl+B)"
                            >
                                <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('italic')}
                                className="p-1.5 rounded hover:bg-slate-200 italic text-slate-800 transition"
                                title="Chữ nghiêng (Ctrl+I)"
                            >
                                <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('underline')}
                                className="p-1.5 rounded hover:bg-slate-200 underline text-slate-800 transition"
                                title="Gạch chân (Ctrl+U)"
                            >
                                <Underline className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('strikeThrough')}
                                className="p-1.5 rounded hover:bg-slate-200 line-through text-slate-800 transition"
                                title="Gạch ngang chữ"
                            >
                                <Strikethrough className="w-3.5 h-3.5" />
                            </button>

                            {/* Bảng chọn màu chữ */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
                                    className="p-1.5 rounded hover:bg-slate-200 flex items-center gap-0.5 text-slate-800 transition"
                                    title="Màu phông chữ"
                                >
                                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                {showColorPicker && (
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-2 z-30 flex flex-col gap-1 w-36">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Màu chữ</span>
                                        {COLOR_PALETTE.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => { exec('foreColor', c.value); setShowColorPicker(false); }}
                                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-left text-xs"
                                            >
                                                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.value }} />
                                                <span>{c.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bảng chọn màu nền highlight */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
                                    className="p-1.5 rounded hover:bg-slate-200 flex items-center gap-0.5 text-slate-800 transition"
                                    title="Màu đánh dấu văn bản (Highlight)"
                                >
                                    <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                                </button>
                                {showHighlightPicker && (
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-2 z-30 flex flex-col gap-1 w-36">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Đánh dấu</span>
                                        {HIGHLIGHT_PALETTE.map(h => (
                                            <button
                                                key={h.value}
                                                type="button"
                                                onClick={() => { exec('hiliteColor', h.value); setShowHighlightPicker(false); }}
                                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-left text-xs"
                                            >
                                                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: h.value }} />
                                                <span>{h.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleClearFormatting}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition"
                                title="Xóa định dạng"
                            >
                                <RemoveFormatting className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Căn lề đoạn văn */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300">
                            <button
                                type="button"
                                onClick={() => exec('justifyLeft')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Căn lề trái (Ctrl+L)"
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('justifyCenter')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Căn giữa (Ctrl+E)"
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('justifyRight')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Căn lề phải (Ctrl+R)"
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('justifyFull')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Căn đều hai bên (Ctrl+J)"
                            >
                                <AlignJustify className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Danh sách List & Thụt lề Indent */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300">
                            <button
                                type="button"
                                onClick={() => exec('insertUnorderedList')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Danh sách dấu đầu dòng"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('insertOrderedList')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Danh sách đánh số"
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('outdent')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Giảm thụt lề"
                            >
                                <Outdent className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => exec('indent')}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-800 transition"
                                title="Tăng thụt lề"
                            >
                                <Indent className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Kiểu đoạn văn Tiêu đề 1, 2, 3 */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleHeadingChange('h1')}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 font-bold text-xs transition"
                                title="Tiêu đề 1 (H1)"
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeadingChange('h2')}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 font-semibold text-xs transition"
                                title="Tiêu đề 2 (H2)"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeadingChange('h3')}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 font-medium text-xs transition"
                                title="Tiêu đề 3 (H3)"
                            >
                                H3
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeadingChange('p')}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-xs transition"
                                title="Văn bản thông thường (Normal text)"
                            >
                                Văn bản thường
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'insert' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleInsertTable(3, 3)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-slate-700 transition"
                            title="Chèn bảng biểu 3x3"
                        >
                            <TableIcon className="w-4 h-4 text-blue-600" />
                            <span>Bảng biểu (3x3)</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertDivider}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-slate-700 transition"
                            title="Chèn đường kẻ ngang phân tách"
                        >
                            <Minus className="w-4 h-4 text-slate-500" />
                            <span>Đường phân cách</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertDate}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-slate-700 transition"
                            title="Chèn ngày phê duyệt"
                        >
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Dấu ngày hiện tại</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleInsertCallout('info')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-blue-700 transition"
                            title="Chèn hộp điều khoản ghi chú"
                        >
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Hộp ghi chú điều khoản</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleInsertCallout('warning')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-amber-700 transition"
                            title="Chèn cảnh báo nội bộ"
                        >
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Khung cảnh báo</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInsertSignatureBlock}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-indigo-700 transition"
                            title="Chèn phần ký tên và con dấu phê duyệt"
                        >
                            <Shield className="w-4 h-4 text-indigo-600" />
                            <span>Khung ký tên & Phê duyệt</span>
                        </button>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">Căn lề trang A4:</span>
                            <button
                                type="button"
                                onClick={() => setMarginMode('normal')}
                                className={`px-2.5 py-1 rounded border text-xs transition ${
                                    marginMode === 'normal' ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                            >
                                Chuẩn (2.5 cm)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarginMode('narrow')}
                                className={`px-2.5 py-1 rounded border text-xs transition ${
                                    marginMode === 'narrow' ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                            >
                                Hẹp (1.27 cm)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarginMode('wide')}
                                className={`px-2.5 py-1 rounded border text-xs transition ${
                                    marginMode === 'wide' ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                            >
                                Rộng (3.8 cm)
                            </button>
                        </div>

                        <div className="h-4 w-px bg-slate-300 mx-1" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Mức thu phóng:</span>
                            <button
                                type="button"
                                onClick={() => setZoom(Math.max(70, zoom - 10))}
                                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-semibold text-slate-700 min-w-10 text-center">{zoom}%</span>
                            <button
                                type="button"
                                onClick={() => setZoom(Math.min(150, zoom + 10))}
                                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom(100)}
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px]"
                            >
                                100%
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'review' && (
                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-700">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-900">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>Khi lưu phiên bản mới ({nextVerStr}), hệ thống sẽ tự động cập nhật Vector DB RAG cho AI.</span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Đã kiểm tra chính tả tiếng Việt</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 4. VÙNG KHÔNG GIAN SOẠN THẢO TRANG GIẤY A4 (WORD DOCUMENT CANVAS)            */}
            {/* ========================================================================= */}
            <div className="flex-1 overflow-auto bg-[#eef2f6] p-6 md:p-10 flex justify-center items-start">
                <div
                    style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.15s ease-out'
                    }}
                    className="w-full flex justify-center"
                >
                    {/* Tờ giấy A4 chuẩn Word */}
                    <div className={`w-[816px] max-w-full min-h-[1056px] bg-white shadow-2xl rounded-xs border border-slate-300/80 ${getPaddingClass()} relative outline-none text-slate-900`}>
                        {/* Dấu viền tiêu đề mờ trang Word */}
                        <div className="absolute top-4 left-14 right-14 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-100 pb-1 pointer-events-none select-none">
                            <span>{file.name || 'Tài liệu Word'}</span>
                            <span>{nextVerStr} (Dự thảo)</span>
                        </div>

                        {/* Vùng ContentEditable trực tiếp */}
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onInput={handleInput}
                            style={{
                                fontFamily: selectedFont,
                                minHeight: '900px',
                                outline: 'none',
                                lineHeight: '1.7',
                                fontSize: '15px'
                            }}
                            className="word-content-canvas prose prose-slate max-w-none focus:outline-none"
                            spellCheck={false}
                        />

                        {/* Dấu chân trang mờ Word */}
                        <div className="absolute bottom-4 left-14 right-14 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1 pointer-events-none select-none">
                            <span>Enterprise AI Assistant</span>
                            <span>Trang 1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. THANH TRẠNG THÁI WORD PHÍA DƯỚI (WORD STATUS BAR)                         */}
            {/* ========================================================================= */}
            <div className="bg-[#185abd] text-white px-4 py-1.5 flex items-center justify-between text-[11px] select-none shadow-xs font-normal">
                <div className="flex items-center gap-3">
                    <span>Trang 1 / 1</span>
                    <span>•</span>
                    <span>{wordCount} từ</span>
                    <span>•</span>
                    <span>{charCount} ký tự</span>
                    <span>•</span>
                    <span>Tiếng Việt (Việt Nam)</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-200">
                        <FileCheck className="w-3 h-3" />
                        Trình soạn thảo Word tích hợp
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setZoom(Math.max(70, zoom - 10))}
                            className="hover:opacity-75"
                            title="Thu nhỏ"
                        >
                            -
                        </button>
                        <input
                            type="range"
                            min="70"
                            max="150"
                            step="5"
                            value={zoom}
                            onChange={(e) => setZoom(parseInt(e.target.value, 10))}
                            className="w-20 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <button
                            type="button"
                            onClick={() => setZoom(Math.min(150, zoom + 10))}
                            className="hover:opacity-75"
                            title="Phóng to"
                        >
                            +
                        </button>
                        <span className="font-mono min-w-8 text-right">{zoom}%</span>
                    </div>
                </div>
            </div>

            {/* CSS Tùy chỉnh hiển thị bảng & chữ trong vùng soạn thảo */}
            <style jsx global>{`
                .word-content-canvas h1 {
                    font-size: 26px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 18px;
                    margin-bottom: 12px;
                }
                .word-content-canvas h2 {
                    font-size: 21px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-top: 16px;
                    margin-bottom: 10px;
                }
                .word-content-canvas h3 {
                    font-size: 17px;
                    font-weight: 600;
                    color: #334155;
                    margin-top: 14px;
                    margin-bottom: 8px;
                }
                .word-content-canvas p {
                    margin-bottom: 12px;
                    line-height: 1.7;
                }
                .word-content-canvas table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                    border: 1px solid #cbd5e1;
                }
                .word-content-canvas th,
                .word-content-canvas td {
                    border: 1px solid #cbd5e1;
                    padding: 8px 12px;
                    min-height: 32px;
                }
                .word-content-canvas th {
                    background-color: #f8fafc;
                    font-weight: 600;
                }
                .word-content-canvas ul {
                    list-style-type: disc;
                    padding-left: 24px;
                    margin-bottom: 12px;
                }
                .word-content-canvas ol {
                    list-style-type: decimal;
                    padding-left: 24px;
                    margin-bottom: 12px;
                }
                .word-content-canvas blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 16px;
                    margin: 14px 0;
                    color: #475569;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
