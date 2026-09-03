import apiClient from "@/utils/api/apiClientFixed";

export interface FileItemDto {
    id: string;
    name: string;
    fileType: string;
    owner?: string;
    ownerDepartmentName?: string;
    uploadedByName?: string;
    uploadedByEmail?: string;
    updatedAt?: string;
    size?: string;
    folderId?: number | null;
    aiIndexed?: boolean;
}

export interface TrashItemDto {
    id: string;
    name: string;
    fileType: string;
    deletedBy: string;
    deletedAt: string;
    size: string;
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

    public async getFileDetail(id: string): Promise<FileItemDto> {
        const response = await apiClient.get(`${this.baseUrl}/${id}`);
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

    public async softDelete(id: string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}`);
        if (!response.ok) {
            throw response;
        }
    }

    public async restore(id: string): Promise<void> {
        const response = await apiClient.post(`${this.baseUrl}/${id}/restore`);
        if (!response.ok) {
            throw response;
        }
    }

    public async deletePermanently(id: string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}/permanent`);
        if (!response.ok) {
            throw response;
        }
    }
}

export default new FileManagementService();
