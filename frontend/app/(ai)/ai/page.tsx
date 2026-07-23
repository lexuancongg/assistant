'use client';
import { useRef, useState } from 'react';
import {
    Upload,
    FileText,
    Mail,
    FileSignature,
    Receipt,
    MessageSquare,
    BarChart3,
    MoreVertical,
    ChevronRight,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import imageService from "@/services/auth/image/imageService";
import documentService from "@/services/documents/documentService";

const ACCEPTED_EXTENSIONS = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.eml',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.bmp',
    '.tiff',
    '.tif',
    '.gif',
    '.heic',
    '.heif'
];
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const stats = [
    {
        label: 'Tài liệu đã xử lý',
        value: '1,248',
        change: '+ 12.5% so với tháng trước',
        icon: FileText,
        bg: 'bg-purple-50',
        color: 'text-purple-600',
    },
    {
        label: 'Hóa đơn',
        value: '856',
        change: '+ 8.3% so với tháng trước',
        icon: Receipt,
        bg: 'bg-blue-50',
        color: 'text-blue-600',
    },
    {
        label: 'Email',
        value: '312',
        change: '+ 15.7% so với tháng trước',
        icon: Mail,
        bg: 'bg-orange-50',
        color: 'text-orange-500',
    },
    {
        label: 'Hợp đồng',
        value: '80',
        change: '+ 5.2% so với tháng trước',
        icon: FileSignature,
        bg: 'bg-green-50',
        color: 'text-green-600',
    },
];

const recentDocuments = [
    {
        name: 'HD_2024_000123.pdf',
        type: 'Hóa đơn',
        typeColor: 'bg-red-50 text-red-500',
        icon: FileText,
        iconColor: 'bg-red-50 text-red-500',
        date: '20/05/2024 10:30',
        size: '2.4 MB',
    },
    {
        name: 'Re_ Bao gia thang 5.eml',
        type: 'Email',
        typeColor: 'bg-blue-50 text-blue-500',
        icon: Mail,
        iconColor: 'bg-blue-50 text-blue-500',
        date: '20/05/2024 09:15',
        size: '1.1 MB',
    },
    {
        name: 'Hop_dong_hop_tac_ABC.docx',
        type: 'Hợp đồng',
        typeColor: 'bg-green-50 text-green-600',
        icon: FileSignature,
        iconColor: 'bg-blue-50 text-blue-500',
        date: '19/05/2024 16:45',
        size: '3.7 MB',
    },
    {
        name: 'HD_2024_000122.pdf',
        type: 'Hóa đơn',
        typeColor: 'bg-red-50 text-red-500',
        icon: FileText,
        iconColor: 'bg-red-50 text-red-500',
        date: '19/05/2024 11:20',
        size: '2.1 MB',
    },
    {
        name: 'Fwd_ Thong tin khach hang.eml',
        type: 'Email',
        typeColor: 'bg-blue-50 text-blue-500',
        icon: Mail,
        iconColor: 'bg-blue-50 text-blue-500',
        date: '18/05/2024 14:05',
        size: '980 KB',
    },
];

const quickActions = [
    {
        label: 'Chat với AI',
        desc: 'Đặt câu hỏi về dữ liệu của bạn',
        icon: MessageSquare,
        bg: 'bg-indigo-50',
        color: 'text-indigo-600',
    },
    {
        label: 'Tải lên hóa đơn',
        desc: 'Thêm hóa đơn mới',
        icon: Receipt,
        bg: 'bg-red-50',
        color: 'text-red-500',
    },
    {
        label: 'Tải lên email',
        desc: 'Thêm email mới',
        icon: Mail,
        bg: 'bg-blue-50',
        color: 'text-blue-500',
    },
    {
        label: 'Tải lên hợp đồng',
        desc: 'Thêm hợp đồng mới',
        icon: FileSignature,
        bg: 'bg-green-50',
        color: 'text-green-600',
    },
    {
        label: 'Xem báo cáo',
        desc: 'Thống kê & phân tích dữ liệu',
        icon: BarChart3,
        bg: 'bg-purple-50',
        color: 'text-purple-600',
    },
];

const activities = [
    {
        text: 'Đã xử lý hóa đơn HD_2024_000123.pdf',
        time: '10:30 AM',
        icon: FileText,
        color: 'text-red-500',
    },
    {
        text: 'Đã lưu email từ Re_ Bao gia thang 5.eml',
        time: '09:15 AM',
        icon: Mail,
        color: 'text-blue-500',
        bold: 'Re_ Bao gia thang 5.eml',
    },
    {
        text: 'Đã trích xuất hợp đồng Hop_dong_ABC.docx',
        time: 'Hôm qua, 04:45 PM',
        icon: FileSignature,
        color: 'text-green-600',
    },
    {
        text: 'Bạn đã đặt câu hỏi với AI',
        sub: 'Tìm tất cả hóa đơn của tháng 5/2024',
        time: 'Hôm qua, 03:20 PM',
        icon: MessageSquare,
        color: 'text-indigo-500',
    },
    {
        text: 'Đã xử lý hóa đơn HD_2024_000122.pdf',
        time: 'Hôm qua, 11:20 AM',
        icon: FileText,
        color: 'text-red-500',
    },
];

export default function HomePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    function getExtension(fileName: string) {
        const dotIndex = fileName.lastIndexOf('.');
        return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
    }

    function validateFile(file: File): string | null {
        const ext = getExtension(file.name);
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            return `Định dạng "${ext || 'không xác định'}" không được hỗ trợ. Chỉ chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `File vượt quá dung lượng tối đa ${MAX_FILE_SIZE_MB}MB`;
        }
        return null;
    }

    async function uploadFiles(files: FileList | File[]) {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                setStatus('error');
                setErrorMessage(error);
                return;
            }
        }

        setStatus('uploading');
        setErrorMessage('');





        try {
            // TODO: thay đoạn này bằng API thực tế, ví dụ:
            const formData = new FormData();
            formData.append('file',fileArray[0])
            // fileArray.forEach((file) => formData.append('files', file));
            documentService.uploadDocumentToS3(formData)
                .then((res)=>{
                    setStatus('success');
                    setToastMessage('Tải lên thành công. AI đang xử lý tài liệu của bạn.');
                })
                .catch(()=>{
                  setToastMessage('Tải lên thất bại. Vui lòng thử lại.');
                  throw new Error('Upload thất bại');
                })


            // await new Promise((resolve) => setTimeout(resolve, 1200)); // giả lập xử lý
        } catch (err) {
            setStatus('error');
            setErrorMessage('Đã có lỗi xảy ra khi tải lên. Vui lòng thử lại.');
            setToastMessage('Đã có lỗi xảy ra khi tải lên. Vui lòng thử lại.');
        } finally {
            setTimeout(() => setStatus('idle'), 2500);
        }
    }

    function handleClickUpload() {
        fileInputRef.current?.click();
    }

    function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {

        if (e.target.files) {
            uploadFiles(e.target.files);
        }
        e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            uploadFiles(e.dataTransfer.files);
        }
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* toast */}
            {toastMessage && (
                <div className="fixed right-4 top-4 bg-black text-white px-4 py-2 rounded shadow z-50">
                    {toastMessage}
                </div>
            )}
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Chào mừng trở lại! <span>👋</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                    AI Assistant đã sẵn sàng hỗ trợ bạn tìm kiếm và phân tích thông tin từ
                    hóa đơn, email, hợp đồng và tài liệu doanh nghiệp.
                </p>
            </div>

            {/* Upload + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                {/* Upload box */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClickUpload}
                    className={`bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 px-6 text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_EXTENSIONS.join(',')}
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center -rotate-6">
                            <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <Mail className="w-7 h-7 text-white" />
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center rotate-6">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Tải lên hóa đơn, email, hợp đồng hoặc tài liệu
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        AI sẽ tự động đọc, trích xuất thông tin và lưu vào cơ sở dữ liệu
                    </p>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClickUpload();
                        }}
                        disabled={status === 'uploading'}
                        className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
                    >
                        {status === 'uploading' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {status === 'uploading' ? 'Đang tải lên...' : 'Tải lên tài liệu'}
                    </button>

                    <p className="text-xs text-gray-400 mt-3">
                        Kéo &amp; thả file vào đây hoặc click để chọn
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                        Hỗ trợ: PDF, DOCX, XLSX, TXT, EML &nbsp;•&nbsp; Tối đa 50MB / file
                    </p>

                    {status === 'success' && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Tải lên thành công! AI đang xử lý tài liệu của bạn.
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            {errorMessage}
                        </p>
                    )}
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Hành động nhanh
                    </h3>
                    <div className="flex flex-col gap-1">
                        {quickActions.map(({ label, desc, icon: Icon, bg, color }) => (
                            <button
                                key={label}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}
                                >
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 leading-tight">
                                        {label}
                                    </p>
                                    <p className="text-xs text-gray-400 leading-tight truncate">
                                        {desc}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, change, icon: Icon, bg, color }) => (
                    <div
                        key={label}
                        className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
                    >
                        <div
                            className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                        >
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900 leading-tight">
                                {value}
                            </p>
                            <p className="text-sm text-gray-500 leading-tight">{label}</p>
                            <p className="text-xs text-green-500 mt-1">↑ {change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Documents + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                {/* Recent documents */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Tài liệu gần đây
                        </h3>
                        <button className="text-xs font-medium text-blue-600 hover:underline">
                            Xem tất cả
                        </button>
                    </div>
                    <div className="flex flex-col">
                        {recentDocuments.map((doc) => (
                            <div
                                key={doc.name}
                                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg ${doc.iconColor} flex items-center justify-center shrink-0`}
                                >
                                    <doc.icon className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">
                                    {doc.name}
                                </p>
                                <span
                                    className={`text-xs font-medium px-2 py-1 rounded-full ${doc.typeColor} hidden sm:inline-block`}
                                >
                                    {doc.type}
                                </span>
                                <span className="text-xs text-gray-400 w-32 hidden md:inline-block">
                                    {doc.date}
                                </span>
                                <span className="text-xs text-gray-400 w-16 hidden lg:inline-block">
                                    {doc.size}
                                </span>
                                <button className="text-gray-300 hover:text-gray-500 transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Hoạt động gần đây
                    </h3>
                    <div className="flex flex-col gap-4 flex-1">
                        {activities.map((act, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <act.icon className={`w-4 h-4 mt-0.5 shrink-0 ${act.color}`} />
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-700 leading-snug">
                                        {act.text}
                                    </p>
                                    {act.sub && (
                                        <p className="text-xs text-gray-400 leading-snug">
                                            {act.sub}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full text-center text-sm font-medium text-blue-600 border border-gray-100 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
                        Xem tất cả hoạt động
                    </button>
                </div>
            </div>
        </div>
    );
}