'use client';

import {useEffect, useState, useRef} from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    File as FileIcon,
    Files,
    FileSignature,
    FileSpreadsheet,
    FileText,
    Filter,
    Mail,
    MessageSquareText,
    MoreVertical,
    Paperclip,
    Pencil,
    Receipt,
    Search,
    Send,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import {DashboardStats, DocumentDetail, DocumentItem, DocumentStatus, DocumentType} from "@/models/docs/docs";
import docService from "@/services/docs/docService";
import chatService from "@/services/chat/chatService";
import {ChatMessage, ChatRequest, ChatSession, MessageRole} from "@/models/chat-message/chat";

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */






const statMeta = {
    total:    { label: 'Tất cả tài liệu', icon: FileText,      color: 'text-purple-600 bg-purple-50' },
    contract: { label: 'Hợp đồng',        icon: FileSignature, color: 'text-teal-600 bg-teal-50' },
    invoice:  { label: 'Hóa đơn',         icon: Receipt,       color: 'text-orange-600 bg-orange-50' },
    email:    { label: 'Email',           icon: Mail,          color: 'text-indigo-600 bg-indigo-50' },
    other:    { label: 'Tài liệu khác',   icon: Files,         color: 'text-gray-600 bg-gray-100' },
} as const;



const typeBadgeStyle: Record<DocumentType, string> = {
    CONTRACT: 'bg-green-50 text-green-700',
    INVOICE: 'bg-orange-50 text-orange-700',
    EMAIL: 'bg-blue-50 text-blue-700',
    OTHER: 'bg-gray-100 text-gray-600',
};

function fileIconMeta(ext: string) {
    switch (ext) {
        case 'pdf':
            return { Icon: FileText, style: 'text-red-500 bg-red-50' };
        case 'eml':
            return { Icon: Mail, style: 'text-sky-500 bg-sky-50' };
        case 'docx':
            return { Icon: FileIcon, style: 'text-blue-500 bg-blue-50' };
        default:
            return { Icon: FileText, style: 'text-red-500 bg-red-50' };
    }
}





/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const formatValue = (key: string, value: any) => {
    if (value == null) return '--';

    if (key === 'signedDate' || key === 'expiryDate') {
        return new Date(value).toLocaleDateString('vi-VN');
    }

    if (key === 'value') {
        return Number(value).toLocaleString('vi-VN');
    }

    return value;
};
const CONTRACT_FIELDS: Record<string, string> = {
    contractNumber: 'Số hợp đồng',
    customer: 'Khách hàng',
    supplier: 'Nhà cung cấp',
    signedDate: 'Ngày ký',
    expiryDate: 'Ngày hết hạn',
    value: 'Giá trị hợp đồng',
    currency: 'Đơn vị tiền tệ',
    contractType: 'Loại hợp đồng',
};
const CONTRACT_STATE_LABEL: Record<string, string> = {
    DRAFT: 'Bản nháp',
    ACTIVE: 'Đang hiệu lực',
    EXPIRED: 'Hết hạn',
    TERMINATED: 'Đã chấm dứt',
    NEEDS_REVIEW: 'Cần kiểm tra',
};

const CONTRACT_STATE_STYLE: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-yellow-50 text-yellow-700',
    TERMINATED: 'bg-red-50 text-red-700',
    NEEDS_REVIEW: 'bg-orange-50 text-orange-700',
};
export default function SavedDataPage() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'ocr' | 'history'>('info');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [stats, setStats] = useState<DashboardStats>()
    const [documents,setDocuments] = useState<DocumentItem[]>([])
    const [documentDetail,setDocumentDetail] = useState<DocumentDetail>();

    const [chatSession,setChatSession] = useState<ChatSession>();

    // chat UI states
    const [loadingReply, setLoadingReply] = useState(false);
    const [persona, setPersona] = useState<string | null>('default');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    // citation highlight & toast
    const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const selectedDoc = documents.find((d) => d.id === selectedId) ?? null;

    function openRow(id: number) {
        setActiveTab('info');
        setSelectedId(id);
    }

    function closePanel() {
        setSelectedId(null);
    }

    async function sendMessage(prefill?: string) {
        const text = (prefill ?? chatInput).trim();
        if (!text) return;

        // push user message and clear input
        setMessages((prev) => [
            ...prev,
            { role: MessageRole.USER, content: text, time: nowLabel() },
        ]);
        setChatInput('');

        // start loading
        setLoadingReply(true);

        const chatRequest:ChatRequest = {
            sessionId: chatSession?.session ?? undefined,
            documentId: selectedId,
            question: text,
            persona: persona ?? undefined,
        }

        try{
            const res = await chatService.ask(chatRequest);
            const sources = res.sources ?? [];
            const sourceText = sources.length > 0 ? sources.map(s=>{
                const docPart = s.documentId ? `Doc ${s.documentId}` : 'Unknown doc';
                const chunkPart = s.chunkIndex!=null ? `chunk ${s.chunkIndex}` : '';
                const contentPart = s.content ? s.content.substring(0,200) : '';
                return `${docPart} ${chunkPart}: ${contentPart}`;
            }).join('\n') : undefined;

            setMessages(prev=>[
                ...prev,
                {
                    role: MessageRole.AL,
                    content: res.answer,
                    time: nowLabel(),
                    source: sourceText,
                    sources: sources
                }
            ]);

            if(res.sessionId){
                setChatSession((cs:any)=>({...cs, session: res.sessionId}));
            }
        }catch(err){
            console.error('Chat ask error',err);
            setMessages(prev=>[
                ...prev,
                { role: MessageRole.AL, content: 'Đã có lỗi khi gọi AI. Vui lòng thử lại sau.', time: nowLabel() }
            ])
        } finally{
            setLoadingReply(false);
        }
    }

    useEffect(() => {
        docService.getDashboardStats()
            .then(res=>{
                setStats(res)
            })

        docService.getDocsPaging()
            .then(setDocuments)
            .catch(()=>setToastMessage('Không tải được danh sách tài liệu'))
    }, []);

    useEffect(() => {
        if(!selectedId){
            return;
        }
        docService.getDocDetail(selectedId)
            .then(res=>{
                setDocumentDetail(res)
            })

        chatService.getChatSession(selectedId)
            .then(res=>{
                setMessages(res.messages)
                setChatSession(res)
            })

    }, [selectedId]);

    // auto-scroll to bottom and toast cleanup
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (messagesContainerRef.current) {
            const el = messagesContainerRef.current;
            el.scrollTop = el.scrollHeight;
        }

        if (toastMessage) {
            const t = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(t);
        }
    }, [messages, toastMessage]);

    // auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (messagesContainerRef.current) {
            // fallback: scroll container to bottom
            const el = messagesContainerRef.current;
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    const statKeys = Object.keys(statMeta) as (keyof DashboardStats)[];
    return (
        <div>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed right-4 top-4 bg-black text-white px-4 py-2 rounded shadow z-50">
                    {toastMessage}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dữ liệu đã lưu</h1>
                <p className="text-sm text-gray-400 mt-1">
                    <span>Trang chủ</span>
                    <span className="mx-1.5">›</span>
                    <span className="text-gray-500">Dữ liệu đã lưu</span>
                </p>
            </div>

            {/* Stat cards */}
            {/*<div className="grid grid-cols-5 gap-4 mb-6">*/}
            {/*    {statKeys.map((key) => {*/}
            {/*        const meta = statMeta[key];*/}
            {/*        const Icon = meta.icon;*/}
            {/*        const data = stats?.[key]; // undefined khi đang loading*/}

            {/*        return (*/}
            {/*            <div*/}
            {/*                key={key}*/}
            {/*                className="bg-white rounded-2xl border border-gray-100 p-4"*/}
            {/*            >*/}
            {/*                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${meta.color}`}>*/}
            {/*                    <Icon className="w-5 h-5"/>*/}
            {/*                </div>*/}
            {/*                <p className="text-sm text-gray-500 mb-1">{meta.label}</p>*/}

            {/*                {data ? (*/}
            {/*                    <>*/}
            {/*                        <p className="text-2xl font-bold text-gray-900">*/}
            {/*                            {data.count.toLocaleString('vi-VN')}*/}
            {/*                        </p>*/}
            {/*                        <p*/}
            {/*                            className={`text-xs mt-1 flex items-center gap-0.5 ${*/}
            {/*                                data.growthPercent >= 0 ? 'text-green-600' : 'text-red-500'*/}
            {/*                            }`}*/}
            {/*                        >*/}
            {/*                            <span>{data.growthPercent >= 0 ? '↑' : '↓'}</span>*/}
            {/*                            <span>*/}
            {/*                    {Math.abs(data.growthPercent).toFixed(1)}% so với tháng trước*/}
            {/*                </span>*/}
            {/*                        </p>*/}
            {/*                    </>*/}
            {/*                ) : (*/}
            {/*                    <>*/}
            {/*                        <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1.5"/>*/}
            {/*                        <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse"/>*/}
            {/*                    </>*/}
            {/*                )}*/}
            {/*            </div>*/}
            {/*        );*/}
            {/*    })}*/}
            {/*</div>*/}

            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, nội dung, số hợp đồng, khách hàng..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                </div>

                <FilterDropdown label="Loại" value="Tất cả"/>
                <FilterDropdown label="Trạng thái" value="Đã xử lý"/>
                <FilterDropdown label="Ngày" value="30 ngày qua"/>

                <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
                    <Filter className="w-4 h-4"/>
                    Bộ lọc
                </button>
            </div>

            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                    Tổng: <span className="font-medium text-gray-700">{documents.length} tài liệu</span>
                </p>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <FileSpreadsheet className="w-4 h-4 text-green-600"/>
                        Xuất Excel
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        <Upload className="w-4 h-4"/>
                        Tải lên
                    </button>
                </div>
            </div>

            {/* Content: table + detail panel */}
            <div className="flex items-start gap-4">
                {/* Table */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-400">
                                <th className="w-10 py-3 pl-5">
                                    <input type="checkbox" className="rounded border-gray-300"/>
                                </th>
                                <th className="py-3 pr-4 font-medium">Tên tài liệu</th>
                                <th className="py-3 pr-4 font-medium">Loại</th>
                                <th className="py-3 pr-4 font-medium">Trạng thái AI</th>
                                <th className="py-3 pr-4 font-medium">Người tải lên</th>
                                <th className="py-3 pr-4 font-medium">Ngày tải lên</th>
                                <th className="py-3 pr-4 font-medium">Kích thước</th>
                                <th className="w-10 py-3 pr-5"/>
                            </tr>
                            </thead>
                            <tbody>
                            {documents.map((doc) => {
                                const {Icon, style} = fileIconMeta(doc.extension);
                                const isSelected = doc.id === selectedId;
                                return (
                                    <tr
                                        key={doc.id}
                                        onClick={() => openRow(doc.id)}
                                        className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                                            isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="rounded border-gray-300"/>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style}`}>
                                                    <Icon className="w-4.5 h-4.5"/>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{doc.subtitle}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${typeBadgeStyle[doc.type]}`}>
                                                    {doc.type}
                                                </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            {doc.status === DocumentStatus.PROCESSED ? (
                                                <span
                                                    className="inline-flex items-center gap-1.5 text-green-600 text-sm">
                                                        <CheckCircle2 className="w-4 h-4"/>
                                                        Đã xử lý
                                                    </span>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1.5 text-orange-500 text-sm">
                                                        <AlertTriangle className="w-4 h-4"/>
                                                        Cần review
                                                    </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600">{doc.uploader.name}</td>
                                        <td className="py-3 pr-4 text-gray-600">{doc.uploadedAt}</td>
                                        <td className="py-3 pr-4 text-gray-600">{doc.sizeBytes}</td>
                                        <td className="py-3 pr-5" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <button
                            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                            Hiển thị 10 dòng
                            <ChevronDown className="w-3.5 h-3.5"/>
                        </button>

                        <div className="flex items-center gap-1">
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4"/>
                            </button>
                            {[1, 2, 3, 4, 5].map((p) => (
                                <button
                                    key={p}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                        p === 1
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                                125
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50">
                                <ChevronRight className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Detail panel — chỉ chiếm chỗ khi có tài liệu được chọn, trượt/mờ dần mượt mà */}
                <div
                    className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out ${
                        selectedDoc ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
                    }`}
                >
                    {selectedDoc && (
                        <div
                            key={selectedDoc.id}
                            className="w-[400px] bg-white rounded-2xl border border-gray-100 flex flex-col h-[calc(100vh-220px)] min-h-[560px] animate-panel-in"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                                {(() => {
                                    const {Icon, style} = fileIconMeta(selectedDoc.extension);
                                    return (
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style}`}>
                                            <Icon className="w-4.5 h-4.5"/>
                                        </div>
                                    );
                                })()}
                                <p className="font-semibold text-gray-900 truncate flex-1">{selectedDoc.name}</p>
                                <span
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${typeBadgeStyle[selectedDoc.type]}`}>
                                    {selectedDoc.type}
                                </span>
                                <button
                                    onClick={closePanel}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0"
                                >
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center px-5 border-b border-gray-100 shrink-0">
                                {(
                                    [
                                        {id: 'info', label: 'Thông tin'},
                                        {id: 'ocr', label: 'Nội dung (OCR)'},
                                        {id: 'history', label: 'Lịch sử xử lý'},
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                {activeTab === 'info' && (
                                    <>
                                        {/* AI extracted info */}
                                        <div className="mb-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                                                        <Sparkles className="w-3.5 h-3.5"/>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Thông tin trích xuất bởi AI
                                                    </p>
                                                </div>
                                                <button
                                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-100 bg-blue-50 rounded-lg px-2.5 py-1.5 hover:bg-blue-100">
                                                    <Pencil className="w-3 h-3"/>
                                                    Chỉnh sửa
                                                </button>
                                            </div>

                                            {documentDetail && (
                                                <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">

                                                    {Object.entries(documentDetail.extractedInfo)
                                                        .filter(([key]) => key !== 'state')
                                                        .map(([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-start justify-between px-3.5 py-2.5"
                                                            >
            <span className="text-sm text-gray-500">
                {CONTRACT_FIELDS[key] ?? key}
            </span>

                                                                <div className="text-sm font-medium text-gray-900 text-right">
                                                                    {Array.isArray(value) ? (
                                                                        value.length === 0 ? (
                                                                            '-'
                                                                        ) : (
                                                                            value.map((item, index) => (
                                                                                <div key={index}>
                                                                                    {typeof item === 'object'
                                                                                        ? `${item.name}: ${Number(item.amount).toLocaleString('vi-VN')} (${item.period})`
                                                                                        : item}
                                                                                </div>
                                                                            ))
                                                                        )
                                                                    ) : (
                                                                        formatValue(key, value)
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* AI summary */}
                                        <div className="mb-5 rounded-xl border border-gray-100 p-3.5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <Sparkles className="w-3.5 h-3.5"/>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800">Tóm tắt bởi AI</p>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {documentDetail?.aiSummary}
                                            </p>
                                            <button className="text-sm font-medium text-blue-600 mt-2 hover:underline">
                                                Xem chi tiết →
                                            </button>
                                        </div>

                                        {/* Chat */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div
                                                    className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <MessageSquareText className="w-3.5 h-3.5"/>
                                                </div>

                                                    <p className="text-sm font-semibold text-gray-800">Chat với tài liệu này</p>

                                                    {/* persona selector */}
                                                    <div className="ml-3">
                                                        <select
                                                            value={persona ?? 'default'}
                                                            onChange={(e) => setPersona(e.target.value)}
                                                            className="text-xs border rounded px-2 py-1 ml-2"
                                                        >
                                                            <option value="default">Mặc định</option>
                                                            <option value="legal">Trợ lý pháp lý</option>
                                                            <option value="sales">Trợ lý sales</option>
                                                            <option value="technical">Trợ lý kỹ thuật</option>
                                                        </select>
                                                    </div>

                                                </div>
                                                                    <div className="space-y-3" ref={messagesContainerRef}>
                                                {messages.map((m, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex ${m.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] ${m.role === MessageRole.USER ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                            <div
                                                                className={`rounded-2xl px-3.5 py-2 text-sm ${
                                                                    m.role === MessageRole.USER
                                                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                                                        : 'bg-gray-50 text-gray-700 rounded-bl-sm'
                                                                }`}
                                                            >
                                                                {m.content}
                                                            </div>
                                                                                                {m.sources && m.sources.length > 0 && (
                                                                                                    <div className="flex flex-col gap-1 mt-1">
                                                                                                        {m.sources.map((s, idx) => (
                                                                                                            <button
                                                                                                                key={idx}
                                                                                                                onClick={() => {
                                                                                                                    // open document detail and highlight snippet
                                                                                                                    if (s.documentId) {
                                                                                                                        setSelectedId(s.documentId);
                                                                                                                    }
                                                                                                                    setActiveTab('ocr');
                                                                                                                    setHighlightedSnippet(s.content ?? null);
                                                                                                                }}
                                                                                                                className="text-xs text-gray-500 hover:text-blue-600 text-left underline"
                                                                                                            >
                                                                                                                {s.documentId ? `Tài liệu #${s.documentId}` : 'Tài liệu không rõ'} — {s.content ? s.content.substring(0,100) : '— trích đoạn không có'}
                                                                                                            </button>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                                {m.source && !m.sources && (
                                                                                                    <p className="text-xs text-gray-400 px-1 whitespace-pre-line">{m.source}</p>
                                                                                                )}
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <p className="text-[11px] text-gray-300 px-1">{m.time}</p>
                                                                                                    {m.role === MessageRole.AL && (
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                // prefill follow-up question with a short excerpt of the assistant answer
                                                                                                                const excerpt = m.content ? m.content.substring(0,120) : '';
                                                                                                                const follow = excerpt ? `Bạn có thể giải thích thêm về: "${excerpt}"?` : 'Bạn có thể giải thích thêm?';
                                                                                                                setChatInput(follow);
                                                                                                                // focus input
                                                                                                                const inputEl = document.querySelector('input[placeholder="Nhập câu hỏi về tài liệu..."]') as HTMLInputElement | null;
                                                                                                                inputEl?.focus();
                                                                                                            }}
                                                                                                            className="text-xs text-blue-600 hover:underline"
                                                                                                        >
                                                                                                            Hỏi tiếp
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    <div ref={messagesEndRef} />
                                                                                </div>
                                        </div>
                                    </>
                                )}

                                {(activeTab === 'ocr' && documentDetail) && (
                                    <div className="py-3">
                                        {highlightedSnippet && (
                                            <div className="mb-3 p-3 rounded-md bg-yellow-50 border border-yellow-100">
                                                <div className="text-sm text-gray-700 font-medium mb-1">Trích dẫn</div>
                                                <div className="text-sm text-gray-600 whitespace-pre-line">{highlightedSnippet}</div>
                                                <div className="mt-2 flex gap-2">
                                                    <button className="text-xs text-blue-600 hover:underline" onClick={()=>{
                                                        // clear highlight
                                                        setHighlightedSnippet(null);
                                                    }}>Bỏ đánh dấu</button>
                                                    <button className="text-xs text-gray-600 hover:underline" onClick={()=>{
                                                        // scroll OCR area to top
                                                        const ocrEl = document.querySelector('[data-ocr]') as HTMLDivElement | null;
                                                        ocrEl?.scrollIntoView({behavior:'smooth', block:'start'});
                                                    }}>Mở vị trí trong tài liệu</button>
                                                </div>
                                            </div>
                                        )}

                                        <div data-ocr className="text-sm text-gray-700 whitespace-pre-line">
                                            {documentDetail.ocrText}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div
                                        className="text-sm text-gray-400 flex items-center justify-center h-full py-16">
                                    Chưa có lịch sử xử lý.
                                    </div>
                                )}
                            </div>

                            {/* Chat input */}
                            {activeTab === 'info' && (
                                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
                                        <Paperclip className="w-4 h-4"/>
                                    </button>
                                    <input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        type="text"
                                        placeholder="Nhập câu hỏi về tài liệu..."
                                        className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={loadingReply}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loadingReply ? (
                                            <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                                            </svg>
                                        ) : (
                                            <Send className="w-3.5 h-3.5"/>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */

/* ------------------------------------------------------------------ */

function FilterDropdown({label, value}: { label: string; value: string }) {
    return (
        <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap">
            <span className="text-gray-400">{label}:</span>
            <span className="font-medium text-gray-700">{value}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>
        </button>
    );
}

function nowLabel() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}