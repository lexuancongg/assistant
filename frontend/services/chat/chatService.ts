import apiClient from "@/utils/api/apiClientFixed";

export interface ChatSessionSummaryDto {
    id?: string;
    sessionId: number;
    title: string;
    assistantPersona?: string;
    favorite?: boolean;
    documentId?: number;
    documentName?: string;
    messageCount?: number;
}

export interface ChatMessageDto {
    role: 'USER' | 'ASSISTANT' | 'user' | 'assistant';
    content: string;
}

export interface ChatSessionDetailDto {
    session: string;
    messages: ChatMessageDto[];
}

export interface ChatAskRequest {
    sessionId?: string | number;
    documentId?: number;
    question: string;
    persona?: string;
}

export interface ChatAskResponse {
    id?: string;
    sessionId: number | string;
    answer: string;
    sources?: any[];
}

class ChatService {
    private managementUrl: string;

    constructor() {
        this.managementUrl = "http://localhost:8080/api/v1/chat-sessions";
    }

    public async getChatSession(sessionId: string): Promise<ChatSessionDetailDto> {
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

    public async getPersonas(): Promise<string[]> {
        const response = await apiClient.get(`${this.managementUrl}/personas`);
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

    public async deleteSession(sessionId: string): Promise<void> {
        const response = await apiClient.delete(`${this.managementUrl}/${sessionId}`);
        if (response.ok) return;
        throw response;
    }
}

export default new ChatService();