'use client';
import { useEffect, useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import ChatHistoryList from '@/components/assistant/ChatHistoryList';
import ChatPanel from '@/components/assistant/ChatPanel';
import chatService, { ChatSessionSummaryDto } from '@/services/chat/chatService';
import toast from 'react-hot-toast';

export default function AssistantPage() {
    usePageBreadcrumb(['Trợ lý AI']);
    const [sessions, setSessions] = useState<ChatSessionSummaryDto[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [personas, setPersonas] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, personasRes] = await Promise.allSettled([
                chatService.listSessions(),
                chatService.getPersonas()
            ]);

            if (personasRes.status === 'fulfilled') {
                setPersonas(personasRes.value);
            }

            if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
                setSessions(sessionsRes.value);
                if (sessionsRes.value.length > 0 && !activeId) {
                    const firstId = sessionsRes.value[0].id || sessionsRes.value[0].sessionId.toString();
                    setActiveId(firstId);
                }
            }
        } catch (err) {
            console.warn('Cannot fetch chat data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleNewChat = () => {
        setActiveId(null);
    };

    const handleSessionCreated = async (newSessionId: string) => {
        setActiveId(newSessionId);
        try {
            const updated = await chatService.listSessions();
            setSessions(updated);
        } catch (e) {
            console.warn('Refresh sessions failed:', e);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await chatService.deleteSession(sessionId);
            setSessions(prev => {
                const next = prev.filter(s => (s.id || s.sessionId.toString()) !== sessionId);
                if (activeId === sessionId) {
                    setActiveId(next.length > 0 ? (next[0].id || next[0].sessionId.toString()) : null);
                }
                return next;
            });
            toast.success('Đã xóa cuộc trò chuyện');
        } catch (e) {
            console.error('Delete session failed:', e);
            toast.error('Xóa cuộc trò chuyện thất bại');
        }
    };

    return (
        <div className="px-6 pt-5 pb-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Trợ lý AI Doanh nghiệp</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Hỏi đáp thông minh và tra cứu ngữ nghĩa toàn bộ tài liệu công ty</p>
                </div>
            </div>

            <div className="flex-1 flex gap-5 min-h-0">
                <ChatHistoryList
                    activeId={activeId}
                    sessions={sessions}
                    loading={loading}
                    onSelect={setActiveId}
                    onNewChat={handleNewChat}
                    onDelete={handleDeleteSession}
                />
                <ChatPanel
                    sessionId={activeId}
                    personas={personas}
                    onSessionCreated={handleSessionCreated}
                />
            </div>
        </div>
    );
}
