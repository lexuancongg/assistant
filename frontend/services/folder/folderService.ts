import { extractApiError } from "@/utils/api/errorHelper";
import apiClient, { API_ROOT } from "@/utils/api/apiClientFixed";
import { FolderCreateRequest, ForderCreateRequest } from "@/models/folder/folder";

export interface FolderPermissionDto {
    id: number | string;
    folderId: number | string;
    subjectType: 'DEPARTMENT' | 'USER';
    subjectId: number | string;
    subjectName: string;
    subjectDetail?: string;
    level: 'VIEWER' | 'EDITOR' | 'DENY';
    createdAt: string;
    inherited?: boolean;
    inheritedFromName?: string;
}

export interface FolderPermissionUpdateDto {
    accessScope?: string;
    ownerId?: number | string;
    permissions: Array<{
        subjectType: 'DEPARTMENT' | 'USER';
        subjectId: number | string;
        level: 'VIEWER' | 'EDITOR' | 'DENY';
    }>;
}

export class FolderService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${API_ROOT}/api/v1/folders`;
    }

    public async getFolderPublicInfo(id: string | number): Promise<{ id: number | string; name: string }> {
        const response = await apiClient.get(`${this.baseUrl}/${id}/public-info`);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Không thể tải thông tin thư mục");
    }

    public async getFolderById(folderId: string | number): Promise<any> {
        try {
            const response = await apiClient.get(`${this.baseUrl}/${folderId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn('Failed to fetch folder by ID:', e);
        }
        return null;
    }

    public async getFolderTree(): Promise<any[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async createFolder(folder: FolderCreateRequest): Promise<any> {
        const response = await apiClient.post(this.baseUrl, JSON.stringify(folder));
        if (response.ok) {
            return await response.json();
        }
        let errMsg = 'Tạo thư mục thất bại';
        try {
            const data = await response.json();
            if (data?.message) errMsg = data.message;
        } catch (_) {}
        const err = new Error(errMsg);
        (err as any).response = response;
        throw err;
    }

    // Backward-compatibility alias
    public createForder(folder: ForderCreateRequest): Promise<any> {
        return this.createFolder(folder);
    }

    public async renameFolder(folderId: string | number, name: string): Promise<any> {
        const response = await apiClient.put(`${this.baseUrl}/${folderId}/rename`, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        let errMsg = 'Đổi tên thư mục thất bại';
        try {
            const data = await response.json();
            if (data?.message) errMsg = data.message;
        } catch (_) {}
        const err = new Error(errMsg);
        (err as any).response = response;
        throw err;
    }

    public async deleteFolder(folderId: string | number): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${folderId}`);
        if (response.ok) {
            return;
        }
        let errMsg = 'Chuyển thư mục vào thùng rác thất bại';
        try {
            const data = await response.json();
            if (data?.message) errMsg = data.message;
        } catch (_) {}
        const err = new Error(errMsg);
        (err as any).response = response;
        throw err;
    }

    public async getFolderPermissions(folderId: string | number): Promise<FolderPermissionDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/${folderId}/permissions`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async updateFolderPermissions(folderId: string | number, data: FolderPermissionUpdateDto): Promise<FolderPermissionDto[]> {
        const response = await apiClient.put(`${this.baseUrl}/${folderId}/permissions`, JSON.stringify(data));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }
}

const folderService = new FolderService();
export default folderService;
