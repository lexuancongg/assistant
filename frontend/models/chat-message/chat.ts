export interface ChatSession {
    session: number | string | null;
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
    sessionId?: number | string;
    documentId: number | string | null;
    question: string;
};

export type SourceCitation = {
    documentId: number | string | null;
    chunkId: number | string | null;
    chunkIndex: number | null;
    content: string | null;
    score: number | null;
}

export type MessageAnswer = {
    sessionId: number | string;
    answer: string;
    sources?: SourceCitation[];
};