import apiClient from "@/utils/api/apiClientFixed";

export interface MonthlyTotalDto {
    period?: string;
    ds?: string;
    totalValue?: number;
    y?: number;
    count?: number;
    lower?: number;
    upper?: number;
}

export interface ForecastResponseDto {
    history: MonthlyTotalDto[];
    forecast: MonthlyTotalDto[];
}

class AnalyticsService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/analytics";
    }

    public async getContractMonthlyTotals(monthsBack: number = 24): Promise<MonthlyTotalDto[]> {
        const resp = await apiClient.get(`${this.baseUrl}/contracts/monthly-totals?monthsBack=${monthsBack}`);
        if (resp.ok) return await resp.json();
        throw resp;
    }

    public async getForecast(monthsBack: number = 24, horizon: number = 6): Promise<ForecastResponseDto> {
        const resp = await apiClient.get(`${this.baseUrl}/contracts/forecast?monthsBack=${monthsBack}&horizon=${horizon}`);
        if (resp.ok) return await resp.json();
        throw resp;
    }
}

export default new AnalyticsService();
