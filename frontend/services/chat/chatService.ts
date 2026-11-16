import apiClient, { API_ROOT } from "@/utils/api/apiClientFixed";

export interface ChatSessionSummaryDto {
    id?: number | string;
    sessionId: number | string;
    title: string;
    assistantPersona?: string;
    favorite?: boolean;
    documentId?: number | string;
    documentName?: string;
    messageCount?: number;
    createdAt?: string;
}

export interface ChatMessageDto {
    id?: number | string;
    messageId?: number | string;
    role: 'USER' | 'ASSISTANT' | 'user' | 'assistant';
    content: string;
}

export interface ChatSessionDetailDto {
    session: string | number;
    messages: ChatMessageDto[];
}

export interface AgentTraceStepDto {
    step: string;
    action: string;
    details: string;
    status?: string;
    durationMs?: number;
}

export interface ChatAskRequest {
    sessionId?: string | number;
    fileId?: number | string;
    folderId?: number | string;
    documentId?: number | string;
    question: string;
    persona?: string;
    history?: Array<{
        role: string;
        content: string;
    }>;
    mode?: string;
    modelProvider?: string;
}

export interface ChatAskResponse {
    id?: number | string;
    sessionId: number | string;
    messageId?: number | string;
    answer: string;
    sources?: any[];
    reasoningTrace?: AgentTraceStepDto[];
    groundednessScore?: number;
    intent?: string;
    mode?: string;
}



class ChatService {
    private managementUrl: string;

    constructor() {
        this.managementUrl = `${API_ROOT}/api/v1/chat-sessions`;
    }

    public async getChatSession(sessionId: number | string): Promise<ChatSessionDetailDto> {
        const response = await apiClient.get(`${this.managementUrl}/${sessionId}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async listSessions(favorite?: boolean): Promise<ChatSessionSummaryDto[]> {
        const qs = favorite === undefined ? '' : `?favorite=${favorite}`;
        const response = await apiClient.get(`${this.managementUrl}${qs}`);
        if (response.ok) return await response.json();
        throw response;
    }

    public async ask(chatRequest: ChatAskRequest): Promise<ChatAskResponse> {
        const response = await apiClient.post(`${this.managementUrl}/ask`, JSON.stringify(chatRequest));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }



    public async deleteSession(sessionId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.managementUrl}/${sessionId}`);
        if (response.ok) return;
        throw response;
    }
}

export default new ChatService();