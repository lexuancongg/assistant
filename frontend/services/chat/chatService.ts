import apiClient from "@/utils/api/apiClientFixed";

export interface ChatSessionSummaryDto {
    id?: number | string;
    sessionId: number | string;
    title: string;
    assistantPersona?: string;
    favorite?: boolean;
    documentId?: number | string;
    documentName?: string;
    messageCount?: number;
}

export interface ChatMessageDto {
    id?: number | string;
    messageId?: number | string;
    role: 'USER' | 'ASSISTANT' | 'user' | 'assistant';
    content: string;
    feedbackRating?: 'LIKE' | 'DISLIKE';
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

export type FeedbackRating = 'LIKE' | 'DISLIKE';
export type FeedbackReason = 'HALLUCINATION' | 'INACCURATE' | 'INCOMPLETE' | 'WRONG_CITATION' | 'OTHER';

export interface FeedbackRequest {
    rating: FeedbackRating;
    reason?: FeedbackReason;
    comment?: string;
    correctedAnswer?: string;
}

class ChatService {
    private managementUrl: string;

    constructor() {
        this.managementUrl = "http://localhost:8080/api/v1/chat-sessions";
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

    public async submitFeedback(messageId: number | string, payload: FeedbackRequest): Promise<void> {
        const response = await apiClient.post(
            `http://localhost:8080/api/v1/chat/messages/${messageId}/feedback`,
            JSON.stringify(payload)
        );
        if (!response.ok) throw response;
    }

    public async deleteSession(sessionId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.managementUrl}/${sessionId}`);
        if (response.ok) return;
        throw response;
    }
}

export default new ChatService();