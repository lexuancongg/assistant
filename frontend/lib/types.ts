// ── Các type dùng chung toàn app — khi nối API thật, giữ nguyên shape này ──

export type FileType = 'pdf' | 'xlsx' | 'docx' | 'pptx' | 'txt' | 'image';

export interface FolderNode {
    id: number | string;
    name: string;
    children: FolderNode[];
}

// lib/types.ts — bổ sung
export type DepartmentRole = 'Trưởng phòng' | 'Thành viên';

export type DepartmentMember = {
    userId: number | string;
    name: string;
    email: string;
    role: DepartmentRole;
    avatarInitial: string;
    avatarColor: string; // class Tailwind, ví dụ 'bg-green-100 text-green-700'
};

export type Department = {
    id: number | string;
    name: string;
    members: DepartmentMember[];
};

export interface FileItem {
    id: number | string;
    name: string;
    type: FileType;
    owner: string;
    uploadedByName: string;
    uploadedByEmail: string;
    updatedAt: string;
    size: string;
    tags?: string[];
    path?: string;
}

export type UserRole = 'Admin' | 'Manager' | 'User';
export type UserStatus = 'active' | 'locked';

export interface UserItem {
    id: number | string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    avatarInitial: string;
    avatarColor: string;
}

export type PermissionLevel = 'Viewer' | 'Editor';

export interface PermissionEntry {
    id: number | string;
    subjectType: 'group' | 'user';
    name: string;
    subtitle: string;
    level: PermissionLevel;
    avatarInitial: string;
    avatarColor: string;
}

export interface ChatMessage {
    id: number | string;
    role: 'user' | 'assistant';
    content: string;
    summaryPoints?: string[];
    sourceFile?: string;
    sourcePages?: string;
}

export interface ChatSession {
    id: number | string;
    title: string;
}

export interface UploadingFile {
    id: number | string;
    name: string;
    size: string;
    progress: number;
    status: 'uploading' | 'done';
}

export interface TrashItem {
    id: number | string;
    name: string;
    deletedBy: string;
    deletedAt: string;
    size: string;
}

export interface ActivityLogItem {
    id: number | string;
    actorName: string;
    action: string;
    targetName: string;
    timestamp: string;
    type: 'upload' | 'share' | 'download' | 'delete' | 'update' | 'ai_query';
}
