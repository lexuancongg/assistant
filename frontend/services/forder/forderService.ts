import apiClient from "@/utils/api/apiClientFixed";
import {ForderCreateRequest} from "@/models/forder/forder";

export interface FolderPermissionDto {
    id: number | string;
    folderId: number | string;
    subjectType: 'DEPARTMENT' | 'USER';
    subjectId: number | string;
    subjectName: string;
    subjectDetail?: string;
    level: 'VIEWER' | 'EDITOR' | 'DENY';
    createdAt: string;
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

class ForderService {
    private baseUrl : string

    constructor() {
        this.baseUrl = 'http://localhost:8080/api/v1/forders'
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

    public async createForder(forder: ForderCreateRequest): Promise<any> {
        const response = await apiClient.post(this.baseUrl, JSON.stringify(forder));
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

export default new ForderService();