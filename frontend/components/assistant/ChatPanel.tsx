'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, FileText, Copy, ThumbsUp, Sparkles, Bot, User, Check, RefreshCw, Download, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import chatService, { ChatMessageDto } from '@/services/chat/chatService';
import toast from 'react-hot-toast';

interface ChatMessageItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sourceFile?: string;
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

const PERSONA_PROMPTS: Record<string, string[]> = {
    'Trợ lý tổng hợp doanh nghiệp': [
        '📁 Đang có những file nào trong hệ thống?',
        '📊 Tóm tắt các tài liệu tải lên gần đây',
        '🔍 Tra cứu quy trình đề xuất & phê duyệt',
    ],
    'Trợ lý pháp lý': [
        '⚖️ Rà soát điều khoản rủi ro trong hợp đồng',
        '🛡️ Quy định bảo mật thông tin và bồi thường',
        '⏱️ Kiểm tra thời hạn hiệu lực hợp đồng',
    ],
    'Trợ lý kỹ thuật': [
        '⚙️ Tổng hợp tài liệu kiến trúc kỹ thuật',
        '🔒 Tiêu chuẩn bảo mật và phân quyền API',
        '📝 Hướng dẫn triển khai và vận hành hệ thống',
    ],
    'Trợ lý sales': [
        '💼 Chính sách chiết khấu và báo giá',
        '🤝 Quy trình ký kết hợp đồng khách hàng',
        '📈 Quyền lợi và nghĩa vụ của đối tác',
    ],
    'Trợ lý hỗ trợ khách hàng': [
        '📋 Hướng dẫn xử lý khiếu nại khách hàng',
        '⏰ Thời gian phản hồi cam kết (SLA)',
        '📞 Danh bạ liên hệ các bộ phận chuyên trách',
    ],
};

interface ChatPanelProps {
    sessionId: string | null;
    personas?: string[];
    onSessionCreated?: (newSessionId: string) => void;
}

export default function ChatPanel({ sessionId, personas = [], onSessionCreated }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const [selectedPersona, setSelectedPersona] = useState<string>('Trợ lý tổng hợp doanh nghiệp');
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
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

    const handleSpeak = (text: string, msgId: string) => {
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
                    content: 'Xin chào! Tôi là Trợ lý AI của bạn. Hãy chọn vai trò và đặt câu hỏi để tôi có thể hỗ trợ bạn tra cứu tài liệu doanh nghiệp tốt nhất.'
                }
            ]);
            return;
        }

        setLoadingHistory(true);
        chatService.getChatSession(sessionId)
            .then(data => {
                if (data && data.messages && data.messages.length > 0) {
                    const mapped: ChatMessageItem[] = data.messages.map((m, idx) => ({
                        id: `msg-${idx}-${Date.now()}`,
                        role: m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user',
                        content: m.content
                    }));
                    setMessages(mapped);
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

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Đã sao chép vào clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
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
                persona: selectedPersona
            });

            const assistantMsg: ChatMessageItem = {
                id: 'a-' + Date.now(),
                role: 'assistant',
                content: answer.answer || 'Không tìm thấy thông tin phù hợp trong tài liệu doanh nghiệp.',
                sourceFile: answer.sources && answer.sources.length > 0 ? 'Tài liệu trích dẫn' : undefined
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

    const handleExportChat = () => {
        if (messages.length <= 1) {
            toast.error('Chưa có nội dung hội thoại để xuất');
            return;
        }

        const lines = [
            `# BÁO CÁO HỘI THOẠI TRỢ LÝ AI DOANH NGHIỆP`,
            `*Vai trò trợ lý:* ${selectedPersona}`,
            `*Thời gian xuất:* ${new Date().toLocaleString('vi-VN')}`,
            `\n---\n`,
        ];

        messages.forEach((msg) => {
            const roleName = msg.role === 'user' ? '👤 Người dùng' : '🤖 Trợ lý AI';
            lines.push(`### ${roleName}:\n${msg.content}\n`);
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Chat_Export_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất báo cáo hội thoại thành công!');
    };

    const quickPrompts = PERSONA_PROMPTS[selectedPersona] || PERSONA_PROMPTS['Trợ lý tổng hợp doanh nghiệp'];

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

                <div className="flex items-center gap-2">
                    {/* Export Chat Button */}
                    <button
                        onClick={handleExportChat}
                        title="Xuất nội dung hội thoại"
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xuất hội thoại</span>
                    </button>

                    {/* Persona selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Vai trò:</span>
                        <select
                            value={selectedPersona}
                            onChange={(e) => setSelectedPersona(e.target.value)}
                            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition"
                        >
                            {personas.length > 0 ? (
                                personas.map(p => <option key={p} value={p}>{p}</option>)
                            ) : (
                                <>
                                    <option value="Trợ lý tổng hợp doanh nghiệp">Trợ lý tổng hợp doanh nghiệp</option>
                                    <option value="Trợ lý pháp lý">Trợ lý pháp lý</option>
                                    <option value="Trợ lý kỹ thuật">Trợ lý kỹ thuật</option>
                                    <option value="Trợ lý sales">Trợ lý sales</option>
                                    <option value="Trợ lý hỗ trợ khách hàng">Trợ lý hỗ trợ khách hàng</option>
                                </>
                            )}
                        </select>
                    </div>
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
                                        </div>
                                    </div>
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
