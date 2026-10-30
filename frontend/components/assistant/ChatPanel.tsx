'use client';
import { useEffect, useRef, useState } from 'react';
import {
    Send,
    FileText,
    Copy,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    Bot,
    User,
    Check,
    RefreshCw,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Workflow,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Layers,
    Cpu,
    Presentation,
    X
} from 'lucide-react';
import chatService, { ChatMessageDto, AgentTraceStepDto, FeedbackRating, FeedbackReason } from '@/services/chat/chatService';
import presentationService from '@/services/presentation/presentationService';
import { exportToPowerPoint } from '@/utils/pptxExport';
import toast from 'react-hot-toast';

interface ChatMessageItem {
    id: string | number;
    role: 'user' | 'assistant';
    content: string;
    messageId?: string | number;
    sourceFile?: string;
    reasoningTrace?: AgentTraceStepDto[];
    groundednessScore?: number;
    intent?: string;
    mode?: string;
}

function AgentReasoningTraceView({
    trace,
    groundednessScore,
    intent,
    mode
}: {
    trace?: AgentTraceStepDto[];
    groundednessScore?: number;
    intent?: string;
    mode?: string;
}) {
    const [expanded, setExpanded] = useState(false);

    if (!trace || trace.length === 0) {
        if (groundednessScore !== undefined) {
            return (
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Groundedness: {Math.round(groundednessScore * 100)}% (Xác thực dữ liệu gốc)
                    </span>
                </div>
            );
        }
        return null;
    }

    const stepIcons: Record<string, string> = {
        'Router': '🧭',
        'Security Retrieval': '🛡️',
        'Hybrid Rerank': '⚡',
        'Fact-Checking Guardrail': '✅',
    };

    return (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-linear-to-b from-indigo-50/60 to-white p-2.5 text-xs">
            <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-semibold text-[10px] shadow-xs">
                        <Workflow className="w-3 h-3" />
                        Multi-Agent Workflow
                    </span>
                    {intent && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-medium text-[10px]">
                            Ý định: {intent}
                        </span>
                    )}
                    {groundednessScore !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Độ tin cậy: {Math.round(groundednessScore * 100)}%
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-800 p-1 flex items-center gap-1 text-[11px] font-medium"
                >
                    <span>{expanded ? 'Thu gọn trace' : 'Xem luồng Agent'}</span>
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {expanded && (
                <div className="mt-2.5 pt-2 border-t border-indigo-100 space-y-1.5">
                    {trace.map((step, idx) => (
                        <div
                            key={idx}
                            className="p-2 rounded-lg bg-white border border-indigo-50 shadow-2xs flex items-start gap-2.5 text-[11px]"
                        >
                            <span className="text-sm shrink-0 mt-0.5">
                                {stepIcons[step.step] || '🤖'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-gray-900">
                                        Agent {idx + 1}: {step.step}
                                    </span>
                                    {step.durationMs !== undefined && (
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {step.durationMs}ms
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 mt-0.5 font-medium">{step.action}</p>
                                <p className="text-gray-500 text-[10px] mt-0.5 break-words font-mono bg-slate-50 p-1.5 rounded">
                                    {step.details}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function parseInlineFormatting(text: string) {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const m = match[0];
        if (m.startsWith('**') && m.endsWith('**')) {
            parts.push(
                <strong key={`b-${match.index}`} className="font-semibold text-gray-900">
                    {m.slice(2, -2)}
                </strong>
            );
        } else if (m.startsWith('`') && m.endsWith('`')) {
            parts.push(
                <code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded bg-gray-100 text-blue-600 text-xs font-mono">
                    {m.slice(1, -1)}
                </code>
            );
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
}

function FormattedContent({ content }: { content: string }) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

    const flushList = () => {
        if (!listBuffer) return;
        if (listBuffer.type === 'ul') {
            elements.push(
                <ul key={`list-${elements.length}`} className="my-2 ml-5 list-disc space-y-1 text-gray-800">
                    {listBuffer.items.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                            {parseInlineFormatting(item)}
                        </li>
                    ))}
                </ul>
            );
        } else {
            elements.push(
                <ol key={`list-${elements.length}`} className="my-2 ml-5 list-decimal space-y-1 text-gray-800">
                    {listBuffer.items.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                            {parseInlineFormatting(item)}
                        </li>
                    ))}
                </ol>
            );
        }
        listBuffer = null;
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={`h3-${index}`} className="text-sm font-bold text-gray-900 mt-3 mb-1.5 first:mt-0">
                    {parseInlineFormatting(trimmed.slice(4))}
                </h3>
            );
        } else if (trimmed.startsWith('#### ')) {
            flushList();
            elements.push(
                <h4 key={`h4-${index}`} className="text-xs font-bold text-gray-800 mt-2 mb-1">
                    {parseInlineFormatting(trimmed.slice(5))}
                </h4>
            );
        } else if (trimmed.startsWith('---')) {
            flushList();
            elements.push(<hr key={`hr-${index}`} className="my-2.5 border-gray-200" />);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.slice(2);
            if (listBuffer && listBuffer.type === 'ul') {
                listBuffer.items.push(itemText);
            } else {
                flushList();
                listBuffer = { type: 'ul', items: [itemText] };
            }
        } else if (/^\d+\.\s/.test(trimmed)) {
            const itemText = trimmed.replace(/^\d+\.\s/, '');
            if (listBuffer && listBuffer.type === 'ol') {
                listBuffer.items.push(itemText);
            } else {
                flushList();
                listBuffer = { type: 'ol', items: [itemText] };
            }
        } else if (trimmed === '') {
            flushList();
        } else {
            flushList();
            elements.push(
                <p key={`p-${index}`} className="text-gray-800 leading-relaxed my-1">
                    {parseInlineFormatting(line)}
                </p>
            );
        }
    });

    flushList();

    return <div className="space-y-1 text-sm">{elements}</div>;
}

const QUICK_PROMPTS: string[] = [
    '📁 Đang có những file nào trong hệ thống?',
    '📊 Tóm tắt các tài liệu tải lên gần đây',
    '🔍 Tra cứu quy trình đề xuất & phê duyệt',
    '⚖️ Rà soát điều khoản rủi ro trong hợp đồng',
    '🔒 Tiêu chuẩn bảo mật và phân quyền API',
];

interface ChatPanelProps {
    sessionId: string | number | null;
    onSessionCreated?: (newSessionId: string | number) => void;
}

export default function ChatPanel({ sessionId, onSessionCreated }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const [executionMode, setExecutionMode] = useState<'AGENTIC_WORKFLOW' | 'STANDARD_RAG'>('AGENTIC_WORKFLOW');
    const modelProvider = 'gemini';
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [copiedId, setCopiedId] = useState<string | number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | number | null>(null);
    const [feedbackMap, setFeedbackMap] = useState<Record<string | number, FeedbackRating>>({});
    const [showFeedbackForm, setShowFeedbackForm] = useState<string | number | null>(null);
    const [dislikeReason, setDislikeReason] = useState<FeedbackReason>('INACCURATE');
    const [dislikeComment, setDislikeComment] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {}
            }
            setIsListening(false);
            return;
        }

        if (typeof window === 'undefined') return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Trình duyệt chưa hỗ trợ Voice Recognition. Vui lòng dùng Chrome hoặc Edge.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
                toast.success('Đang lắng nghe... Hãy nói câu hỏi của bạn!', { icon: '🎙️', duration: 2500 });
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0]?.[0]?.transcript;
                if (transcript) {
                    setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Vui lòng cấp quyền Microphone trong cài đặt trình duyệt.');
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Failed to start voice recognition:', err);
            setIsListening(false);
        }
    };

    const handleSpeak = (text: string, msgId: string | number) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            toast.error('Trình duyệt không hỗ trợ phát âm thanh.');
            return;
        }

        if (speakingId === msgId) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        window.speechSynthesis.cancel();
        // Clean markdown tags before speaking
        const cleanText = text
            .replace(/[*#`_~]/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .replace(/<.*?>/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;

        utterance.onstart = () => setSpeakingId(msgId);
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!sessionId) {
            setMessages([
                {
                    id: 'init-welcome',
                    role: 'assistant',
                    content: 'Xin chào! Tôi là Trợ lý AI của bạn. Hãy đặt câu hỏi để tôi có thể hỗ trợ bạn tra cứu tài liệu doanh nghiệp tốt nhất.'
                }
            ]);
            return;
        }

        setLoadingHistory(true);
        chatService.getChatSession(sessionId)
            .then(data => {
                if (data && data.messages && data.messages.length > 0) {
                    const initialFeedback: Record<string | number, FeedbackRating> = {};
                    const mapped: ChatMessageItem[] = data.messages.map((m, idx) => {
                        const mId = m.messageId || m.id;
                        const itemKey = mId ? `msg-${mId}` : `msg-${idx}-${Date.now()}`;
                        if (m.feedbackRating) {
                            if (mId) initialFeedback[mId] = m.feedbackRating as FeedbackRating;
                            initialFeedback[itemKey] = m.feedbackRating as FeedbackRating;
                        }
                        return {
                            id: itemKey,
                            role: m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user',
                            content: m.content,
                            messageId: mId
                        };
                    });
                    setMessages(mapped);
                    if (Object.keys(initialFeedback).length > 0) {
                        setFeedbackMap(prev => ({ ...prev, ...initialFeedback }));
                    }
                } else {
                    setMessages([
                        {
                            id: 'init-empty',
                            role: 'assistant',
                            content: 'Phiên trò chuyện đã sẵn sàng. Hãy đặt câu hỏi về tài liệu hoặc chính sách công ty!'
                        }
                    ]);
                }
            })
            .catch(err => {
                console.warn('Cannot load session messages:', err);
                setMessages([
                    {
                        id: 'init-fallback',
                        role: 'assistant',
                        content: 'Xin chào! Hãy đặt câu hỏi bất kỳ về tài liệu công ty để bắt đầu trò chuyện.'
                    }
                ]);
            })
            .finally(() => {
                setLoadingHistory(false);
            });
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleCopy = (text: string, id: string | number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Đã sao chép vào clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFeedback = async (msg: ChatMessageItem, rating: FeedbackRating) => {
        const targetId = msg.messageId ?? (typeof msg.id === 'number' ? msg.id : null);
        if (!targetId) {
            toast.error('Không tìm thấy ID tin nhắn để đánh giá.');
            return;
        }
        if (feedbackMap[msg.id] || feedbackMap[targetId]) return; // đã vote rồi

        if (rating === 'LIKE') {
            try {
                await chatService.submitFeedback(targetId, { rating: 'LIKE' });
                setFeedbackMap(prev => ({
                    ...prev,
                    [msg.id]: 'LIKE' as const,
                    [targetId]: 'LIKE' as const
                }));
                toast.success('Cảm ơn phản hồi tích cực của bạn! 👍', { duration: 2500 });
            } catch {
                toast.error('Không thể gửi đánh giá. Vui lòng thử lại.');
            }
        } else {
            // Mở form chọn lý do
            setShowFeedbackForm(msg.id);
            setDislikeReason('INACCURATE');
            setDislikeComment('');
        }
    };

    const handleSubmitDislike = async (msg: ChatMessageItem) => {
        const targetId = msg.messageId ?? (typeof msg.id === 'number' ? msg.id : null);
        if (!targetId) return;
        try {
            await chatService.submitFeedback(targetId, {
                rating: 'DISLIKE',
                reason: dislikeReason,
                comment: dislikeComment || undefined,
            });
            setFeedbackMap(prev => ({
                ...prev,
                [msg.id]: 'DISLIKE' as const,
                [targetId]: 'DISLIKE' as const
            }));
            setShowFeedbackForm(null);
            toast.success('Cảm ơn! Phản hồi của bạn giúp AI cải thiện hơn.', { duration: 2500 });
        } catch {
            toast.error('Không thể gửi đánh giá. Vui lòng thử lại.');
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userPrompt = input.trim();
        const userMsg: ChatMessageItem = {
            id: 'u-' + Date.now(),
            role: 'user',
            content: userPrompt
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const answer = await chatService.ask({
                sessionId: sessionId || undefined,
                question: userPrompt,
                mode: executionMode,
                modelProvider: modelProvider
            });

            const rawMsgId = answer.messageId;
            const assistantMsg: ChatMessageItem = {
                id: rawMsgId ? `msg-${rawMsgId}` : 'a-' + Date.now(),
                role: 'assistant',
                messageId: rawMsgId,
                content: answer.answer || 'Không tìm thấy thông tin phù hợp trong tài liệu doanh nghiệp.',
                sourceFile: answer.sources && answer.sources.length > 0 ? 'Tài liệu trích dẫn' : undefined,
                reasoningTrace: answer.reasoningTrace,
                groundednessScore: answer.groundednessScore,
                intent: answer.intent,
                mode: answer.mode
            };
            setMessages(prev => [...prev, assistantMsg]);

            const returnedSessionId = (answer as any).id || (answer.sessionId ? answer.sessionId.toString() : null);
            if (onSessionCreated && returnedSessionId) {
                onSessionCreated(returnedSessionId);
            }
        } catch (err: any) {
            console.error('Ask AI failed:', err);
            const errorMsg: ChatMessageItem = {
                id: 'err-' + Date.now(),
                role: 'assistant',
                content: 'Rất tiếc, đã xảy ra lỗi kết nối với máy chủ AI. Vui lòng kiểm tra lại dịch vụ Backend hoặc thử lại sau.'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handlePromptClick = (promptText: string) => {
        // Strip emoji icon from beginning if any
        const cleanPrompt = promptText.replace(/^[^\w\s\u00C0-\u1EF9]+\s*/, '');
        setInput(cleanPrompt);
    };

    const [isGeneratingPptx, setIsGeneratingPptx] = useState<string | number | null>(null);

    const handleExportSlidePptx = async (content: string, customTopic?: string) => {
        const idKey = customTopic || content.slice(0, 30);
        setIsGeneratingPptx(idKey);
        const tId = toast.loading('Đang khởi tạo Slide PowerPoint bằng Gemini AI (TypeSafe)...');
        try {
            const firstLine = content.split('\n')[0].replace(/^[#*\-•\s]+/, '').trim();
            const topic = customTopic || (firstLine.length > 10 ? firstLine.slice(0, 90) : 'Báo Cáo Phân Tích Dữ Liệu Doanh Nghiệp');

            const presentationData = await presentationService.generateSlides({
                topic,
                context: content,
                slideCount: 5,
                targetAudience: 'Ban Giám Đốc & Khách Hàng Doanh Nghiệp',
            });

            const fileName = await exportToPowerPoint(presentationData);
            toast.success(`Đã xuất và tải xuống "${fileName}" thành công!`, { id: tId });
        } catch (err: any) {
            console.error('Export PPTX error:', err);
            toast.error('Lỗi khi xuất slide: ' + (err?.message || err), { id: tId });
        } finally {
            setIsGeneratingPptx(null);
        }
    };

    const handleExportFullChatPptx = async () => {
        if (messages.length <= 1) {
            toast.error('Chưa có nội dung hội thoại để tạo slide');
            return;
        }

        const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n---\n\n');
        const userQuestions = messages.filter(m => m.role === 'user').map(m => m.content).join('; ');

        await handleExportSlidePptx(
            assistantMessages || messages.map(m => `${m.role}: ${m.content}`).join('\n'),
            `Báo Cáo Thuyết Trình: ${userQuestions.slice(0, 70) || 'Hội Thoại Doanh Nghiệp'}`
        );
    };

    const quickPrompts = QUICK_PROMPTS;

    return (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col min-w-0 shadow-sm overflow-hidden">
            {/* Header with Persona selector & Export */}
            <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            AI Enterprise Assistant
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        </h2>
                        <p className="text-xs text-gray-400">Trợ lý phân tích & tra cứu tài liệu doanh nghiệp</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Mode Selector Toggle */}
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setExecutionMode('AGENTIC_WORKFLOW')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                executionMode === 'AGENTIC_WORKFLOW'
                                    ? 'bg-white text-indigo-600 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="Kích hoạt luồng Multi-Agent: Router -> RBAC Retrieval -> Hybrid Rerank -> Fact-Checker"
                        >
                            <Workflow className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="hidden sm:inline">Multi-Agent</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setExecutionMode('STANDARD_RAG')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                executionMode === 'STANDARD_RAG'
                                    ? 'bg-white text-blue-600 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="Truy xuất RAG Tiêu chuẩn tốc độ cao"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span className="hidden sm:inline">RAG Thường</span>
                        </button>
                    </div>

                    {/* Active AI Model Indicator */}
                    <div
                        className="text-xs font-semibold bg-blue-50/80 border border-blue-200/80 rounded-xl px-2.5 py-1.5 text-blue-700 flex items-center gap-1.5 shadow-2xs"
                        title="Mô hình AI: Google Gemini Flash"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Gemini Flash</span>
                    </div>

                    {/* Export Presentation PPTX Button */}
                    <button
                        type="button"
                        onClick={handleExportFullChatPptx}
                        disabled={!!isGeneratingPptx}
                        title="Tạo file thuyết trình PowerPoint từ cuộc hội thoại này bằng Gemini AI"
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 transition shadow-xs cursor-pointer"
                    >
                        {isGeneratingPptx ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        ) : (
                            <Presentation className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span className="hidden sm:inline">Xuất Slide PPTX</span>
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 bg-gray-50/40">
                {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="text-xs font-medium">Đang tải lịch sử cuộc trò chuyện...</p>
                    </div>
                ) : (
                    messages.map((msg) =>
                        msg.role === 'user' ? (
                            <div key={msg.id} className="flex justify-end items-start gap-2.5">
                                <div className="bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-xs max-w-[75%] shadow-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                                    <User className="w-4 h-4" />
                                </div>
                            </div>
                        ) : (
                            <div key={msg.id} className="flex justify-start items-start gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-xs px-4 py-3.5 max-w-[85%] text-sm shadow-xs">
                                    <FormattedContent content={msg.content} />
                                    <AgentReasoningTraceView
                                        trace={msg.reasoningTrace}
                                        groundednessScore={msg.groundednessScore}
                                        intent={msg.intent}
                                        mode={msg.mode}
                                    />
                                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5 text-blue-600">
                                            {msg.sourceFile && (
                                                <>
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="font-medium text-[11px]">{msg.sourceFile}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleSpeak(msg.content, msg.id)}
                                                className={`flex items-center gap-1 p-1 rounded-lg transition ${
                                                    speakingId === msg.id
                                                        ? 'text-blue-600 bg-blue-50 font-semibold'
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                }`}
                                                title={speakingId === msg.id ? 'Dừng đọc' : 'Đọc câu trả lời (Voice)'}
                                            >
                                                {speakingId === msg.id ? (
                                                    <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                                ) : (
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition"
                                                title="Sao chép câu trả lời"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            {/* 📊 Xuất Slide PowerPoint Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleExportSlidePptx(msg.content)}
                                                disabled={isGeneratingPptx === (msg.content.slice(0, 30))}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/90 px-2 py-0.5 rounded-md transition shadow-2xs cursor-pointer"
                                                title="Xuất nội dung phân tích này thành Slide PowerPoint (.pptx)"
                                            >
                                                {isGeneratingPptx === (msg.content.slice(0, 30)) ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                                ) : (
                                                    <Presentation className="w-3 h-3 text-blue-600" />
                                                )}
                                                <span>Xuất Slide PPTX</span>
                                            </button>
                                            {/* Divider */}
                                            <span className="w-px h-3.5 bg-gray-200 mx-0.5" />
                                            {/* 👍 Like button */}
                                            <button
                                                onClick={() => handleFeedback(msg, 'LIKE')}
                                                disabled={!!feedbackMap[msg.id] || (!!msg.messageId && !!feedbackMap[msg.messageId])}
                                                className={`flex items-center gap-1 p-1 rounded-lg transition ${
                                                    (feedbackMap[msg.id] === 'LIKE' || (msg.messageId && feedbackMap[msg.messageId] === 'LIKE'))
                                                        ? 'text-emerald-600 bg-emerald-50 cursor-default'
                                                        : (feedbackMap[msg.id] || (msg.messageId && feedbackMap[msg.messageId]))
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                                title={(feedbackMap[msg.id] === 'LIKE' || (msg.messageId && feedbackMap[msg.messageId] === 'LIKE')) ? 'Bạn đã thích câu trả lời này' : 'Câu trả lời hữu ích'}
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                            </button>
                                            {/* 👎 Dislike button */}
                                            <button
                                                onClick={() => handleFeedback(msg, 'DISLIKE')}
                                                disabled={!!feedbackMap[msg.id] || (!!msg.messageId && !!feedbackMap[msg.messageId])}
                                                className={`flex items-center gap-1 p-1 rounded-lg transition ${
                                                    (feedbackMap[msg.id] === 'DISLIKE' || (msg.messageId && feedbackMap[msg.messageId] === 'DISLIKE'))
                                                        ? 'text-red-500 bg-red-50 cursor-default'
                                                        : (feedbackMap[msg.id] || (msg.messageId && feedbackMap[msg.messageId]))
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                }`}
                                                title={(feedbackMap[msg.id] === 'DISLIKE' || (msg.messageId && feedbackMap[msg.messageId] === 'DISLIKE')) ? 'Bạn đã báo cáo câu trả lời này' : 'Câu trả lời chưa chính xác'}
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Mini dislike form — hiện khi nhấn 👎 */}
                                    {showFeedbackForm === msg.id && (
                                        <div className="mt-2.5 p-3 rounded-xl border border-red-100 bg-red-50/60 text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-red-700 flex items-center gap-1">
                                                    <ThumbsDown className="w-3 h-3" /> Bạn thấy vấn đề gì?
                                                </span>
                                                <button
                                                    onClick={() => setShowFeedbackForm(null)}
                                                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <select
                                                value={dislikeReason}
                                                onChange={e => setDislikeReason(e.target.value as FeedbackReason)}
                                                className="w-full text-xs border border-red-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-red-200 text-gray-700"
                                            >
                                                <option value="INACCURATE">⚠️ Thông tin không chính xác</option>
                                                <option value="HALLUCINATION">🚨 Bịa đặt / Hallucination</option>
                                                <option value="INCOMPLETE">📋 Câu trả lời chưa đầy đủ</option>
                                                <option value="WRONG_CITATION">📎 Sai nguồn trích dẫn</option>
                                                <option value="OTHER">💬 Lý do khác</option>
                                            </select>
                                            <textarea
                                                value={dislikeComment}
                                                onChange={e => setDislikeComment(e.target.value)}
                                                placeholder="Mô tả thêm (tuỳ chọn)..."
                                                rows={2}
                                                className="w-full text-xs border border-red-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:ring-2 focus:ring-red-200 text-gray-700 resize-none placeholder:text-gray-400"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setShowFeedbackForm(null)}
                                                    className="px-2.5 py-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition text-xs font-medium"
                                                >
                                                    Huỷ
                                                </button>
                                                <button
                                                    onClick={() => handleSubmitDislike(msg)}
                                                    className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition"
                                                >
                                                    Gửi phản hồi
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )
                )}

                {loading && (
                    <div className="flex justify-start items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            <span className="text-xs font-semibold text-gray-600 ml-1">AI đang suy nghĩ và tra cứu...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-6 pt-2 pb-1 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
                </span>
                {quickPrompts.map((p, idx) => (
                    <button
                        key={idx}
                        onClick={() => handlePromptClick(p)}
                        className="text-xs whitespace-nowrap bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-3 py-1 rounded-lg border border-gray-200 transition shrink-0"
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Input Bar */}
            <div className="px-6 py-3.5 bg-white shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? '🎙️ Đang lắng nghe giọng nói của bạn...' : 'Nhập câu hỏi hoặc bấm micro để nói...'}
                        className={`flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 ${
                            isListening ? 'text-blue-600 font-medium placeholder:text-blue-500' : 'text-gray-800'
                        }`}
                        disabled={loading}
                    />
                    
                    {/* Microphone Voice-to-Text Button */}
                    <button
                        type="button"
                        onClick={toggleVoiceInput}
                        disabled={loading}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200'
                                : 'bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 shadow-xs'
                        }`}
                        title={isListening ? 'Dừng ghi âm' : 'Nói tiếng Việt (Voice Input)'}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-40 shadow-sm shrink-0"
                        title="Gửi câu hỏi"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
