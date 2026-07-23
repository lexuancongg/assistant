import { LoginResponse } from "@/models/auth/loginResponse";
import { AuthRequest } from "@/models/auth/authRequest";
import apiClient from "@/utils/api/apiClientFixed";
import { PageResponse } from "@/models/page/pageResponse";
import { BranchCreateRequest, Branch } from "@/models/branch/branch";
import { promises } from "dns";

class BranchService {
    private managementUrl: string;
    private employeeUrl:string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/branchs"
        this.employeeUrl =  "http://localhost:8080/api/employee/branchs"
    }

    public async getBranches(pageIndex: number, keyword: string, countryId?: number, provinceId?: number): Promise<PageResponse<Branch>> {
        const params = new URLSearchParams();
        params.append('pageIndex', pageIndex.toString());
        params.append('keyword', keyword);
        if (countryId) params.append('countryId', countryId.toString());
        if (provinceId) params.append('provinceId', provinceId.toString());

        const response = await apiClient.get(`${this.managementUrl}?${params.toString()}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;

    }

    public async createBranch(branch:BranchCreateRequest):Promise<void>{
        const response = await apiClient.post(this.managementUrl,JSON.stringify(branch))
        if(response.ok){
            return await response.json();
        }
        throw response;
    }


    public async updateBranch(branch:BranchCreateRequest,id:number):Promise<void>{
        const response = await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(branch))
        if(!response.ok){
            throw response;
        }
    }


    public async deleteBranch(id:number):Promise<void>{
        const response = await apiClient.delete(`${this.managementUrl}/${id}`);
        if(!response.ok){
            throw response;
        }
    }


    public async getAllBranch():Promise<Branch[]>{
        const response = await apiClient.get(this.employeeUrl);
        if(response.ok){
            return await response.json();
        }
        throw response;
    }
    

    public async getBranchById(id:number):Promise<Branch>{
        const response = await apiClient.get(`${this.managementUrl}/${id}`)
        if(response.ok){
            return await response.json();

        }
        throw response;
    }


}

export default new BranchService();