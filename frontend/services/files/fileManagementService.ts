import apiClient, { API_ROOT } from "@/utils/api/apiClientFixed";
import { extractApiError } from "@/utils/api/errorHelper";

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
        this.baseUrl = `${API_ROOT}/api/v1/files`;
    }

    public async getActiveFiles(): Promise<FileItemDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải danh sách tài liệu");
    }

    public async getSharedWithMeFiles(): Promise<FileItemDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/shared-with-me`).catch(() => null);
        if (response && response.ok) {
            return await response.json();
        }
        return [];
    }

    public async getFileDetail(id: number | string): Promise<FileItemDto> {
        const response = await apiClient.get(`${this.baseUrl}/${id}`);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải thông tin chi tiết tài liệu");
    }

    public async getPreviewUrl(id: number | string): Promise<{ url: string; fileType?: string; fileName?: string }> {
        const response = await apiClient.get(`${this.baseUrl}/${id}/preview-url`);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể lấy đường dẫn xem trước tài liệu");
    }

    public async uploadFile(formData: FormData): Promise<FileItemDto> {
        const response = await apiClient.post(this.baseUrl, formData);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Tải lên tài liệu thất bại");
    }

    public async getTrash(): Promise<TrashItemDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/trash`);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải danh sách thùng rác");
    }

    public async softDelete(id: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể xóa tài liệu");
        }
    }

    public async restore(id: number | string): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/${id}/restore`);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể khôi phục tài liệu");
        }
    }

    public async deletePermanently(id: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}/permanent`);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể xóa vĩnh viễn tài liệu");
        }
    }

    public async restoreBatch(ids: (number | string)[]): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/restore/batch`, ids);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể khôi phục các tài liệu");
        }
    }

    public async deletePermanentlyBatch(ids: (number | string)[]): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/permanent/batch`, ids);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể xóa vĩnh viễn các tài liệu");
        }
    }

    public async updateVisibility(id: number | string, visibility: string): Promise<FileItemDto> {
        const response = await apiClient.patch(`${this.baseUrl}/${id}/visibility?visibility=${visibility}`);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể cập nhật quyền hiển thị tài liệu");
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
        throw await extractApiError(response, "Không thể cập nhật phân quyền tài liệu");
    }

    public async updateFileTags(id: number | string, tags: string[]): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/tags`, tags);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể cập nhật nhãn tài liệu");
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
        throw await extractApiError(response, "Không thể tải danh sách phiên bản");
    }

    public async uploadNewVersion(fileId: number | string, file: File): Promise<FileItemDto> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/versions`, formData);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải lên phiên bản mới");
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
        throw await extractApiError(response, "Không thể đọc nội dung văn bản");
    }

    public async saveTextVersion(fileId: number | string, content: string): Promise<FileItemDto> {
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/save-text-version`, { content });
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể lưu phiên bản mới của văn bản");
    }

    public async moveFile(fileId: number | string, folderId: number | string | null): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${fileId}/move`, JSON.stringify({ folderId }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể di chuyển tài liệu");
    }

    public async moveFilesBatch(fileIds: (number | string)[], folderId: number | string | null): Promise<FileItemDto[]> {
        const response = await apiClient.put(`${this.baseUrl}/move-batch`, JSON.stringify({ fileIds, folderId }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể di chuyển các tài liệu");
    }

    public async renameFile(id: number | string, name: string): Promise<FileItemDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/rename`, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể đổi tên tài liệu");
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
        throw await extractApiError(response, "Không thể cập nhật trạng thái yêu thích");
    }

    public async createDownloadToken(fileId: number | string): Promise<{
        token: string;
        downloadUrl: string;
        directUrl?: string;
        fileName: string;
    }> {
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/download-token`, {});
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tạo mã tải xuống tài liệu");
    }

    public async copyFile(id: number | string): Promise<FileItemDto> {
        const response = await apiClient.post(`${this.baseUrl}/${id}/copy`, {});
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tạo bản sao tài liệu");
    }

    public async setOnlyOfficeSaveOptions(
        fileId: number | string,
        options: { saveMode: 'OVERWRITE' | 'NEW_VERSION' | 'DISCARD'; changeDescription?: string }
    ): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/${fileId}/onlyoffice-save-options`, options);
        if (!response.ok) {
            throw await extractApiError(response, "Không thể cập nhật cấu hình lưu tài liệu");
        }
    }

    public async getOnlyOfficeConfig(fileId: number | string): Promise<any> {
        const response = await apiClient.get(`${this.baseUrl}/${fileId}/onlyoffice-config`);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải cấu hình ONLYOFFICE");
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
