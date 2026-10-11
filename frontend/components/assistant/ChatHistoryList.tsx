'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Plus, Bot, Sparkles, MoreVertical, Trash2 } from 'lucide-react';
import { ChatSessionSummaryDto } from '@/services/chat/chatService';

interface ChatHistoryListProps {
    activeId: string | number | null;
    onSelect: (id: string | number) => void;
    onNewChat: () => void;
    onDelete?: (id: string | number) => void;
    sessions: ChatSessionSummaryDto[];
    loading?: boolean;
}

export default function ChatHistoryList({
    activeId,
    onSelect,
    onNewChat,
    onDelete,
    sessions,
    loading = false
}: ChatHistoryListProps) {
    const [menuOpenId, setMenuOpenId] = useState<string | number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };

        if (menuOpenId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpenId]);

    const handleMenuToggle = (e: React.MouseEvent, sid: string | number) => {
        e.stopPropagation();
        setMenuOpenId(prev => (prev === sid ? null : sid));
    };

    const handleDeleteClick = (e: React.MouseEvent, sid: string | number) => {
        e.stopPropagation();
        setMenuOpenId(null);
        if (onDelete) {
            onDelete(sid);
        }
    };

    return (
        <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lịch sử hội thoại</span>
                </div>
                <button
                    onClick={onNewChat}
                    title="Tạo đoạn chat mới"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1">
                {loading && sessions.length === 0 ? (
                    <div className="space-y-2 p-2 animate-pulse">
                        <div className="h-10 bg-gray-100 rounded-xl"></div>
                        <div className="h-10 bg-gray-100 rounded-xl"></div>
                        <div className="h-10 bg-gray-100 rounded-xl"></div>
                    </div>
                ) : sessions.length > 0 ? (
                    sessions.map((session) => {
                        const sid = session.id || session.sessionId.toString();
                        const isSelected = activeId === sid;
                        const isMenuOpen = menuOpenId === sid;

                        return (
                            <div key={sid} className="relative group">
                                <button
                                    onClick={() => onSelect(sid)}
                                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all duration-150 pr-8 ${
                                        isSelected
                                            ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Bot className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{session.title || 'Cuộc trò chuyện mới'}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {session.messageCount ? `${session.messageCount} tin nhắn` : 'Mới'}
                                        </p>
                                    </div>
                                </button>

                                {/* 3-dots button */}
                                <button
                                    onClick={(e) => handleMenuToggle(e, sid)}
                                    title="Tùy chọn"
                                    className={`absolute right-2 top-2.5 p-1 rounded-lg transition ${
                                        isMenuOpen
                                            ? 'opacity-100 bg-gray-200 text-gray-700'
                                            : isSelected
                                            ? 'opacity-80 hover:opacity-100 hover:bg-blue-100 text-blue-700'
                                            : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown menu */}
                                {isMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-2 top-8 z-30 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        <button
                                            onClick={(e) => handleDeleteClick(e, sid)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition text-left font-medium"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Xóa cuộc trò chuyện
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-gray-400">
                        <Sparkles className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-semibold text-gray-500">Chưa có hội thoại nào</p>
                        <p className="text-[11px] text-gray-400 mt-1">Bấm nút bên dưới để bắt đầu đặt câu hỏi cho AI</p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Cuộc trò chuyện mới
                </button>
            </div>
        </div>
    );
}

