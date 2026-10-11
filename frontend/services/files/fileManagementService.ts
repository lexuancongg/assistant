import apiClient from "@/utils/api/apiClientFixed";

export interface FileItemDto {
    id: number | string;
    name: string;
    fileType: string;
    owner?: string;
    ownerDepartmentName?: string;
    uploadedByName?: string;
    uploadedByEmail?: string;
    updatedAt?: string;
    size?: string;
    folderId?: number | null;
    folderName?: string | null;
    aiIndexed?: boolean;
    storagePath?: string;
    visibility?: 'INHERIT' | 'RESTRICTED' | 'PRIVATE' | 'COMPANY';
    tags?: string[];
    thumbnailPath?: string;
    version?: string;
    versionNo?: number;
}

export interface TrashItemDto {
    id: number | string;
    name: string;
    fileType: string;
    deletedBy: string;
    deletedAt: string;
    size: string;
    owner?: string;
    uploadedByName?: string;
    uploadedByEmail?: string;
    folderId?: number | string | null;
    folderName?: string | null;
    originalLocation?: string;
    location?: string;
    description?: string;
    thumbnailPath?: string;
    isShared?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface FileVersionDto {
    id: number | string;
    fileId: number | string;
    versionNo: number;
    storagePath: string;
    sizeBytes: number;
    sizeFormatted: string;
    uploadedByName: string;
    uploadedByEmail: string;
    createdAt: string;
    isCurrent: boolean;
}

class FileManagementService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/files";
    }

    public async getActiveFiles(): Promise<FileItemDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async getSharedWithMeFiles(): Promise<FileItemDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/shared-with-me`).catch(() => null);
        if (response && response.ok) {
            return await response.json();
        }
        return await this.getActiveFiles().catch(() => []);
    }

    public async getFileDetail(id: number | string): Promise<FileItemDto> {
        const response = await apiClient.get(`${this.baseUrl}/${id}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async getPreviewUrl(id: number | string): Promise<{ url: string; fileType?: string; fileName?: string }> {
        const response = await apiClient.get(`${this.baseUrl}/${id}/preview-url`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async uploadFile(formData: FormData): Promise<FileItemDto> {
        const response = await apiClient.post(this.baseUrl, formData);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async getTrash(): Promise<TrashItemDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/trash`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async softDelete(id: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw response;
        }
    }

    public async restore(id: number | string): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/${id}/restore`);
        if (!response.ok) {
            throw response;
        }
    }

    public async deletePermanently(id: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}/permanent`);
        if (!response.ok) {
            throw response;
        }
    }

    public async restoreBatch(ids: (number | string)[]): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/restore/batch`, ids);
        if (!response.ok) {
            throw response;
        }
    }

    public async deletePermanentlyBatch(ids: (number | string)[]): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/permanent/batch`, ids);
        if (!response.ok) {
            throw response;
        }
    }

    public async updateVisibility(id: number | string, visibility: string): Promise<FileItemDto> {
        const response = await apiClient.patch(`${this.baseUrl}/${id}/visibility?visibility=${visibility}`);
        if (!response.ok) {
            throw response;
        }
        return await response.json();
    }

    public async getFilePermissions(id: number | string): Promise<FilePermissionDto[]> {
        try {
            const response = await apiClient.get(`${this.baseUrl}/${id}/permissions`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn('Lỗi tải file permissions từ backend:', e);
        }
        return [];
    }

    public async updateFilePermissions(id: number | string, data: FilePermissionUpdateDto): Promise<FilePermissionDto[]> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/permissions`, data);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async updateFileTags(id: number | string, tags: string[]): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/tags`, tags);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async getAllTags(): Promise<string[]> {
        try {
            const response = await apiClient.get(`${this.baseUrl}/tags`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn('Lỗi tải danh sách tag từ server:', e);
        }
        return [];
    }

    public async getFileVersions(fileId: number | string): Promise<FileVersionDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/${fileId}/versions`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async uploadNewVersion(fileId: number | string, file: File): Promise<FileItemDto> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/versions`, formData);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public getVersionStreamUrl(fileId: number | string, versionId: number | string): string {
        return `${this.baseUrl}/${fileId}/versions/${versionId}/stream`;
    }

    public async getFileText(fileId: number | string): Promise<string> {
        const response = await apiClient.get(`${this.baseUrl}/${fileId}/text`);
        if (response.ok) {
            const data = await response.json();
            return data.text || '';
        }
        throw response;
    }

    public async saveTextVersion(fileId: number | string, content: string): Promise<FileItemDto> {
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/save-text-version`, { content });
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async moveFile(fileId: number | string, folderId: number | string | null): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${fileId}/move`, JSON.stringify({ folderId }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async moveFilesBatch(fileIds: (number | string)[], folderId: number | string | null): Promise<FileItemDto[]> {
        const response = await apiClient.put(`${this.baseUrl}/move-batch`, JSON.stringify({ fileIds, folderId }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async renameFile(id: number | string, name: string): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/rename`, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async uploadThumbnail(fileId: number | string, blob: Blob): Promise<void> {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const fd = new FormData();
        fd.append('thumbnail', blob, 'thumb.jpg');

        await fetch(`${this.baseUrl}/${fileId}/thumbnail`, {
            method: 'POST',
            headers,
            body: fd,
        }).catch((err) => {
            console.warn('[FileManagementService] Thumbnail upload failed:', err);
        });
    }

    public async getStarredFileIds(): Promise<string[]> {
        try {
            const response = await apiClient.get(`${this.baseUrl}/starred`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    return data.map(String);
                }
            }
        } catch (err) {
            console.warn('[FileManagementService] Failed to load starred file ids from backend:', err);
        }
        return [];
    }

    public async toggleStar(fileId: string | number): Promise<{ fileId: string | number; starred: boolean }> {
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/star`, {});
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }
}

export interface FilePermissionDto {
    id: number | string;
    fileId: number | string;
    subjectType: 'USER' | 'DEPARTMENT';
    subjectId: number | string;
    subjectName: string;
    subjectDetail: string;
    level: 'VIEWER' | 'EDITOR' | 'DENY';
    createdAt: string;
}

export interface FilePermissionUpdateDto {
    visibility?: string;
    permissions: {
        subjectType: 'USER' | 'DEPARTMENT';
        subjectId: number | string;
        level: 'VIEWER' | 'EDITOR' | 'DENY';
    }[];
}

export default new FileManagementService();
