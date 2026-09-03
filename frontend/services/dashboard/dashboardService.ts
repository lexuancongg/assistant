import apiClient from "@/utils/api/apiClientFixed";

export interface DashboardStatsDto {
    totalFiles: number;
    totalStorage: string;
    aiIndexedFiles: number;
    totalUsers: number;
}

class DashboardService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/dashboard";
    }

    public async getStats(): Promise<DashboardStatsDto> {
        const response = await apiClient.get(`${this.baseUrl}/stats`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }
}

export default new DashboardService();
