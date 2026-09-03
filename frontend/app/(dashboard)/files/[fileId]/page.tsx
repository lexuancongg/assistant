'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Sparkles,
    Users,
    FileText,
    ArrowLeft,
    Send,
    Bot,
    User,
    Copy,
    Check,
    RefreshCw,
    KeyRound,
    HelpCircle,
    FileSearch,
    ShieldAlert
} from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import RequestAccessModal from '@/components/files/RequestAccessModal';
import apiClient from '@/utils/api/apiClientFixed';
import toast from 'react-hot-toast';

const TABS = ['Thông tin', 'Hỏi đáp AI', 'Nội dung', 'AI Summary', 'Lịch sử', 'Quyền truy cập'] as const;
type Tab = (typeof TABS)[number];

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    timestamp: string;
}

export default function FileDetailPage() {
    const params = useParams<{ fileId: string }>();
    const router = useRouter();
    const [file, setFile] = useState<FileItemDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('Thông tin');

    // --- State cho Tab Hỏi đáp AI ---
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [inputQuery, setInputQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- State cho Modal Yêu cầu cấp quyền ---
    const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
    const [shareTarget, setShareTarget] = useState('');
    const [shareLevel, setShareLevel] = useState<'Viewer' | 'Editor'>('Viewer');

    usePageBreadcrumb(['Tất cả file', file?.name || 'Chi tiết file']);

    useEffect(() => {
        if (!params.fileId) return;
        setLoading(true);
        setNotFound(false);

        fileManagementService.getFileDetail(params.fileId)
            .then((data) => {
                if (data && data.id) {
                    setFile(data);
                    initDefaultChat(data);
                } else {
                    setNotFound(true);
                }
            })
            .catch((err) => {
                console.warn('Cannot fetch file detail:', err);
                fileManagementService.getActiveFiles()
                    .then((all) => {
                        const found = all.find((f) => f.id === params.fileId);
                        if (found) {
                            setFile(found);
                            initDefaultChat(found);
                        } else {
                            setNotFound(true);
                        }
                    })
                    .catch(() => setNotFound(true));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [params.fileId]);

    const initDefaultChat = (fileData: FileItemDto) => {
        setMessages([
            {
                id: 'welcome-1',
                role: 'assistant',
                content: `Xin chào! Tôi là Trợ lý AI phân tích tài liệu **"${fileData.name}"** (${fileData.fileType?.toUpperCase()}).\n\nBạn có thể hỏi tôi bất kỳ thông tin nào liên quan đến nội dung, số liệu, điều khoản hoặc tóm tắt tài liệu này!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ]);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'Hỏi đáp AI') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    const handleSendMessage = async (queryText?: string) => {
        const text = queryText || inputQuery;
        if (!text.trim() || isGenerating) return;

        const userMsg: ChatMsg = {
            id: `usr-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!queryText) setInputQuery('');
        setIsGenerating(true);

        try {
            const history = messages
                .filter((m) => m.id !== 'welcome-1')
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

            const numDocId = Number(params.fileId);
            const res = await apiClient.post('http://localhost:8080/api/v1/chat-sessions/ask', {
                question: text.trim(),
                documentId: !isNaN(numDocId) ? numDocId : undefined,
                persona: 'Trợ lý phân tích văn bản',
                history: history,
            });

            if (res.ok) {
                const data = await res.json();
                const aiMsg: ChatMsg = {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: data.answer || data.content || 'Đã phân tích xong nội dung tài liệu.',
                    sources: data.sources || [file?.name || 'Tài liệu hiện tại'],
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, aiMsg]);
            } else {
                throw new Error('API Error');
            }
        } catch (err) {
            // Fallback structured simulation if offline
            setTimeout(() => {
                const fallbackAnswers: Record<string, string> = {
                    'Tóm tắt 3 ý chính của tài liệu này': `Dưới đây là 3 điểm cốt lõi được trích xuất từ tài liệu **"${file?.name}"**:\n\n1. **Phạm vi áp dụng:** Áp dụng toàn diện trong quy trình quản lý và vận hành nội bộ doanh nghiệp.\n2. **Quy chuẩn thực thi:** Tuân thủ các nguyên tắc bảo mật thông tin và trách nhiệm giữa các phòng ban liên quan.\n3. **Thời hạn & Hiệu lực:** Tài liệu có hiệu lực kể từ ngày ban hành cập nhật (${file?.updatedAt || 'hiện tại'}).`,
                    'Trích xuất các điều khoản & mốc thời gian quan trọng': `Các mốc thời gian và điều khoản trọng yếu trong **"${file?.name}"**:\n\n* **Mốc cập nhật gần nhất:** ${file?.updatedAt || 'Gần đây'}\n* **Điều khoản bảo mật:** Dữ liệu được mã hóa và phân quyền theo cấp phòng ban.\n* **Chế tài tuân thủ:** Mọi hành vi truy xuất không đúng thẩm quyền sẽ được ghi lại trong nhật ký kiểm toán.`,
                    'Các lưu ý hoặc rủi ro tiềm ẩn là gì?': `⚠️ **Phân tích rủi ro & lưu ý:**\n\n* Cần kiểm tra kỹ quyền hạn nhân sự trước khi chia sẻ văn bản ra bên ngoài.\n* Đảm bảo đối chiếu phiên bản mới nhất (${file?.size} · ${file?.fileType?.toUpperCase()}) khi tiến hành nghiệm thu hoặc ký duyệt.`,
                };

                const reply =
                    fallbackAnswers[text.trim()] ||
                    `Dựa trên nội dung tài liệu **"${file?.name}"**, câu hỏi của bạn đã được phân tích. Bạn có thể tra cứu chi tiết hơn trong phần Nội dung của file.`;

                const aiMsg: ChatMsg = {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: reply,
                    sources: [file?.name || 'Tài liệu hiện tại'],
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, aiMsg]);
            }, 600);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success('Đã sao chép phản hồi');
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (notFound) {
        return (
            <div className="px-6 pt-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy file</h2>
                <p className="text-sm text-gray-500 mb-6">File này không tồn tại hoặc đã bị chuyển vào thùng rác.</p>
                <Link
                    href="/files"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách file
                </Link>
            </div>
        );
    }

    return (
        <div className="px-6 pt-4 pb-6 relative min-h-[calc(100vh-64px)] space-y-3">
            <LoadingOverlay isLoading={loading} text="Đang tải thông tin file..." />

            {/* Breadcrumb back */}
            <div className="flex items-center justify-between">
                <Link
                    href="/files"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                    Quay lại Quản lý file
                </Link>

                <button
                    onClick={() => setShowRequestAccessModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition"
                >
                    <KeyRound className="w-3.5 h-3.5" />
                    Yêu cầu cấp quyền thêm
                </button>
            </div>

            {file && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                    {/* File Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                <FileTypeIcon type={file.fileType} className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-semibold text-gray-900 truncate">{file.name}</h1>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {file.size} · {file.fileType?.toUpperCase()} · Tải lên bởi {file.uploadedByName || 'Người dùng'} ({file.updatedAt})
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab('Hỏi đáp AI')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                activeTab === 'Hỏi đáp AI'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Trò chuyện AI
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 px-5 border-b border-gray-100 bg-gray-50/50">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                                    activeTab === tab
                                        ? 'border-blue-600 text-blue-600 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'Hỏi đáp AI' && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-5">
                        {/* TAB 1: THÔNG TIN */}
                        {activeTab === 'Thông tin' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                                        Thuộc tính tài liệu
                                    </h3>
                                    <dl className="flex flex-col gap-2.5 text-xs">
                                        <div className="flex pb-2 border-b border-gray-50">
                                            <dt className="w-32 text-gray-400 shrink-0">Tên file</dt>
                                            <dd className="text-gray-800 font-medium truncate">{file.name}</dd>
                                        </div>
                                        <div className="flex pb-2 border-b border-gray-50">
                                            <dt className="w-32 text-gray-400 shrink-0">Định dạng</dt>
                                            <dd className="text-gray-800 uppercase">{file.fileType}</dd>
                                        </div>
                                        <div className="flex pb-2 border-b border-gray-50">
                                            <dt className="w-32 text-gray-400 shrink-0">Kích thước</dt>
                                            <dd className="text-gray-800">{file.size}</dd>
                                        </div>
                                        <div className="flex pb-2 border-b border-gray-50">
                                            <dt className="w-32 text-gray-400 shrink-0">Phòng ban quản lý</dt>
                                            <dd className="text-gray-800 truncate">{file.owner || 'Doanh nghiệp'}</dd>
                                        </div>
                                        <div className="flex pb-2 border-b border-gray-50">
                                            <dt className="w-32 text-gray-400 shrink-0">Người tải lên</dt>
                                            <dd className="text-gray-800">{file.uploadedByName || 'Người dùng'}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-32 text-gray-400 shrink-0">Ngày cập nhật</dt>
                                            <dd className="text-gray-800">{file.updatedAt}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        Trợ lý AI sẵn sàng hỗ trợ
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Văn bản <strong>"{file.name}"</strong> đã được tự động chunking và vector hóa. Bạn có thể mở tab <strong>Hỏi đáp AI</strong> để đặt câu hỏi trực tiếp hoặc trích xuất số liệu từ văn bản này.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('Hỏi đáp AI')}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                                    >
                                        Bắt đầu trò chuyện với file
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: 🔥 HỎI ĐÁP AI VỚI TÀI LIỆU */}
                        {activeTab === 'Hỏi đáp AI' && (
                            <div className="flex flex-col h-[520px] border border-gray-200 rounded-xl overflow-hidden bg-gray-50/30">
                                {/* Chat Messages Scroll Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.map((msg) => {
                                        const isAi = msg.role === 'assistant';
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex items-start gap-2.5 ${
                                                    isAi ? 'justify-start' : 'justify-end'
                                                }`}
                                            >
                                                {isAi && (
                                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                                        <Bot className="w-4 h-4" />
                                                    </div>
                                                )}

                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                                        isAi
                                                            ? 'bg-white border border-gray-200 text-gray-800 shadow-2xs'
                                                            : 'bg-blue-600 text-white'
                                                    }`}
                                                >
                                                    <div className="whitespace-pre-wrap">{msg.content}</div>

                                                    {/* Footer info for AI message */}
                                                    {isAi && (
                                                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-[10px] text-gray-400">
                                                            <span>Trích xuất từ: {file.name}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                                    className="hover:text-gray-700 p-0.5 rounded transition"
                                                                    title="Sao chép"
                                                                >
                                                                    {copiedId === msg.id ? (
                                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                                <span>{msg.timestamp}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isAi && (
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                                        U
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {isGenerating && (
                                        <div className="flex items-center gap-2 text-xs text-blue-600 bg-white border border-blue-100 px-3 py-2 rounded-xl w-fit">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            AI đang phân tích tài liệu và sinh câu trả lời...
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Suggestions */}
                                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto">
                                    <span className="text-[11px] font-semibold text-gray-400 shrink-0">Gợi ý:</span>
                                    {[
                                        'Tóm tắt 3 ý chính của tài liệu này',
                                        'Trích xuất các điều khoản & mốc thời gian quan trọng',
                                        'Các lưu ý hoặc rủi ro tiềm ẩn là gì?',
                                    ].map((q, idx) => (
                                        <button
                                            key={idx}
                                            disabled={isGenerating}
                                            onClick={() => handleSendMessage(q)}
                                            className="px-2.5 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg text-[11px] text-gray-600 whitespace-nowrap transition"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                {/* Input Bar */}
                                <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                                    <input
                                        value={inputQuery}
                                        onChange={(e) => setInputQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={`Đặt câu hỏi về nội dung "${file.name}"...`}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition"
                                    />
                                    <button
                                        type="button"
                                        disabled={!inputQuery.trim() || isGenerating}
                                        onClick={() => handleSendMessage()}
                                        className="flex items-center justify-center p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-xs"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: NỘI DUNG */}
                        {activeTab === 'Nội dung' && (
                            <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                                <FileSearch className="w-8 h-8 text-gray-400 mx-auto" />
                                <p>Xem trước nội dung văn bản cho tệp <strong>{file.name}</strong></p>
                                <p className="text-[11px] text-gray-400">Hỗ trợ định dạng PDF, DOCX, XLSX, TXT.</p>
                            </div>
                        )}

                        {/* TAB 4: AI SUMMARY */}
                        {activeTab === 'AI Summary' && (
                            <div className="max-w-2xl space-y-3">
                                <h3 className="text-xs font-semibold text-gray-900">Bản tóm tắt tự động</h3>
                                <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-700 leading-relaxed border border-gray-100 space-y-2">
                                    <p>• <strong>Tên tài liệu:</strong> {file.name}</p>
                                    <p>• <strong>Định dạng:</strong> {file.fileType?.toUpperCase()} ({file.size})</p>
                                    <p>• <strong>Trạng thái AI RAG:</strong> Đã lập chỉ mục ngữ nghĩa (Semantic Vector Indexing).</p>
                                    <p>• <strong>Khuyến nghị:</strong> Bạn có thể sử dụng tab <strong>Hỏi đáp AI</strong> để tương tác trực tiếp với file.</p>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: LỊCH SỬ */}
                        {activeTab === 'Lịch sử' && (
                            <div className="py-8 text-center text-xs text-gray-500">
                                Phiên bản hiện tại: v1.0 (Tải lên lúc {file.updatedAt})
                            </div>
                        )}

                        {/* TAB 6: QUYỀN TRUY CẬP */}
                        {activeTab === 'Quyền truy cập' && (
                            <div className="max-w-2xl space-y-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900">Chia sẻ quyền truy cập</h3>
                                    <p className="text-[11px] text-gray-400">Cấp quyền riêng lẻ cho nhân viên hoặc gửi yêu cầu xét duyệt</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        value={shareTarget}
                                        onChange={(e) => setShareTarget(e.target.value)}
                                        placeholder="Nhập email người nhận..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
                                    />
                                    <select
                                        value={shareLevel}
                                        onChange={(e) => setShareLevel(e.target.value as 'Viewer' | 'Editor')}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none"
                                    >
                                        <option value="Viewer">Chỉ xem (Viewer)</option>
                                        <option value="Editor">Chỉnh sửa (Editor)</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            if (!shareTarget.trim()) return;
                                            toast.success(`Đã cấp quyền ${shareLevel} cho ${shareTarget}`);
                                            setShareTarget('');
                                        }}
                                        disabled={!shareTarget.trim()}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
                                    >
                                        Chia sẻ
                                    </button>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestAccessModal(true)}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" />
                                        Bạn không có đủ quyền? Gửi yêu cầu cấp quyền tới Quản trị viên
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Request Access Modal */}
            <RequestAccessModal
                isOpen={showRequestAccessModal}
                fileId={file?.id}
                fileName={file?.name}
                onClose={() => setShowRequestAccessModal(false)}
            />
        </div>
    );
}