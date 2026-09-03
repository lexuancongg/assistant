import apiClient from "@/utils/api/apiClientFixed";
import {ForderCreateRequest} from "@/models/forder/forder";

export interface FolderPermissionDto {
    id: string;
    folderId: number;
    subjectType: 'DEPARTMENT' | 'USER';
    subjectId: string;
    subjectName: string;
    subjectDetail?: string;
    level: 'VIEWER' | 'EDITOR';
    createdAt: string;
}

export interface FolderPermissionUpdateDto {
    accessScope?: string;
    permissions: Array<{
        subjectType: 'DEPARTMENT' | 'USER';
        subjectId: string;
        level: 'VIEWER' | 'EDITOR';
    }>;
}

class ForderService {
    private baseUrl : string

    constructor() {
        this.baseUrl = 'http://localhost:8080/api/v1/forders'
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
        throw response;
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