'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Download,
    ShieldAlert,
    KeyRound,
    Lock,
    Edit3,
    Copy,
    Check,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Code,
    Image as ImageIcon,
    UploadCloud
} from 'lucide-react';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import ToughZebraLoader from '@/components/common/ToughZebraLoader';
import WordDocumentEditor from '@/components/files/WordDocumentEditor';
import ExcelSpreadsheetViewer from '@/components/files/ExcelSpreadsheetViewer';
import toast from 'react-hot-toast';

interface FileContentViewerProps {
    file: FileItemDto;
    hasAccess?: boolean;
    canEdit?: boolean;
    onToggleDemoPermission?: (mode: 'DEFAULT' | 'PERMITTED' | 'BLOCKED') => void;
    onRequestAccess: () => void;
    onVersionCreated?: (updatedFile: FileItemDto) => void;
}

// Bộ nhớ đệm URL xem trước theo fileId để tránh fetch trùng lặp
export const previewBlobCache = new Map<string | number, string>();
const pendingFileRequests = new Map<string | number, Promise<string | null>>();

function getNextVersion(currentVersion?: string): string {
    if (!currentVersion) return 'v2.0';
    const match = currentVersion.match(/v?(\d+)(\.(\d+))?/i);
    if (match && match[1]) {
        const major = parseInt(match[1], 10);
        return `v${major + 1}.0`;
    }
    return `${currentVersion}.1`;
}

export default function FileContentViewer({
    file,
    hasAccess: propHasAccess,
    canEdit = true,
    onToggleDemoPermission,
    onRequestAccess,
    onVersionCreated
}: FileContentViewerProps) {
    const ext = file?.fileType?.toLowerCase() || '';
    const isPdf = ext === 'pdf';
    const isDocx = ext === 'docx' || ext === 'doc';
    const isXlsx = ext === 'xlsx' || ext === 'xls' || ext === 'csv';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    const isCodeOrText = ['txt', 'md', 'json', 'sql', 'py', 'java', 'ts', 'tsx', 'html', 'css', 'xml', 'yml', 'yaml', 'sh', 'bat'].includes(ext);

    const directStreamUrl = file?.id ? `http://localhost:8080/api/v1/files/${file.id}/stream` : null;

    // Chế độ: 'view' (xem trước) hoặc 'edit' (chỉnh sửa trực tiếp)
    const [viewerMode, setViewerMode] = useState<'view' | 'edit'>('view');

    // State chỉnh sửa văn bản trực tiếp
    const [editorContent, setEditorContent] = useState<string>('');
    const [originalContent, setOriginalContent] = useState<string>('');
    const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
    const [isSavingVersion, setIsSavingVersion] = useState<boolean>(false);
    const [hasTextLoaded, setHasTextLoaded] = useState<boolean>(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
        return file?.id ? previewBlobCache.get(file.id) || directStreamUrl || null : null;
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isIframeLoading, setIsIframeLoading] = useState<boolean>(false);
    const [hasLoadError, setHasLoadError] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chế độ xem: 'native' (Chuẩn Google Drive / Trực tiếp theo loại file), 'reader' (Đọc nhanh AI 0ms), 'page' (Trang in ấn A4)
    const [viewEngine, setViewEngine] = useState<'native' | 'reader' | 'page'>('native');
    const [readerText, setReaderText] = useState<string>('');
    const [isLoadingReader, setIsLoadingReader] = useState<boolean>(false);

    // State cho DOCX HTML rendering
    const [docxHtml, setDocxHtml] = useState<string>('');
    const [isLoadingDocxHtml, setIsLoadingDocxHtml] = useState<boolean>(false);
    const docxContainerRef = useRef<HTMLDivElement>(null);
    const [isRenderingDocxPage, setIsRenderingDocxPage] = useState<boolean>(false);

    // State cho Image Viewer (Zoom / Rotate)
    const [imageZoom, setImageZoom] = useState<number>(100);
    const [imageRotation, setImageRotation] = useState<number>(0);

    const loadReaderText = async () => {
        if (readerText || !file?.id) return;
        setIsLoadingReader(true);
        try {
            const text = await fileManagementService.getFileText(file.id);
            if (text) {
                setReaderText(text);
            }
        } catch (e) {
            console.warn('Lỗi tải văn bản reader:', e);
        } finally {
            setIsLoadingReader(false);
        }
    };

    // Tự động nạp trước văn bản Reader cho file Word / Excel để sẵn sàng chuyển tức thì
    useEffect(() => {
        if (file?.id) {
            loadReaderText();
        }
    }, [file?.id]);

    // Tự động tắt loading iframe sau 600ms phòng trường hợp browser PDFium plugin không bắn event onLoad
    useEffect(() => {
        if (isIframeLoading) {
            const timer = setTimeout(() => {
                setIsIframeLoading(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isIframeLoading]);

    // Quản lý quyền truy cập dự phòng (nếu không truyền từ cha)
    const [localHasAccess, setLocalHasAccess] = useState<boolean>(true);
    const [localDemoOverride, setLocalDemoOverride] = useState<'DEFAULT' | 'PERMITTED' | 'BLOCKED'>('DEFAULT');

    useEffect(() => {
        if (propHasAccess !== undefined) return;
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const user = JSON.parse(stored);
                const isAdmin = user.role === 'ADMIN';
                const isUploader = user.email && file.uploadedByEmail && user.email.toLowerCase() === file.uploadedByEmail.toLowerCase();
                const isSameDept = file.owner && user.department?.name && user.department.name.toLowerCase().includes(file.owner.toLowerCase());
                setLocalHasAccess(isAdmin || isUploader || isSameDept);
            }
        } catch (e) {
            console.warn('Lỗi kiểm tra quyền:', e);
        }
    }, [file, propHasAccess]);

    const effectiveHasAccess = propHasAccess !== undefined
        ? propHasAccess
        : (localDemoOverride === 'PERMITTED' ? true : localDemoOverride === 'BLOCKED' ? false : localHasAccess);

    // Tải và tạo URL từ Backend Java cho file hiển thị (Tối ưu hóa: Presigned URL -> Stream)
    useEffect(() => {
        if (!file?.id || !effectiveHasAccess) {
            setIsLoading(false);
            setIsIframeLoading(false);
            return;
        }

        const fileId = file.id;

        // 1. Nếu đã có trong Cache, dùng ngay tức thì (0ms)
        const cachedUrl = previewBlobCache.get(fileId);
        if (cachedUrl) {
            setPreviewUrl(cachedUrl);
            setIsLoading(false);
            setHasLoadError(false);
            return;
        }

        let isMounted = true;
        if (!previewUrl && !directStreamUrl) {
            setIsLoading(true);
        }
        setHasLoadError(false);

        // 2. Chống gọi API 2 lần do React StrictMode hoặc re-render liên tiếp
        let requestPromise = pendingFileRequests.get(fileId);

        if (!requestPromise) {
            requestPromise = (async () => {
                // ƯU TIÊN 1: Lấy S3 Presigned URL siêu tốc từ Backend (~2ms, bypass server proxy)
                try {
                    const res = await fileManagementService.getPreviewUrl(fileId);
                    if (res?.url) {
                        previewBlobCache.set(fileId, res.url);
                        return res.url;
                    }
                } catch (err) {
                    console.warn('Không thể lấy Presigned URL, đang fallback sang direct stream:', err);
                }

                // ƯU TIÊN 2: Dự phòng trực tiếp qua S3 URL nếu đã lưu công khai
                if (file.storagePath && file.storagePath.startsWith('http')) {
                    previewBlobCache.set(fileId, file.storagePath);
                    return file.storagePath;
                }

                // ƯU TIÊN 3: Dùng direct stream URL từ backend
                if (directStreamUrl) {
                    previewBlobCache.set(fileId, directStreamUrl);
                    return directStreamUrl;
                }

                return null;
            })();

            pendingFileRequests.set(fileId, requestPromise);
        }

        requestPromise
            .then((url) => {
                if (!isMounted) return;
                if (url) {
                    setPreviewUrl(url);
                    setHasLoadError(false);
                } else {
                    setHasLoadError(true);
                }
            })
            .catch(() => {
                if (!isMounted) return;
                setHasLoadError(true);
            })
            .finally(() => {
                pendingFileRequests.delete(fileId);
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [file?.id, file?.fileType, file?.storagePath, effectiveHasAccess, isPdf, directStreamUrl]);

    // Chuyển đổi DOCX sang HTML siêu tốc bằng Mammoth khi ở chế độ native
    useEffect(() => {
        if (!isDocx || (!previewUrl && !directStreamUrl) || viewerMode !== 'view' || viewEngine !== 'native') return;
        if (docxHtml) return;
        let isMounted = true;
        setIsLoadingDocxHtml(true);

        (async () => {
            try {
                const headers: Record<string, string> = {};
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (token) headers['Authorization'] = `Bearer ${token}`;

                let buffer: ArrayBuffer | null = null;
                const urls = [previewUrl, directStreamUrl].filter(Boolean) as string[];

                for (const url of urls) {
                    try {
                        const res = await fetch(url, { headers });
                        if (res.ok) {
                            buffer = await res.arrayBuffer();
                            break;
                        }
                    } catch (e) {
                        console.warn(`Lỗi nạp docx từ ${url}:`, e);
                    }
                }

                if (buffer && isMounted) {
                    const mammoth = await import('mammoth');
                    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                    if (result && result.value && isMounted) {
                        setDocxHtml(result.value);
                        setIsLoadingDocxHtml(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('Lỗi chuyển đổi Word DOCX sang HTML:', err);
            } finally {
                if (isMounted) {
                    setIsLoadingDocxHtml(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [isDocx, previewUrl, directStreamUrl, viewerMode, viewEngine]);

    // Dựng bố cục trang A4 với docx-preview khi người dùng chọn 'page'
    useEffect(() => {
        if (!isDocx || (!previewUrl && !directStreamUrl) || viewerMode !== 'view' || viewEngine !== 'page') return;
        let isMounted = true;
        setIsRenderingDocxPage(true);

        (async () => {
            try {
                const docxModule = await import('docx-preview');
                const headers: Record<string, string> = {};
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (token) headers['Authorization'] = `Bearer ${token}`;

                let blob: Blob | null = null;
                const urls = [previewUrl, directStreamUrl].filter(Boolean) as string[];

                for (const url of urls) {
                    try {
                        const res = await fetch(url, { headers });
                        if (res.ok) {
                            blob = await res.blob();
                            break;
                        }
                    } catch (e) {}
                }

                if (blob && isMounted && docxContainerRef.current) {
                    docxContainerRef.current.innerHTML = '';
                    await docxModule.renderAsync(blob, docxContainerRef.current, undefined, {
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false
                    });
                }
            } catch (err) {
                console.error('Lỗi hiển thị Word DOCX Page:', err);
                toast.error('Không thể dựng bố cục trang in, vui lòng xem ở chế độ xem chuẩn');
            } finally {
                if (isMounted) {
                    setIsRenderingDocxPage(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [isDocx, previewUrl, directStreamUrl, viewerMode, viewEngine]);

    // Xử lý chuyển sang Chế độ Chỉnh sửa trực tuyến
    const handleSwitchToEdit = async () => {
        setViewerMode('edit');
        if (hasTextLoaded) return;

        if (file?.id) {
            setIsLoadingText(true);
            try {
                // 1. Với file Word (.docx): Ưu tiên trích xuất nội dung nguyên bản bằng mammoth
                if (isDocx) {
                    let docxBlob: Blob | null = null;
                    const headers: Record<string, string> = {};
                    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const urls = [previewUrl, directStreamUrl, `http://localhost:8080/api/v1/files/${file.id}/view`].filter(Boolean) as string[];
                    for (const url of urls) {
                        try {
                            const res = await fetch(url, { headers });
                            if (res.ok) {
                                docxBlob = await res.blob();
                                break;
                            }
                        } catch (e) {}
                    }

                    if (docxBlob) {
                        const arrayBuffer = await docxBlob.arrayBuffer();
                        const mammoth = await import('mammoth');
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        if (result && result.value && result.value.trim()) {
                            setEditorContent(result.value);
                            setOriginalContent(result.value);
                            setHasTextLoaded(true);
                            setIsLoadingText(false);
                            return;
                        }
                    }
                }

                // 2. Với các file văn bản khác (txt, md, html, json, csv...) hoặc dự phòng
                const text = await fileManagementService.getFileText(file.id);
                if (text && text.trim() && !text.includes('Nhập nội dung chỉnh sửa hoặc bổ sung điều khoản')) {
                    const formattedHtml = text.startsWith('<')
                        ? text
                        : text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
                    setEditorContent(formattedHtml);
                    setOriginalContent(formattedHtml);
                    setHasTextLoaded(true);
                    setIsLoadingText(false);
                    return;
                }

                // 3. Fallback có định dạng tiêu chuẩn
                const fallbackHtml = `
                    <h1>${file.name?.replace(/\.[^/.]+$/, '') || 'TÀI LIỆU DOANH NGHIỆP'}</h1>
                    <p><strong>Phòng ban quản lý:</strong> ${file.owner || 'Doanh nghiệp'}</p>
                    <p><strong>Phiên bản hiện tại:</strong> ${file.version || 'v1.0'}</p>
                    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
                    <h2>1. Mục đích và phạm vi áp dụng</h2>
                    <p>Tài liệu này quy định các tiêu chuẩn và quy trình vận hành chung cho dự án Enterprise AI Assistant.</p>
                    <h2>2. Nội dung chi tiết</h2>
                    <p>Nhập nội dung sửa đổi, bổ sung điều khoản hoặc cập nhật quy trình tại đây...</p>
                `;
                setEditorContent(fallbackHtml);
                setOriginalContent(fallbackHtml);
                setHasTextLoaded(true);
            } catch (err) {
                console.error('Lỗi tải nội dung file:', err);
                toast.error('Đang nạp cấu trúc soạn thảo mẫu cho tài liệu.');
            } finally {
                setIsLoadingText(false);
            }
        }
    };

    // Xử lý Lưu thành Phiên bản mới từ Trình soạn thảo Word
    const handleSaveWordVersion = async (docxBlob: Blob, nextVerStr: string) => {
        if (!file?.id) return;
        setIsSavingVersion(true);
        try {
            const cleanFileName = file.name || `tai-lieu_${nextVerStr}.docx`;
            const docxFile = new File([docxBlob], cleanFileName, {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const updatedFile = await fileManagementService.uploadNewVersion(file.id, docxFile);
            toast.success(`🎉 Đã lưu thành công phiên bản mới (${nextVerStr})! Hệ thống đang tự động lập chỉ mục AI.`);

            // Xóa cache cũ để làm mới lượt xem
            previewBlobCache.delete(file.id);
            const newBlobUrl = URL.createObjectURL(docxBlob);
            previewBlobCache.set(file.id, newBlobUrl);
            setPreviewUrl(newBlobUrl);
            setHasTextLoaded(false);
            setViewerMode('view');

            if (onVersionCreated) {
                onVersionCreated(updatedFile);
            }
        } catch (err: any) {
            console.error('Lỗi lưu phiên bản Word mới:', err);
            let msg = 'Không thể lưu phiên bản mới.';
            if (err?.status === 403) {
                msg = 'Bạn không có quyền cập nhật phiên bản mới cho tài liệu này.';
            }
            toast.error(msg);
            throw err;
        } finally {
            setIsSavingVersion(false);
        }
    };

    // Mở file từ máy tính
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            const blobUrl = URL.createObjectURL(selected);
            setPreviewUrl(blobUrl);
            if (file?.id) {
                previewBlobCache.set(file.id, blobUrl);
            }
            setHasLoadError(false);
            toast.success(`Đã mở trực tiếp tệp: ${selected.name}`);
        }
    };

    const handleOpenInNewTab = () => {
        const targetUrl = directStreamUrl || previewUrl;
        if (targetUrl) {
            window.open(targetUrl, '_blank');
        } else {
            toast.error('Chưa có đường dẫn xem trước file');
        }
    };

    // Tải file trực tiếp
    const handleDownloadDirect = () => {
        const link = document.createElement('a');
        link.href = directStreamUrl || previewUrl || '#';
        link.download = file.name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =========================================================================
    // 1. TRƯỜNG HỢP BỊ CHẶN QUYỀN TRUY CẬP (RBAC LOCK)
    // =========================================================================
    if (!effectiveHasAccess) {
        return (
            <div className="rounded-xl border border-red-200/80 bg-linear-to-b from-red-50/40 to-slate-50/50 p-8 text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs border border-red-200">
                    <ShieldAlert className="w-7 h-7" />
                </div>

                <div className="max-w-md mx-auto space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100/80 text-red-800 uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        Bảo mật phân quyền RBAC
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                        Nội dung tài liệu bị giới hạn truy cập
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Tài liệu <strong>"{file.name}"</strong> thuộc thẩm quyền bảo mật của{' '}
                        <span className="text-slate-700 font-medium">{file.owner || 'Phòng ban chuyên trách'}</span>.
                        Tài khoản của bạn hiện chưa được cấp quyền <strong>Xem (Viewer)</strong> đối với tệp này.
                    </p>
                </div>

                <div className="pt-2 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={onRequestAccess}
                        className="px-5 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium flex items-center gap-2 transition shadow-xs cursor-pointer"
                    >
                        <KeyRound className="w-4 h-4" />
                        Gửi yêu cầu xin cấp quyền xem
                    </button>
                </div>
            </div>
        );
    }

    const nextVerStr = getNextVersion(file?.version);

    // =========================================================================
    // 2. TRƯỜNG HỢP CHỈNH SỬA VĂN BẢN TRỰC TUYẾN -> HIỂN THỊ TRÌNH SOẠN THẢO WORD
    // =========================================================================
    if (viewerMode === 'edit') {
        if (isLoadingText) {
            return (
                <div className="py-28 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <ToughZebraLoader theme="light" width={320} />
                    <p className="text-xs text-slate-600 mt-4 animate-pulse font-medium">
                        Đang nạp và trích xuất nội dung văn bản Word nguyên bản để chuẩn bị chỉnh sửa...
                    </p>
                </div>
            );
        }

        return (
            <WordDocumentEditor
                file={file}
                initialHtml={editorContent}
                onSaveNewVersion={handleSaveWordVersion}
                onClose={() => setViewerMode('view')}
            />
        );
    }

    // =========================================================================
    // 3. TRƯỜNG HỢP XEM TRƯỚC VĂN BẢN (VIEW MODE)
    // =========================================================================
    return (
        <div className="space-y-3">
            {/* Thanh Toolbar tinh gọn chuẩn phong cách Google Drive */}
            <div className="bg-slate-50/95 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shadow-2xs">
                {/* Thông tin file */}
                <div className="flex items-center gap-2 min-w-0">
                    <FileTypeIcon type={file.fileType} className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate max-w-[280px] sm:max-w-md" title={file.name}>
                        {file.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-200/80 text-slate-700">
                        {file.fileType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {file.version || 'v1.0'}
                    </span>

                    {/* Nút Chỉnh sửa Word nếu là file DOCX và có quyền */}
                    {isDocx && canEdit && (
                        <button
                            type="button"
                            onClick={handleSwitchToEdit}
                            className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                            title="Mở trình soạn thảo Word và tự động lưu phiên bản mới"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Chỉnh sửa Word ({nextVerStr})</span>
                        </button>
                    )}
                </div>

                {/* Nút hành động duy nhất: Tải về máy */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadDirect}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                        title="Tải tệp về máy tính để mở trên Office hoặc PDF reader"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về máy</span>
                    </button>
                </div>
            </div>

            {/* KHUNG HIỂN THỊ NỘI DUNG CHÍNH (TỰ ĐỘNG CHUẨN GOOGLE DRIVE THEO TỪNG ĐỊNH DẠNG) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white min-h-[640px] flex flex-col shadow-inner">
                {isLoading && !previewUrl && !directStreamUrl ? (
                    <div className="m-auto flex flex-col items-center justify-center py-24 px-4 space-y-3">
                        <ToughZebraLoader theme="light" width={320} />
                        <p className="text-xs text-slate-500 animate-pulse font-medium">
                            Đang mở tài liệu...
                        </p>
                    </div>
                ) : isXlsx ? (
                    /* -------------------------------------------------------------
                       2. FILE EXCEL / BẢNG TÍNH (.XLSX, .XLS, .CSV) -> GOOGLE SHEETS VIEWER
                    ------------------------------------------------------------- */
                    <ExcelSpreadsheetViewer
                        fileId={file.id}
                        fileName={file.name}
                        fileUrl={previewUrl}
                        directStreamUrl={directStreamUrl}
                        fallbackText={readerText}
                        onDownload={handleDownloadDirect}
                    />
                ) : isDocx ? (
                    /* -------------------------------------------------------------
                       3. FILE WORD (.DOCX, .DOC)
                    ------------------------------------------------------------- */
                    viewEngine === 'page' ? (
                        /* Chế độ Trang in ấn A4 (docx-preview) */
                        <div className="w-full flex-1 min-h-[640px] bg-slate-200/50 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
                            {isRenderingDocxPage && (
                                <div className="m-auto flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <ToughZebraLoader theme="light" width={320} />
                                    <p className="text-xs text-slate-600 mt-3 font-medium">
                                        Đang dựng từng trang in ấn Word A4...
                                    </p>
                                </div>
                            )}
                            <div
                                ref={docxContainerRef}
                                className={`w-full max-w-4xl bg-white shadow-md rounded-xl p-4 sm:p-8 border border-slate-200 overflow-x-auto text-slate-800 ${
                                    isRenderingDocxPage ? 'hidden' : 'block'
                                }`}
                            />
                        </div>
                    ) : (
                        /* Chế độ Xem chuẩn tức thì bằng Mammoth HTML (< 50ms) */
                        <div className="w-full flex-1 min-h-[640px] bg-slate-50/50 p-4 sm:p-8 overflow-y-auto">
                            {isLoadingDocxHtml && !docxHtml ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <ToughZebraLoader theme="light" width={320} />
                                    <p className="text-xs text-slate-500 mt-3 font-medium animate-pulse">
                                        Đang hiển thị văn bản Word...
                                    </p>
                                </div>
                            ) : docxHtml ? (
                                <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-xs">
                                    <div
                                        className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                                    />
                                </div>
                            ) : readerText ? (
                                <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-4">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                        <FileText className="w-3.5 h-3.5" />
                                        Nội dung văn bản Word trích xuất
                                    </div>
                                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {readerText}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 space-y-3">
                                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="text-xs text-slate-500">Chưa tải được nội dung văn bản Word.</p>
                                    <button
                                        type="button"
                                        onClick={handleDownloadDirect}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                                    >
                                        Tải tệp Word về máy
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                ) : isPdf ? (
                    /* -------------------------------------------------------------
                       4. FILE PDF (.PDF) -> TRÌNH XEM NATIVE BROWSER PDFIUM
                    ------------------------------------------------------------- */
                    <div className="relative w-full flex-1 min-h-[640px] flex flex-col bg-slate-100">
                        {isIframeLoading && (
                            <div className="absolute inset-0 z-10 bg-slate-50/90 flex flex-col items-center justify-center py-20 px-4 text-center">
                                <ToughZebraLoader theme="light" width={320} />
                                <p className="text-xs text-slate-600 mt-3 font-medium">
                                    Đang nạp tài liệu PDF chuẩn Chrome/Edge...
                                </p>
                            </div>
                        )}
                        <iframe
                            src={previewUrl || directStreamUrl || ''}
                            onLoad={() => setIsIframeLoading(false)}
                            className="w-full flex-1 min-h-[640px] border-none bg-white"
                            title={`Trình xem tài liệu PDF: ${file.name}`}
                        />
                    </div>
                ) : isImage ? (
                    /* -------------------------------------------------------------
                       5. FILE HÌNH ẢNH (.PNG, .JPG, .JPEG, .WEBP, .SVG)
                    ------------------------------------------------------------- */
                    <div className="w-full flex-1 min-h-[640px] flex flex-col bg-slate-900 text-white select-none">
                        {/* Thanh công cụ xem ảnh: Zoom, Xoay, Tải về */}
                        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-blue-400" />
                                <span className="font-medium text-slate-200 truncate max-w-xs">{file.name}</span>
                                <span className="text-slate-400">({imageZoom}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setImageZoom(prev => Math.max(prev - 25, 25))}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                    title="Thu nhỏ"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageZoom(100)}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
                                    title="Đặt lại 100%"
                                >
                                    100%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageZoom(prev => Math.min(prev + 25, 400))}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                    title="Phóng to"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-2"
                                    title="Xoay hình 90°"
                                >
                                    <RotateCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Khung hiển thị ảnh */}
                        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-slate-900">
                            <img
                                src={previewUrl || directStreamUrl || ''}
                                alt={file.name}
                                style={{
                                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                                    transition: 'transform 0.15s ease'
                                }}
                                className="max-h-[580px] max-w-full object-contain rounded-lg shadow-xl"
                            />
                        </div>
                    </div>
                ) : isCodeOrText ? (
                    /* -------------------------------------------------------------
                       6. FILE VĂN BẢN THUẦN HOẶC SOURCE CODE (.TXT, .MD, .JSON, .SQL, .PY...)
                    ------------------------------------------------------------- */
                    <div className="w-full flex-1 min-h-[640px] flex flex-col bg-slate-900 text-slate-200 font-mono text-xs select-text">
                        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-emerald-400" />
                                <span className="font-semibold text-slate-300">{file.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (readerText) {
                                        navigator.clipboard.writeText(readerText);
                                        toast.success('Đã sao chép nội dung tệp!');
                                    }
                                }}
                                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans transition flex items-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Sao chép
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-auto">
                            <pre className="whitespace-pre leading-relaxed font-mono">
                                {readerText || 'Đang tải nội dung văn bản...'}
                            </pre>
                        </div>
                    </div>
                ) : (
                    /* -------------------------------------------------------------
                       7. CÁC TỆP ĐẶC BIỆT KHÁC (ZIP, RAR, BINARY KHÁC)
                    ------------------------------------------------------------- */
                    <div className="m-auto max-w-md p-8 text-center space-y-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                            <FileTypeIcon type={file.fileType} className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-slate-800">
                                {file.name}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Định dạng <strong>.{file.fileType?.toUpperCase()}</strong> ({file.size || 'Tài liệu'}). Bạn có thể tải tệp trực tiếp về máy tính để mở bằng ứng dụng tương thích.
                            </p>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownloadDirect}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Tải tệp về máy tính
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                                Mở từ máy tính
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
