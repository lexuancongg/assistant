'use client';
import { useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import ChatHistoryList from '@/components/assistant/ChatHistoryList';
import ChatPanel from '@/components/assistant/ChatPanel';
import { CHAT_SESSIONS } from '@/lib/fake-data';

export default function AssistantPage() {
    usePageBreadcrumb(['Trợ lý AI']);
    const [activeId, setActiveId] = useState(CHAT_SESSIONS[0].id);

    return (
        <div className="px-6 pt-5 pb-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
            <h1 className="text-xl font-semibold text-gray-900 mb-4">AI Assistant</h1>
            <div className="flex-1 flex gap-4 min-h-0">
                <ChatHistoryList
                    activeId={activeId}
                    onSelect={setActiveId}
                    onNewChat={() => {
                        // TODO: gọi API tạo phiên chat mới, ví dụ POST /api/chat/sessions
                        console.log('Tạo hội thoại mới');
                    }}
                />
                <ChatPanel />
            </div>
        </div>
    );
}
