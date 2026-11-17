'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Sparkles,
    Workflow,
    Folder,
    FileText,
    FileSpreadsheet,
    FileCode,
    Presentation,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Plus,
    X,
    Check,
    Info,
    ArrowUp,
    BookmarkPlus,
    CornerDownRight,
    Copy,
    MoreVertical,
    RefreshCw,
    FolderInput,
    ExternalLink,
    Paperclip,
    Menu,
    ArrowLeft,
    Clock,
    Database,
    Layers,
    SlidersHorizontal,
    Share2,
    CheckCircle2,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import forderService from '@/services/forder/forderService';
import chatService, { ChatAskRequest, ChatMessageDto } from '@/services/chat/chatService';
import { useSidebar } from '@/lib/sidebar-context';
import OnlyOfficeEditorModal from '@/components/files/OnlyOfficeEditorModal';

export interface SourceItem {
    id: string | number;
    name: string;
    type: 'folder' | 'file' | 'drive';
    fileType?: string;
    checked: boolean;
    folderId?: number | null;
}

export interface ChatHistorySession {
    id: string;
    title: string;
    createdAt: string;
    timestamp: number;
    sourceSummary: string;
    messages: ChatMessageDto[];
    messageCount?: number;
}

function formatSessionTimestamp(timestamp?: number | string | Date): string {
    if (!timestamp) return 'Gần đây';

    let date: Date;
    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        const parsedMs = Date.parse(timestamp);
        if (!isNaN(parsedMs)) {
            date = new Date(parsedMs);
        } else {
            const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                const now = new Date();
                date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10));
            } else {
                return timestamp;
            }
        }
    }

    if (isNaN(date.getTime())) return 'Gần đây';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - sessionDay.getTime()) / (24 * 60 * 60 * 1000));

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (diffDays === 0) {
        return `Hôm nay, ${hours}:${minutes}`;
    } else if (diffDays === 1) {
        return `Hôm qua, ${hours}:${minutes}`;
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước, ${hours}:${minutes}`;
    } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    }
}

const formatSessionDate = formatSessionTimestamp;

function formatMarkdownContent(raw: string): string {
    if (!raw) return '';
    let formatted = raw.replace(/([^\n])\n(\s*[\*\-\+]\s+)/g, '$1\n\n$2');
    formatted = formatted.replace(/([^\n])\n(\s*\d+\.\s+)/g, '$1\n\n$2');
    return formatted;
}

function GeminiDiamondIcon({ className = 'w-4 h-4 text-gray-500' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
        </svg>
    );
}

const DEFAULT_SAMPLE_SESSIONS: ChatHistorySession[] = [];

function DriveAiContent() {
    usePageBreadcrumb(['Drive', 'Hỏi Gemini']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isOpen, setIsOpen } = useSidebar();
    const initialSidebarStateRef = useRef(isOpen);

    // Auto-collapse sidebar to mini rail when entering Google Drive AI assistant
    useEffect(() => {
        setIsOpen(false);
        return () => {
            if (initialSidebarStateRef.current) {
                setIsOpen(true);
            }
        };
    }, [setIsOpen]);

    // Query parameters
    const paramFolderId = searchParams.get('folderId');
    const paramFolderName = searchParams.get('folderName');
    const paramFileId = searchParams.get('fileId');
    const paramFileName = searchParams.get('fileName');

    // Tab state: 'sources' | 'log'
    const [activeTab, setActiveTab] = useState<'sources' | 'log'>('sources');

    // Sources state
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [suggestedFiles, setSuggestedFiles] = useState<FileItemDto[]>([]);
    const [allFiles, setAllFiles] = useState<FileItemDto[]>([]);
    const [allFolders, setAllFolders] = useState<any[]>([]);
    const [isSuggestedOpen, setIsSuggestedOpen] = useState(true);
    const [showAddSourceModal, setShowAddSourceModal] = useState(false);

    // Preview file state
    const [previewFile, setPreviewFile] = useState<{ id: string | number; name: string; fileType?: string } | null>(null);

    // AI Overview & Chat states
    const [executionMode, setExecutionMode] = useState<'AGENTIC_WORKFLOW' | 'STANDARD_RAG'>('AGENTIC_WORKFLOW');
    const [overviewSummary, setOverviewSummary] = useState<string>('');
    const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);
    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [inputPrompt, setInputPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [sessionId, setSessionId] = useState<string | number>(() => `session_${Date.now()}`);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Global Chat History Sessions (Tổng hợp toàn bộ nhật ký)
    const [chatSessions, setChatSessions] = useState<ChatHistorySession[]>([]);

    // Chat scroll ref
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastOverviewKeyRef = useRef<string>('');

    // Load global chat history sessions on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const apiSessions = await chatService.listSessions().catch(() => []);
                if (Array.isArray(apiSessions) && apiSessions.length > 0) {
                    const mapped: ChatHistorySession[] = apiSessions.map((s) => ({
                        id: s.sessionId.toString(),
                        title: s.title || 'Cuộc trò chuyện',
                        createdAt: s.createdAt || new Date().toISOString(),
                        timestamp: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
                        sourceSummary: s.documentName || 'Toàn bộ Drive',
                        messages: [],
                        messageCount: s.messageCount || 0,
                    }));
                    setChatSessions(mapped);
                    return;
                }
                const saved = localStorage.getItem('gemini_drive_chat_sessions_v2');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const valid = parsed.filter((p: any) => !p.id?.toString().startsWith('sample_session_'));
                        if (valid.length > 0) {
                            setChatSessions(valid);
                            return;
                        }
                    }
                }
                setChatSessions([]);
            } catch (e) {
                console.warn('Failed to load chat history:', e);
                setChatSessions([]);
            }
        };
        fetchHistory();
    }, []);

    // Initialize sources from query parameters or default to 'Toàn bộ Drive'
    useEffect(() => {
        const initialSources: SourceItem[] = [];

        if (paramFolderId || paramFolderName) {
            initialSources.push({
                id: paramFolderId || 'folder-selected',
                name: paramFolderName || 'Thư mục đã chọn',
                type: 'folder',
                checked: true,
                folderId: paramFolderId ? Number(paramFolderId) : null,
            });
        } else if (paramFileId || paramFileName) {
            initialSources.push({
                id: paramFileId || 'file-selected',
                name: paramFileName || 'Tài liệu đã chọn',
                type: 'file',
                fileType: paramFileName?.split('.').pop() || 'pdf',
                checked: true,
            });
        } else {
            // Mặc định vào thẳng menu (không qua 3 chấm): nguồn là TOÀN BỘ DRIVE
            initialSources.push({
                id: 'all',
                name: 'Toàn bộ Drive',
                type: 'drive',
                checked: true,
            });
        }

        setSources(initialSources);
    }, [paramFolderId, paramFolderName, paramFileId, paramFileName]);

    // Load files and folders from backend
    useEffect(() => {
        const loadDriveData = async () => {
            try {
                const [filesData, treeData] = await Promise.all([
                    fileManagementService.getActiveFiles().catch(() => []),
                    forderService.getFolderTree().catch(() => []),
                ]);
                setAllFiles(filesData);
                setAllFolders(treeData);

                // Đề xuất các file thực tế từ kho dữ liệu doanh nghiệp của người dùng
                if (Array.isArray(filesData) && filesData.length > 0) {
                    let candidates: FileItemDto[] = [];
                    if (paramFolderId) {
                        candidates = filesData.filter((f) => f.folderId?.toString() === paramFolderId.toString());
                    } else if (paramFileId) {
                        candidates = filesData.filter((f) => f.id?.toString() !== paramFileId.toString());
                    }
                    if (candidates.length === 0) {
                        candidates = [...filesData];
                    }
                    setSuggestedFiles(candidates);
                } else {
                    setSuggestedFiles([]);
                }
            } catch (err) {
                console.warn('Failed to load drive data in AI assistant:', err);
            }
        };

        loadDriveData();
    }, [paramFolderName]);

    // Generate intelligent AI Overview for the selected source(s)
    useEffect(() => {
        if (!sources || sources.length === 0) return;
        const activeSources = sources.filter((s) => s.checked);
        if (activeSources.length === 0) return;

        let isCurrent = true;
        const hasDrive = activeSources.some((s) => s.type === 'drive' || s.id === 'all');
        const sourceName = activeSources.map((s) => s.name).join(', ') || 'Toàn bộ Drive';

        const fileSource = activeSources.find((s) => s.type === 'file');
        const folderSource = activeSources.find((s) => s.type === 'folder');

        const req: any = {
            sourceName: hasDrive ? 'Toàn bộ Drive' : sourceName,
        };
        if (!hasDrive) {
            if (fileSource) req.fileId = fileSource.id;
            if (folderSource) req.folderId = folderSource.id;
        }

        const sourceKey = `${req.sourceName}_${req.fileId || ''}_${req.folderId || ''}`;
        if (lastOverviewKeyRef.current === sourceKey && overviewSummary) {
            return;
        }
        lastOverviewKeyRef.current = sourceKey;

        const fetchAiOverview = async () => {
            setIsLoadingOverview(true);
            try {
                const res = await chatService.getOverview(req);
                if (!isCurrent) return;
                setOverviewSummary(res.summary);
                setSuggestedPrompts(
                    res.suggestedQuestions && res.suggestedQuestions.length > 0
                        ? res.suggestedQuestions
                        : [
                              `Tóm tắt những điểm trọng tâm nhất trong ${req.sourceName}.`,
                              `Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.`,
                              `Đưa ra các câu hỏi thường gặp liên quan đến tài liệu này.`,
                          ]
                );
            } catch (err) {
                console.warn('Failed to fetch real AI overview:', err);
                if (!isCurrent) return;
                setOverviewSummary(
                    `Nguồn được chọn bao gồm các tài liệu thuộc mục "${req.sourceName}". Hệ thống đã kết nối và sẵn sàng hỗ trợ bạn tra cứu, tóm tắt chi tiết hoặc trích xuất số liệu quan trọng.`
                );
                setSuggestedPrompts([
                    `Tóm tắt những điểm trọng tâm nhất trong ${req.sourceName}.`,
                    `Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.`,
                    `Đưa ra các câu hỏi thường gặp liên quan đến tài liệu này.`,
                ]);
            } finally {
                if (isCurrent) setIsLoadingOverview(false);
            }
        };

        fetchAiOverview();

        return () => {
            isCurrent = false;
        };
    }, [sources]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    // Toggle source checked status
    const handleToggleSource = (id: string | number) => {
        setSources((prev) =>
            prev.map((s) => (s.id.toString() === id.toString() ? { ...s, checked: !s.checked } : s))
        );
    };

    // Add suggested file to active sources
    const handleAddSuggestedSource = (file: FileItemDto) => {
        const fileIdStr = file.id.toString();
        if (sources.some((s) => s.id.toString() === fileIdStr)) {
            toast('Nguồn này đã có trong danh sách của bạn');
            return;
        }

        const newSource: SourceItem = {
            id: file.id,
            name: file.name,
            type: 'file',
            fileType: file.fileType || 'pdf',
            checked: true,
            folderId: file.folderId,
        };

        setSources((prev) => [...prev, newSource]);
        setSuggestedFiles((prev) => prev.filter((f) => f.id.toString() !== fileIdStr));
        toast.success(`Đã thêm "${file.name}" vào nguồn`);
    };

    // Remove source
    const handleRemoveSource = (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSources((prev) => prev.filter((s) => s.id.toString() !== id.toString()));
    };

    // Save conversation to global history
    const saveConversationToHistory = (queryText: string, updatedMsgs: ChatMessageDto[], targetSessionId?: string | number) => {
        const activeSources = sources.filter((s) => s.checked);
        const sourceSummary = activeSources.map((s) => s.name).join(', ') || 'Toàn bộ Drive';

        setChatSessions((prevSessions) => {
            const currentSid = (targetSessionId || sessionId).toString();
            // Tìm session theo ID mới hoặc ID tạm thời cũ
            const existingIndex = prevSessions.findIndex(
                (s) => s.id === currentSid || (sessionId && s.id === sessionId.toString())
            );
            let nextSessions: ChatHistorySession[];

            if (existingIndex >= 0) {
                nextSessions = [...prevSessions];
                nextSessions[existingIndex] = {
                    ...nextSessions[existingIndex],
                    id: currentSid,
                    messages: updatedMsgs,
                    timestamp: Date.now(),
                    createdAt: formatSessionDate(new Date()),
                    sourceSummary: sourceSummary,
                };
            } else {
                const newSession: ChatHistorySession = {
                    id: currentSid,
                    title: queryText.length > 55 ? queryText.substring(0, 55) + '...' : queryText,
                    createdAt: formatSessionDate(new Date()),
                    timestamp: Date.now(),
                    sourceSummary: sourceSummary,
                    messages: updatedMsgs,
                };
                nextSessions = [newSession, ...prevSessions];
            }

            try {
                localStorage.setItem('gemini_drive_chat_sessions_v2', JSON.stringify(nextSessions));
            } catch (err) {
                console.warn('Failed to save chat sessions to localStorage:', err);
            }
            return nextSessions;
        });
    };

    // Start a new chat session
    const handleStartNewChat = () => {
        const newId = `session_${Date.now()}`;
        setSessionId(newId);
        setMessages([]);
        setInputPrompt('');
        toast.success('Đã bắt đầu cuộc trò chuyện mới');
    };

    // Load an existing session from history
    const handleSelectHistorySession = async (session: ChatHistorySession) => {
        setSessionId(session.id);
        if (session.messages && session.messages.length > 0) {
            setMessages(session.messages);
        } else {
            setMessages([]);
        }

        try {
            const detail = await chatService.getChatSession(session.id);
            if (detail && Array.isArray(detail.messages)) {
                const mapped: ChatMessageDto[] = detail.messages.map((m: any) => ({
                    id: m.id,
                    role: (m.role ? m.role.toUpperCase() : 'USER') as any,
                    content: m.content || '',
                }));
                setMessages(mapped);
                setChatSessions((prev) =>
                    prev.map((s) => (s.id === session.id ? { ...s, messages: mapped, messageCount: mapped.length } : s))
                );
            }
        } catch (err) {
            console.warn('Failed to load session messages from API:', err);
        }
    };

    // Delete a session from history
    const handleDeleteHistorySession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatSessions((prev) => {
            const filtered = prev.filter((s) => s.id !== id);
            try {
                localStorage.setItem('gemini_drive_chat_sessions_v2', JSON.stringify(filtered));
            } catch (err) {
                console.warn(err);
            }
            return filtered;
        });
        if (sessionId.toString() === id) {
            setSessionId(`session_${Date.now()}`);
            setMessages([]);
        }
        toast.success('Đã xóa phiên khỏi nhật ký');
    };

    // Clear all history
    const handleClearAllHistory = () => {
        if (typeof window !== 'undefined' && window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký hỏi đáp?')) {
            setChatSessions([]);
            try {
                localStorage.removeItem('gemini_drive_chat_sessions_v2');
            } catch (e) {
                console.warn(e);
            }
            setSessionId(`session_${Date.now()}`);
            setMessages([]);
            toast.success('Đã xóa toàn bộ nhật ký hỏi đáp');
        }
    };

    // Ask AI
    const handleSendPrompt = async (promptText?: string) => {
        const query = (promptText || inputPrompt).trim();
        if (!query || isGenerating) return;

        setInputPrompt('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const userMsg: ChatMessageDto = {
            role: 'USER',
            content: query,
        };

        const currentMessagesWithUser = [...messages, userMsg];
        setMessages(currentMessagesWithUser);
        setIsGenerating(true);

        const activeSources = sources.filter((s) => s.checked);
        const hasDriveScope = activeSources.some((s) => s.type === 'drive' || s.id === 'all');
        const activeFileId = hasDriveScope ? undefined : activeSources.find((s) => s.type === 'file')?.id;
        const activeFolderSource = hasDriveScope ? undefined : activeSources.find((s) => s.type === 'folder');
        const activeFolderId = activeFolderSource ? (activeFolderSource.folderId || activeFolderSource.id) : undefined;

        try {
            // Nạp toàn bộ lịch sử hội thoại trước câu hỏi hiện tại
            const historyPayload = messages.map((m) => ({
                role: m.role.toUpperCase(),
                content: m.content,
            }));

            const askReq: ChatAskRequest = {
                sessionId: sessionId,
                fileId: activeFileId,
                folderId: activeFolderId,
                question: query,
                mode: executionMode,
                modelProvider: 'gemini',
                history: historyPayload,
            };

            const res = await chatService.ask(askReq);

            // Cập nhật lại sessionId từ Backend để các câu hỏi tiếp theo kế thừa phiên trò chuyện này
            const returnedSessionId = (res as any).id || (res.sessionId ? res.sessionId.toString() : null);
            if (returnedSessionId && returnedSessionId !== sessionId.toString()) {
                setSessionId(returnedSessionId);
            }

            const aiMsg: ChatMessageDto = {
                role: 'ASSISTANT',
                content: res.answer || 'Xin lỗi, tôi không thể xử lý câu trả lời lúc này.',
            };
            const finalMsgs = [...currentMessagesWithUser, aiMsg];
            setMessages(finalMsgs);
            saveConversationToHistory(query, finalMsgs, returnedSessionId || sessionId);
        } catch (err: any) {
            console.error('Backend chat API failed:', err);
            const status = err?.response?.status;
            let displayMessage = err?.response?.data?.message || err?.message;

            if (status === 403 || (displayMessage && displayMessage.toLowerCase().includes('quyền'))) {
                displayMessage = '⚠️ **Từ chối truy cập (403 Forbidden):** Bạn không có quyền truy cập hoặc tra cứu nội dung từ tài liệu này qua AI.';
            } else if (!displayMessage) {
                displayMessage = '⚠️ **Lỗi kết nối:** Không thể kết nối với máy chủ AI. Vui lòng kiểm tra lại dịch vụ Backend hoặc thử lại sau.';
            } else {
                displayMessage = `⚠️ **Lỗi:** ${displayMessage}`;
            }

            const aiMsg: ChatMessageDto = {
                role: 'ASSISTANT',
                content: displayMessage,
            };
            const finalMsgs = [...currentMessagesWithUser, aiMsg];
            setMessages(finalMsgs);
            saveConversationToHistory(query, finalMsgs);
        } finally {
            setIsGenerating(false);
        }
    };

    // Copy message content
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Đã sao chép nội dung');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const activeSourcesCount = sources.filter((s) => s.checked).length;

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] bg-[#f8fafd] dark:bg-slate-950 overflow-hidden font-sans select-none">
            {/* ── TOP HEADER BAR (Exact match to Google Drive AI Assistant) ── */}
            <div className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/home')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-slate-300 transition cursor-pointer"
                        title="Quay lại Drive"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-800 dark:text-slate-100">
                            Hỏi Gemini
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Close 'X' button */}
                    <button
                        type="button"
                        onClick={() => router.push('/home')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 transition cursor-pointer"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── MAIN 2-COLUMN LAYOUT ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* ── LEFT PANEL: NGUỒN CỦA BẠN (1) & NHẬT KÝ ── */}
                <div className="w-80 md:w-84 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto">
                    {/* Tabs header */}
                    <div className="flex items-center border-b border-gray-200 dark:border-slate-800 px-4 pt-3 gap-6 text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('sources')}
                            className={`pb-2.5 font-medium transition relative cursor-pointer ${
                                activeTab === 'sources'
                                    ? 'text-[#0b57d0] dark:text-blue-400 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                            }`}
                        >
                            <span>Nguồn của bạn ({activeSourcesCount})</span>
                            {activeTab === 'sources' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b57d0] dark:bg-blue-400 rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('log')}
                            className={`pb-2.5 font-medium transition relative cursor-pointer ${
                                activeTab === 'log'
                                    ? 'text-[#0b57d0] dark:text-blue-400 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                            }`}
                        >
                            <span>Nhật ký</span>
                            {activeTab === 'log' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b57d0] dark:bg-blue-400 rounded-full" />
                            )}
                        </button>
                    </div>

                    {activeTab === 'sources' ? (
                        <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                            <div>
                                {/* Action row: [Thêm ▾] button and (i) info icon */}
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSourceModal(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c2e7ff] hover:bg-[#b3ddfc] text-[#001d35] dark:bg-blue-950 dark:text-blue-200 text-xs font-medium rounded-full transition cursor-pointer"
                                    >
                                        <span>Thêm</span>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>

                                    <div
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
                                        title="Gemini sẽ chỉ sử dụng các nguồn được đánh dấu chọn để phân tích và trả lời"
                                    >
                                        <Info className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Active sources list */}
                                <div className="space-y-1.5">
                                    {sources.map((s) => (
                                        <div
                                            key={s.id}
                                            onClick={() => handleToggleSource(s.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer group ${
                                                s.checked
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/30 text-gray-800 dark:text-slate-100 font-medium'
                                                    : 'hover:bg-gray-100 dark:hover:bg-slate-800/60 text-gray-500 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={s.checked}
                                                    onChange={() => handleToggleSource(s.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#0b57d0]"
                                                />
                                                {s.type === 'drive' ? (
                                                    <div className="w-4 h-4 rounded bg-[#0b57d0] text-white flex items-center justify-center font-bold text-[8px] shrink-0" title="Toàn bộ Drive">
                                                        ▲
                                                    </div>
                                                ) : s.type === 'folder' ? (
                                                    <Folder className="w-4 h-4 text-blue-600 fill-blue-500/20 shrink-0" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                )}
                                                <span className="truncate">{s.name}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => handleRemoveSource(s.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-gray-600 transition"
                                                title="Bỏ nguồn"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* ── TAB NHẬT KÝ HỎI ĐÁP TỔNG THỂ (ALL CHAT HISTORY) ── */
                        <div className="p-3.5 flex-1 flex flex-col overflow-y-auto">
                            {/* Action: Cuộc trò chuyện mới */}
                            <button
                                type="button"
                                onClick={handleStartNewChat}
                                className="w-full mb-3 px-3 py-2 bg-[#f0f4f9] hover:bg-[#e0e8f6] dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-gray-200/80 dark:border-slate-700 text-[#0b57d0] dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Cuộc trò chuyện mới</span>
                            </button>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-2 px-1">
                                <span className="font-medium">Nhật ký hỏi đáp ({chatSessions.length})</span>
                                {chatSessions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllHistory}
                                        className="text-[11px] text-gray-400 hover:text-red-500 transition cursor-pointer"
                                        title="Xóa toàn bộ nhật ký"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            {chatSessions.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                    <Clock className="w-8 h-8 mb-2 stroke-1 text-gray-300 dark:text-slate-600" />
                                    <p className="text-xs font-medium text-gray-600 dark:text-slate-300">Chưa có nhật ký</p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Các câu hỏi bạn đặt ra cho Gemini sẽ được lưu lại tại đây.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 overflow-y-auto">
                                    {chatSessions.map((session) => {
                                        const isCurrent = session.id === sessionId.toString();
                                        const displayTime = formatSessionTimestamp(session.timestamp || session.createdAt);
                                        return (
                                            <div
                                                key={session.id}
                                                onClick={() => handleSelectHistorySession(session)}
                                                className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer group ${
                                                    isCurrent
                                                        ? 'bg-[#f0f4f9] dark:bg-slate-800/90 border-gray-300 dark:border-slate-600'
                                                        : 'bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/50 border-gray-200/90 dark:border-slate-800'
                                                }`}
                                            >
                                                {/* Top Row: Time & Delete */}
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1.5">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{displayTime}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteHistorySession(session.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 rounded-lg text-gray-400 transition-colors cursor-pointer"
                                                        title="Xóa phiên này"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Title - Đơn giản, không màu mè, không in đậm */}
                                                <p className="text-[12.5px] leading-snug line-clamp-2 text-gray-800 dark:text-slate-200 font-normal">
                                                    {session.title}
                                                </p>

                                                {/* Bottom Badges */}
                                                <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-700/60">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700/70 text-[10.5px] text-gray-600 dark:text-slate-300 font-medium truncate max-w-[160px]">
                                                        {session.sourceSummary.includes('Toàn bộ Drive') ? (
                                                            <span className="text-[#0b57d0] font-bold text-[9px]">▲</span>
                                                        ) : session.sourceSummary.includes('cv') || session.sourceSummary.toLowerCase().includes('thư mục') || allFolders.some(f => f.name.toLowerCase() === session.sourceSummary.toLowerCase()) || !session.sourceSummary.includes('.') ? (
                                                            <Folder className="w-3 h-3 text-blue-500 shrink-0" />
                                                        ) : (
                                                            <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                                                        )}
                                                        <span className="truncate">{session.sourceSummary}</span>
                                                    </div>

                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-slate-400 shrink-0">
                                                        {typeof session.messageCount === 'number'
                                                            ? `${session.messageCount} tin`
                                                            : `${session.messages?.length || 0} tin`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT / CENTER PANEL: AI OVERVIEW & CONVERSATION ── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 relative">
                    {/* Scrollable conversation / overview area - scrollbar on outer full width */}
                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
                        {/* 1. THÔNG TIN TỔNG QUAN DO AI TẠO (Card matching screenshot) */}
                        <div className="bg-[#f0f4f9] dark:bg-slate-800/60 rounded-3xl p-6 border border-gray-200/60 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <GeminiDiamondIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                                    <h2 className="text-[13.5px] font-medium text-gray-700 dark:text-slate-200">
                                        Thông tin tổng quan do AI tạo
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCopy(overviewSummary, 999)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 transition cursor-pointer"
                                    title="Sao chép"
                                >
                                    {copiedIndex === 999 ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>

                            {isLoadingOverview ? (
                                <div className="space-y-2.5 animate-pulse pt-1">
                                    <div className="h-3.5 bg-gray-200/90 dark:bg-slate-700/80 rounded-md w-full"></div>
                                    <div className="h-3.5 bg-gray-200/90 dark:bg-slate-700/80 rounded-md w-11/12"></div>
                                    <div className="h-3.5 bg-gray-200/90 dark:bg-slate-700/80 rounded-md w-4/5"></div>
                                </div>
                            ) : (
                                <p className="text-[13px] text-gray-700 dark:text-slate-200 leading-relaxed font-normal">
                                    {overviewSummary}
                                </p>
                            )}
                        </div>

                        {/* 2. SUGGESTED ACTION QUESTIONS (with curved arrow ↳) */}
                        {messages.length === 0 && suggestedPrompts.length > 0 && (
                            <div className="space-y-2 pt-2">
                                {suggestedPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendPrompt(prompt)}
                                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-900 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/80 border border-gray-200/80 dark:border-slate-800 rounded-2xl text-[13px] text-gray-800 dark:text-slate-200 transition text-left cursor-pointer group shadow-2xs"
                                    >
                                        <CornerDownRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition shrink-0" />
                                        <span className="flex-1 font-normal">{prompt}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 3. CONVERSATION MESSAGES STREAM */}
                        {messages.length > 0 && (
                            <div className="space-y-5 pt-4">
                                {messages.map((msg, index) => {
                                    const isUser = msg.role === 'USER' || msg.role === 'user';
                                    return (
                                        <div
                                            key={index}
                                            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isUser && (
                                                <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-4 sm:mt-5">
                                                    <GeminiDiamondIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}

                                            <div
                                                className={`select-text ${
                                                    isUser
                                                        ? 'bg-[#f0f4f9] dark:bg-slate-800 text-[#1f1f1f] dark:text-slate-100 rounded-[20px] px-5 py-3.5 text-[14px] leading-relaxed max-w-[85%] font-normal'
                                                        : 'w-full max-w-[85%] bg-[#f8fafd] dark:bg-slate-800/85 border border-gray-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-[13.5px] leading-relaxed shadow-xs text-gray-800 dark:text-slate-100'
                                                }`}
                                            >
                                                {isUser ? (
                                                    msg.content
                                                ) : (
                                                    <div className="ai-markdown-content font-sans">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                a: ({ node, href, children, ...props }: any) => {
                                                                    const isFileLink = href && (href.includes('fileId=') || href.startsWith('/files'));
                                                                    const fileIdMatch = href ? href.match(/fileId=(\d+)/) : null;
                                                                    const fileId = fileIdMatch ? fileIdMatch[1] : null;

                                                                    if (isFileLink && fileId) {
                                                                        const rawName = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : 'Tài liệu');
                                                                        const fileName = rawName.replace(/^[📄\s]+/, '').trim();
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1 mx-1 my-0.5 align-middle">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        const ext = fileName.split('.').pop() || 'docx';
                                                                                        setPreviewFile({
                                                                                            id: fileId,
                                                                                            name: fileName,
                                                                                            fileType: ext,
                                                                                        });
                                                                                    }}
                                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#0b57d0] dark:text-[#a8c7fa] font-medium text-[13px] border border-blue-200/80 dark:border-blue-800/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
                                                                                    title={`Nhấp để mở tài liệu "${fileName}"`}
                                                                                >
                                                                                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                                                                                    <span className="font-semibold underline underline-offset-2 truncate max-w-[280px]">
                                                                                        {fileName}
                                                                                    </span>
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        router.push(`/files?fileId=${fileId}&fileName=${encodeURIComponent(fileName)}`);
                                                                                    }}
                                                                                    className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                                                                    title="Chuyển đến vị trí tệp trong Drive"
                                                                                >
                                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <a
                                                                            href={href}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-[#0b57d0] dark:text-[#a8c7fa] hover:underline font-medium inline-flex items-center gap-1"
                                                                            {...props}
                                                                        >
                                                                            {children}
                                                                        </a>
                                                                    );
                                                                },
                                                                p: ({ node, ...props }) => (
                                                                    <p className="my-2 leading-relaxed text-gray-800 dark:text-slate-100 text-[13.5px]" {...props} />
                                                                ),
                                                                strong: ({ node, ...props }) => (
                                                                    <strong className="font-medium text-gray-800 dark:text-slate-100" {...props} />
                                                                ),
                                                                ul: ({ node, ...props }) => (
                                                                    <ul className="my-2.5 ml-4 list-disc space-y-1.5 text-[13.5px] marker:text-gray-400" {...props} />
                                                                ),
                                                                ol: ({ node, ...props }) => (
                                                                    <ol className="my-2.5 ml-4 list-decimal space-y-1.5 text-[13.5px] marker:text-gray-500 font-normal" {...props} />
                                                                ),
                                                                li: ({ node, ...props }) => (
                                                                    <li className="leading-relaxed pl-1" {...props} />
                                                                ),
                                                                h1: ({ node, ...props }) => (
                                                                    <h1 className="text-base font-medium text-gray-800 dark:text-white mt-4 mb-2 pb-1 border-b border-gray-100 dark:border-slate-800" {...props} />
                                                                ),
                                                                h2: ({ node, ...props }) => (
                                                                    <h2 className="text-[14px] font-medium text-gray-800 dark:text-white mt-3.5 mb-1.5" {...props} />
                                                                ),
                                                                h3: ({ node, ...props }) => (
                                                                    <h3 className="text-[13.5px] font-medium text-gray-800 dark:text-white mt-2.5 mb-1" {...props} />
                                                                ),
                                                                blockquote: ({ node, ...props }) => (
                                                                    <blockquote className="my-2.5 pl-3 py-1.5 border-l-3 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-gray-700 dark:text-slate-300 italic text-[13px] rounded-r-lg" {...props} />
                                                                ),
                                                                pre: ({ node, ...props }) => (
                                                                    <div className="my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-x-auto shadow-inner">
                                                                        <pre className="overflow-x-auto" {...props} />
                                                                    </div>
                                                                ),
                                                                code: ({ node, className, children, ...props }: any) => {
                                                                    const isCodeBlock = /language-(\w+)/.test(className || '') || (typeof children === 'string' && children.includes('\n'));
                                                                    if (isCodeBlock) {
                                                                        return (
                                                                            <code className={className} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[12px] border border-gray-200/70 dark:border-slate-700/70" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                },
                                                                table: ({ node, ...props }) => (
                                                                    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                                                                        <table className="w-full text-left text-xs border-collapse" {...props} />
                                                                    </div>
                                                                ),
                                                                th: ({ node, ...props }) => (
                                                                    <th className="bg-gray-100 dark:bg-slate-800 p-2 font-semibold text-gray-700 dark:text-slate-200 border-b border-gray-200 dark:border-slate-700" {...props} />
                                                                ),
                                                                td: ({ node, ...props }) => (
                                                                    <td className="p-2 border-b border-gray-100 dark:border-slate-800/60" {...props} />
                                                                ),
                                                            }}
                                                        >
                                                            {formatMarkdownContent(msg.content)}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* Action buttons for AI messages */}
                                                {!isUser && (
                                                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-200/60 dark:border-slate-700/60 text-gray-400">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(msg.content, index)}
                                                            className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg transition"
                                                            title="Sao chép nội dung"
                                                        >
                                                            {copiedIndex === index ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>

                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isGenerating && (
                                    <div className="flex items-center gap-3 pt-3 pl-1 animate-in fade-in duration-200">
                                        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                                            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            <GeminiDiamondIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* ── FLOATING BOTTOM INPUT BOX ── */}
                    <div className="p-4 bg-transparent shrink-0">
                        <div className="max-w-3xl mx-auto w-full">
                            <div className="bg-[#f0f4f9] dark:bg-slate-800/90 rounded-3xl p-2.5 border border-gray-200 dark:border-slate-700/80 shadow-xs focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-md transition">
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={inputPrompt}
                                    onChange={(e) => setInputPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendPrompt();
                                        }
                                    }}
                                    placeholder="Hỏi Gemini"
                                    className="w-full px-3 py-1.5 bg-transparent outline-none text-[13px] text-gray-900 dark:text-slate-100 placeholder-gray-500 resize-none max-h-32"
                                />

                                <div className="flex items-center justify-between pt-1 px-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSourceModal(true)}
                                        className="p-1.5 hover:bg-gray-200/80 dark:hover:bg-slate-700 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 transition cursor-pointer"
                                        title="Đính kèm thêm nguồn từ Drive"
                                    >
                                        <Folder className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSendPrompt()}
                                        disabled={!inputPrompt.trim() || isGenerating}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                                            inputPrompt.trim() && !isGenerating
                                                ? 'bg-[#0b57d0] hover:bg-blue-700 text-white shadow-xs'
                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Centered disclaimer footer */}
                            <p className="text-center text-[10.5px] text-gray-500 dark:text-slate-400 mt-2">
                                Gemini trong Workspace có thể mắc sai sót.{' '}
                                <span className="underline hover:text-gray-700 cursor-pointer">
                                    Tìm hiểu thêm
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL: CHỌN NGUỒN TÀI LIỆU BỔ SUNG ── */}
            {showAddSourceModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md p-5 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                Thêm nguồn tài liệu
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddSourceModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-3 space-y-2">
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Chọn tài liệu hoặc phạm vi để thêm vào ngữ cảnh:
                            </p>

                            {/* Option 1: Toàn bộ Drive */}
                            {(() => {
                                const hasDrive = sources.some((s) => s.type === 'drive' || s.id === 'all');
                                return (
                                    <div
                                        onClick={() => {
                                            if (!hasDrive) {
                                                setSources((prev) => [
                                                    { id: 'all', name: 'Toàn bộ Drive', type: 'drive', checked: true },
                                                    ...prev,
                                                ]);
                                                toast.success('Đã thêm "Toàn bộ Drive" vào nguồn');
                                            }
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition cursor-pointer ${
                                            hasDrive
                                                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200/80 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-4 h-4 rounded bg-[#0b57d0] text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                                                ▲
                                            </div>
                                            <span className="truncate font-medium">Toàn bộ Drive (Tất cả tệp có quyền)</span>
                                        </div>
                                        {hasDrive ? (
                                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        ) : (
                                            <Plus className="w-4 h-4 text-gray-400 hover:text-blue-600 shrink-0" />
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Option 2: Folders */}
                            {allFolders.slice(0, 5).map((folder) => {
                                const isAdded = sources.some((s) => s.id.toString() === folder.id.toString());
                                return (
                                    <div
                                        key={`folder_${folder.id}`}
                                        onClick={() => {
                                            if (!isAdded) {
                                                setSources((prev) => [
                                                    ...prev,
                                                    {
                                                        id: folder.id,
                                                        name: folder.name,
                                                        type: 'folder',
                                                        checked: true,
                                                        folderId: folder.id,
                                                    },
                                                ]);
                                                toast.success(`Đã thêm thư mục "${folder.name}" vào nguồn`);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition cursor-pointer ${
                                            isAdded
                                                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200/80 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
                                            <span className="truncate font-medium">Thư mục: {folder.name}</span>
                                        </div>
                                        {isAdded ? (
                                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        ) : (
                                            <Plus className="w-4 h-4 text-gray-400 hover:text-blue-600 shrink-0" />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Option 3: Files */}
                            {allFiles.slice(0, 10).map((file) => {
                                const isAdded = sources.some((s) => s.id.toString() === file.id.toString());
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => {
                                            if (!isAdded) handleAddSuggestedSource(file);
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition cursor-pointer ${
                                            isAdded
                                                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200/80 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        {isAdded ? (
                                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        ) : (
                                            <Plus className="w-4 h-4 text-gray-400 hover:text-blue-600 shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowAddSourceModal(false)}
                                className="px-4 py-1.5 bg-[#0b57d0] hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition cursor-pointer"
                            >
                                Xong
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ONLYOFFICE / Document Preview Modal */}
            {previewFile && (
                <OnlyOfficeEditorModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
}

export default function DriveAiPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-gray-500">Đang tải giao diện Gemini...</div>}>
            <DriveAiContent />
        </Suspense>
    );
}
