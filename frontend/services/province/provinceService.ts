import apiClient from "@/utils/api/apiClient";
import { PageResponse } from "@/models/page/pageResponse";
import { AArrowUp } from "lucide-react";

class ProvinceService {
    private managementUrl: string;
    private employeeUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/provinces"
        this.employeeUrl = "http://localhost:8080/api/employee/provinces"
    }

    public async getProvinces(pageIndex: number, keyword: string, countryId: number | undefined): Promise<PageResponse<ProvinceResponse>> {
        const params = new URLSearchParams();
        params.append("pageIndex", pageIndex.toString());
        params.append("keyword", keyword);

        if (countryId !== undefined) {
            params.append("countryId", countryId.toString());
        }

        const response = await apiClient.get(`${this.managementUrl}?${params.toString()}`);

        if (response.ok) {
            return await response.json();
        }
        throw response;

    }

    public async createProvince(province: ProvinceCreateRequest): Promise<ProvinceResponse> {
        const response = await apiClient.post(this.managementUrl, JSON.stringify(province));
        if (response.ok) {
            return await response.json();
        }
        throw response;

    }

    public async deleteProvince(id: number): Promise<void> {
        const response = await apiClient.delete(`${this.managementUrl}/${id}`);
        if (!response.ok) {
            throw response;
        }
    }


    public async updateProvince(id: number, province: ProvinceCreateRequest): Promise<void> {
        const response = await apiClient.put(`${this.managementUrl}/${id}`, JSON.stringify(province));
        if (!response.ok) {
            throw response;
        }
    }

    public async getProvinceByCountry(id:number):Promise<ProvinceResponse[]>{
        const response = await apiClient.get(`${this.managementUrl}/${id}`);
        if(response.ok){
            return await response.json();
        }
        throw response;
    }



}

export default new ProvinceService();