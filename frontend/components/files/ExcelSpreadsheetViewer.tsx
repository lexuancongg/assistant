'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Table,
    Search,
    Download,
    Copy,
    FileSpreadsheet,
    AlertCircle,
    Maximize2,
    Check,
    Filter,
    ArrowUpDown,
    Layers,
    FileText
} from 'lucide-react';
import ToughZebraLoader from '@/components/common/ToughZebraLoader';
import toast from 'react-hot-toast';

interface ExcelSpreadsheetViewerProps {
    fileId?: number | string;
    fileName?: string;
    fileUrl?: string | null;
    directStreamUrl?: string | null;
    fallbackText?: string | null;
    onDownload?: () => void;
}

interface SheetData {
    name: string;
    rows: any[][];
}

// Chuyển chỉ số cột (0, 1, 2...) thành tên cột Excel (A, B, ..., Z, AA, AB...)
function getColumnLetter(colIndex: number): string {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
}

export default function ExcelSpreadsheetViewer({
    fileId,
    fileName = 'Spreadsheet.xlsx',
    fileUrl,
    directStreamUrl,
    fallbackText,
    onDownload
}: ExcelSpreadsheetViewerProps) {
    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const loadedFileIdRef = useRef<string | number | null>(null);

    // Tìm kiếm và chọn ô
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: string } | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Nạp dữ liệu Excel từ File URL hoặc Backend Stream
    useEffect(() => {
        // Nếu đã nạp thành công sheets cho file này, không nạp lại để tránh nhấp nháy loader
        if (fileId && loadedFileIdRef.current === fileId && sheets.length > 0) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        if (sheets.length === 0) {
            setIsLoading(true);
        }
        setErrorMessage(null);

        const parseArrayBuffer = async (buffer: ArrayBuffer) => {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(buffer, { type: 'array' });
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Tệp Excel không chứa sheet nào hợp lệ');
            }

            const parsedSheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: '',
                    blankrows: false
                });
                return {
                    name: sheetName,
                    rows: rawRows.filter(r => r && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''))
                };
            });

            return parsedSheets;
        };

        const loadExcel = async () => {
            const headers: Record<string, string> = {};
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 1. Thử tải từ fileUrl (Presigned URL hoặc direct)
            const targetUrls = [fileUrl, directStreamUrl].filter(Boolean) as string[];

            for (const url of targetUrls) {
                try {
                    const res = await fetch(url, { headers });
                    if (res.ok) {
                        const buffer = await res.arrayBuffer();
                        if (buffer && buffer.byteLength > 0) {
                            const parsedSheets = await parseArrayBuffer(buffer);
                            if (isMounted) {
                                if (fileId) loadedFileIdRef.current = fileId;
                                setSheets(parsedSheets);
                                setActiveSheetIndex(0);
                                setIsLoading(false);
                                return;
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`Không thể nạp binary từ ${url}:`, err);
                }
            }

            // 2. Nếu không tải được binary S3 (ví dụ file giả lập chưa có trên storage),
            // sử dụng fallbackText (văn bản trích xuất AI hoặc bảng phân tích dạng Markdown / CSV)
            if (fallbackText && fallbackText.trim()) {
                try {
                    const lines = fallbackText.split('\n').filter(l => l.trim().length > 0);
                    const parsedRows: any[][] = [];

                    for (const line of lines) {
                        // Bỏ qua tiêu đề Markdown dạng # hoặc ---
                        if (line.startsWith('#') || line.startsWith('---') || line.startsWith('===')) {
                            continue;
                        }
                        if (line.includes('|')) {
                            // Bảng Markdown
                            const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                            if (cells.length > 0 && !cells.every(c => c.match(/^[:\s-]+$/))) {
                                parsedRows.push(cells);
                            }
                        } else if (line.includes('\t')) {
                            parsedRows.push(line.split('\t').map(c => c.trim()));
                        } else if (line.includes(',')) {
                            parsedRows.push(line.split(',').map(c => c.trim()));
                        } else {
                            parsedRows.push([line]);
                        }
                    }

                    if (parsedRows.length > 0 && isMounted) {
                        if (fileId) loadedFileIdRef.current = fileId;
                        setSheets([{
                            name: 'Dữ liệu trích xuất AI',
                            rows: parsedRows
                        }]);
                        setActiveSheetIndex(0);
                        setIsLoading(false);
                        return;
                    }
                } catch (fallbackErr) {
                    console.warn('Lỗi phân tích fallbackText:', fallbackErr);
                }
            }

            if (isMounted) {
                setErrorMessage('Chưa thể tải dữ liệu bảng tính. Vui lòng tải file về máy để xem hoặc thử lại sau.');
                setIsLoading(false);
            }
        };

        loadExcel();

        return () => {
            isMounted = false;
        };
    }, [fileUrl, directStreamUrl, fallbackText]);

    // Sheet hiện tại
    const currentSheet = sheets[activeSheetIndex] || null;

    // Tính toán số lượng cột tối đa trong sheet hiện tại
    const maxCols = useMemo(() => {
        if (!currentSheet || !currentSheet.rows.length) return 0;
        return Math.max(...currentSheet.rows.map(r => r.length), 0);
    }, [currentSheet]);

    // Lọc hàng theo từ khóa tìm kiếm
    const filteredRows = useMemo(() => {
        if (!currentSheet) return [];
        if (!searchTerm.trim()) return currentSheet.rows;
        const lower = searchTerm.toLowerCase();
        return currentSheet.rows.filter(row =>
            row.some(cell => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(lower))
        );
    }, [currentSheet, searchTerm]);

    // Xử lý sao chép sheet thành CSV
    const handleCopyCsv = () => {
        if (!currentSheet || !currentSheet.rows.length) return;
        const csvContent = currentSheet.rows.map(r =>
            r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        navigator.clipboard.writeText(csvContent);
        setIsCopied(true);
        toast.success(`Đã sao chép ${currentSheet.rows.length} hàng dữ liệu dạng CSV!`);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-[620px] flex flex-col items-center justify-center p-8 bg-slate-50/70 rounded-xl space-y-4">
                <ToughZebraLoader theme="light" width={320} />
                <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-700">
                        Đang phân tích bảng tính Excel siêu tốc...
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Đang dựng các trang tính (Worksheets) và lưới ô dữ liệu
                    </p>
                </div>
            </div>
        );
    }

    if (errorMessage || !sheets.length || !currentSheet) {
        return (
            <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-xs">
                    <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800">
                        {fileName}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {errorMessage || 'Không tìm thấy dữ liệu ô trong bảng tính này.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    {onDownload && (
                        <button
                            type="button"
                            onClick={onDownload}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Tải tệp Excel về máy
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-full min-h-[680px] bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden select-none">
            {/* Top Toolbar phong cách Google Sheets */}
            <div className="bg-slate-50/90 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Sheet info & Thống kê */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                        <FileSpreadsheet className="w-3 h-3" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Trang tính: {currentSheet.name}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline shrink-0 font-medium">
                        ({filteredRows.length} hàng × {maxCols} cột)
                    </span>
                </div>

                {/* Các công cụ tìm kiếm, Copy, Tải về */}
                <div className="flex items-center gap-2">
                    {/* Hộp tìm kiếm tức thì */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm trong trang tính..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-2.5 py-1 w-36 sm:w-52 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyCsv}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        title="Sao chép toàn bộ bảng tính hiện tại sang định dạng CSV"
                    >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span className="hidden sm:inline">{isCopied ? 'Đã sao chép' : 'Sao chép CSV'}</span>
                    </button>

                    {onDownload && (
                        <button
                            type="button"
                            onClick={onDownload}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            title="Tải tệp Excel nguyên bản về máy tính"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tải về (.xlsx)</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Formula / Cell Bar (Thanh hiển thị giá trị ô đang chọn như Excel) */}
            <div className="bg-slate-100/60 border-b border-slate-200 px-3 py-1 flex items-center gap-2 text-xs font-mono text-slate-600">
                <div className="w-14 font-semibold text-slate-700 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-center shrink-0">
                    {selectedCell ? `${getColumnLetter(selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
                </div>
                <div className="text-slate-400 select-none">fx</div>
                <div className="flex-1 truncate bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-sans text-xs">
                    {selectedCell ? selectedCell.val : (filteredRows[0]?.[0] !== undefined ? String(filteredRows[0][0]) : '')}
                </div>
            </div>

            {/* Lưới ô bảng tính (Spreadsheet Table Grid) */}
            <div className="flex-1 overflow-auto bg-slate-50/30 relative max-h-[640px]">
                <table className="w-full border-collapse text-left font-sans text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-2xs">
                        <tr>
                            {/* Ô góc trên bên trái */}
                            <th className="w-12 min-w-12 max-w-12 border-b border-r border-slate-300 bg-slate-200 text-center text-[10px] text-slate-500 font-mono py-1 sticky left-0 z-30">
                                #
                            </th>
                            {/* Tiêu đề cột A, B, C, D... */}
                            {Array.from({ length: maxCols }).map((_, colIdx) => (
                                <th
                                    key={colIdx}
                                    className="border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] font-semibold text-slate-600 font-mono py-1.5 px-3 min-w-[110px] select-none"
                                >
                                    {getColumnLetter(colIdx)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={`hover:bg-blue-50/50 transition-colors ${
                                    rowIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                                }`}
                            >
                                {/* Cột số thứ tự hàng 1, 2, 3... */}
                                <td className="w-12 min-w-12 max-w-12 border-b border-r border-slate-300 bg-slate-100 text-center text-[10px] text-slate-500 font-mono py-1.5 sticky left-0 z-10 select-none">
                                    {rowIdx + 1}
                                </td>
                                {/* Các ô dữ liệu */}
                                {Array.from({ length: maxCols }).map((_, colIdx) => {
                                    const cellVal = row[colIdx];
                                    const strVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : '';
                                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                                    const isNumber = strVal !== '' && !isNaN(Number(strVal.replace(/[,.]/g, '')));

                                    return (
                                        <td
                                            key={colIdx}
                                            onClick={() => setSelectedCell({ row: rowIdx, col: colIdx, val: strVal })}
                                            className={`border-b border-r border-slate-200/90 py-1.5 px-3 text-slate-800 text-xs min-w-[110px] truncate max-w-[320px] cursor-cell transition-all ${
                                                isSelected
                                                    ? 'bg-blue-50 outline-2 -outline-offset-2 outline-blue-600 z-10 font-medium'
                                                    : ''
                                            } ${isNumber ? 'text-right font-mono' : 'text-left'}`}
                                            title={strVal}
                                        >
                                            {strVal}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Thanh Tab chuyển đổi các Sheet ở dưới đáy (giống hệt Google Sheets / Excel) */}
            <div className="bg-slate-100/90 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs shrink-0 select-none">
                <div className="flex items-center gap-1 overflow-x-auto max-w-2xl py-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Trang tính:
                    </span>
                    {sheets.map((sheet, index) => {
                        const isActive = index === activeSheetIndex;
                        return (
                            <button
                                key={sheet.name + index}
                                type="button"
                                onClick={() => {
                                    setActiveSheetIndex(index);
                                    setSelectedCell(null);
                                }}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                    isActive
                                        ? 'bg-white text-emerald-700 shadow-2xs font-semibold border-b-2 border-emerald-600'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                <span>{sheet.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({sheet.rows.length})</span>
                            </button>
                        );
                    })}
                </div>

                <div className="text-[11px] text-slate-400 font-sans hidden sm:block">
                    SheetJS Native Engine • Độ trễ 0ms • Bảo mật nội bộ
                </div>
            </div>
        </div>
    );
}
