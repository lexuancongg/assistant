export interface Stat {
    count: number;
    growthPercent: number;
}

export interface DashboardStats {
    total: Stat;
    contract: Stat;
    invoice: Stat;
    email: Stat;
    other: Stat;
}



export enum DocumentStatus {
    PROCESSING = "PROCESSING",
    PROCESSED = "PROCESSED",
    FAILED = "FAILED",
    NEEDS_REVIEW = "NEEDS_REVIEW",
}

export enum DocumentType {
    CONTRACT = "CONTRACT",
    INVOICE = "INVOICE",
    EMAIL = "EMAIL",
    OTHER = "OTHER",
}

export type Uploader = {
    id: string;
    name: string;
};

export type DocumentItem = {
    id: number;
    name: string;
    subtitle: string;
    type: DocumentType;
    status: DocumentStatus;
    uploader: Uploader;
    uploadedAt: string; // ISO DateTime, ví dụ: 2026-07-03T14:30:00
    sizeBytes: number;
    extension: string;
};

export type DocumentDetail = {
    id: string;
    name: string;
    type: DocumentType;
    status: DocumentStatus;
    extractedInfo: Record<string, any>;
    aiSummary: string;
    ocrText:string
};