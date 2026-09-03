'use client';
import { MessageSquare, Plus } from 'lucide-react';
import { CHAT_SESSIONS } from '@/lib/fake-data';

interface ChatHistoryListProps {
    activeId: string;
    onSelect: (id: string) => void;
    onNewChat: () => void;
}

export default function ChatHistoryList({ activeId, onSelect, onNewChat }: ChatHistoryListProps) {
    return (
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
            <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lịch sử hội thoại</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-1">
                {CHAT_SESSIONS.map((session) => (
                    <button
                        key={session.id}
                        onClick={() => onSelect(session.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                            activeId === session.id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4 shrink-0" strokeWidth={2} />
                        <span className="truncate">{session.title}</span>
                    </button>
                ))}
            </div>
            <div className="p-2 border-t border-gray-100">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    New chat
                </button>
            </div>
        </div>
    );
}
