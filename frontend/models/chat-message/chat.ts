export interface ChatSession {
    session: number | null;
    messages: ChatMessage[];
}

export interface ChatMessage {
    role: MessageRole;
    content: string;
    time?: string;
    // legacy textual source summary
    source?: string;
    // structured citations returned from backend
    sources?: SourceCitation[];
}


export enum MessageRole {
    USER = "USER",
    AL="AL"
}


export type ChatRequest = {
    sessionId?: number;
    documentId: number|null;
    question: string;
    persona?: string | null;
};

export type SourceCitation = {
    documentId: number | null;
    chunkId: string | null;
    chunkIndex: number | null;
    content: string | null;
    score: number | null;
}

export type MessageAnswer = {
    sessionId: number;
    answer: string;
    sources?: SourceCitation[];
};