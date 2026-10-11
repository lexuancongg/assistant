import apiClient from "@/utils/api/apiClientFixed";

export interface ActivityLogDto {
    id: number | string;
    actorName: string;
    action: string;
    targetName: string;
    timestamp: string;
    type: 'upload' | 'share' | 'download' | 'delete' | 'update' | string;
    fileId?: number | string | null;
    fileType?: string | null;
    ownerName?: string | null;
    location?: string | null;
}

class ActivityService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/activity-logs";
    }

    public async getActivityLogs(): Promise<ActivityLogDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }
}

export default new ActivityService();
