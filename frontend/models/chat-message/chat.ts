export interface ChatSession {
    session: number | null;
    messages: ChatMessage[];
}

export interface ChatMessage {
    role: MessageRole;
    content: string;
    time?: string;
    source?: string;
}


export enum MessageRole {
    USER = "USER",
    AL="AL"
}


export type ChatRequest = {
    sessionId?: number;
    documentId: number|null;
    question: string;
};

export type MessageAnswer = {
    sessionId: number;
    answer: string;
};