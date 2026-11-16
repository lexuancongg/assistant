export type FolderCreateRequest = {
    name: string;
    parentId?: number | string | null;
};

// Backward-compatibility alias
export type ForderCreateRequest = FolderCreateRequest;
