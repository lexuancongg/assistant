import apiClient from "@/utils/api/apiClientFixed";

export interface FormatStatDto {
    format: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
}

export interface TopDocDto {
    id: number | string;
    name: string;
    format: 'pdf' | 'docx' | 'xlsx' | string;
    version: string;
    size: string;
    chunks: number;
    department: string;
    rbac: {
        label: string;
        type: 'confidential' | 'internal' | 'restricted' | 'public';
    };
    ragQueries: number;
    helpfulness: string;
}

export interface ActivityFeedDto {
    id: string | number;
    iconType: 'file' | 'ai' | 'access' | 'alert';
    actorName: string;
    action: string;
    targetName: string;
    meta: string;
    isWarning?: boolean;
}

export interface DailyQueryStatDto {
    date: string;
    queries: number;
    latency: number;
}

export interface DashboardStatsDto {
    totalFiles: number;
    aiIndexedFiles: number;
    totalStorage: string;
    usedStorageGb: number;
    storageQuotaGb: number;
    totalFolders: number;
    totalDepartments: number;
    totalUsers: number;
    aiQueriesToday: number;
    queriesYesterday: number;
    queriesGrowthPercent: number | null;
    totalAiQueries: number;
    ragAccuracy: number | null;
    averageLatencyMs: number | null;
    qdrantStatus: string;
    userSatisfactionRate: number | null;
    totalChunksIndexed: number;
    monthlyTokensUsed: number;
    formatStats: FormatStatDto[];
    topDocuments: TopDocDto[];
    recentActivities: ActivityFeedDto[];
    dailyStats: DailyQueryStatDto[];
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

