import apiClient from "@/utils/api/apiClientFixed";

export interface AccessRequestCreateDto {
    folderId?: number | string;
    folderName?: string;
    fileId?: number | string;
    fileName?: string;
    reason: string;
    requestedLevel: 'VIEWER' | 'EDITOR';
}

export interface AccessRequestDto {
    id: number | string;
    folderId?: number | string;
    folderName?: string;
    fileId?: number | string;
    fileName?: string;
    requesterId?: number | string;
    requesterName: string;
    requesterEmail: string;
    requesterAvatar?: string;
    reason: string;
    requestedLevel: 'VIEWER' | 'EDITOR';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    respondedAt?: string;
}

class AccessRequestService {
    private baseUrl = "http://localhost:8080/api/v1/access-requests";

    public async createRequest(payload: AccessRequestCreateDto): Promise<AccessRequestDto> {
        const response = await apiClient.post(this.baseUrl, payload);
        if (response.ok) {
            return await response.json();
        }
        throw new Error("Không thể gửi yêu cầu cấp quyền");
    }

    public async getAllRequests(): Promise<AccessRequestDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        return [];
    }

    public async getMyRequests(): Promise<AccessRequestDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/my`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    }

    public async getPendingRequests(): Promise<AccessRequestDto[]> {
        const response = await apiClient.get(`${this.baseUrl}/pending`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    }

    public async getPendingCount(): Promise<number> {
        const response = await apiClient.get(`${this.baseUrl}/count`);
        if (response.ok) {
            const data = await response.json();
            return data.pendingCount || 0;
        }
        return 0;
    }

    public async approveRequest(id: number | string): Promise<AccessRequestDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/approve`, {});
        if (response.ok) {
            return await response.json();
        }
        throw new Error("Không thể duyệt yêu cầu");
    }

    public async rejectRequest(id: number | string): Promise<AccessRequestDto> {
        const response = await apiClient.put(`${this.baseUrl}/${id}/reject`, {});
        if (response.ok) {
            return await response.json();
        }
        throw new Error("Không thể từ chối yêu cầu");
    }
}

export default new AccessRequestService();