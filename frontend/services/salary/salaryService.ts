import { PageResponse } from "@/models/page/pageResponse";
import { SalaryCreateRequest, SalaryDetailResponse } from "@/models/salary/salary";
import apiClient from "@/utils/api/apiClient";

class SalaryService {
    private managementUrl: string;
    private employeeUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/salaries";
        this.employeeUrl = "http://localhost:8080/api/employee/salaries";
    }

    public async getSalaries(params: {
        keyword?: string;
        email?: string;
        branchId?: number;
        departmentId?: number;
        positionId?: number;
        active?: boolean;
        page: number;
        size: number;
    }): Promise<PageResponse<SalaryDetailResponse>> {
        const query = new URLSearchParams();
        if (params.keyword) query.append('keyword', params.keyword);
        if (params.email) query.append('email', params.email);
        if (params.branchId) query.append('branchId', String(params.branchId));
        if (params.departmentId) query.append('departmentId', String(params.departmentId));
        if (params.positionId) query.append('positionId', String(params.positionId));
        if (params.active !== undefined) query.append('active', String(params.active));
        query.append('page', String(params.page));
        query.append('size', String(params.size));

        const response = await apiClient.get(`${this.managementUrl}?${query.toString()}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }


    public async createSalary(salary:SalaryCreateRequest):Promise<void>{
        const response = await apiClient.post(`${this.managementUrl}`,JSON.stringify(salary))
        if(!response.ok){
            throw response;
        }
        
    }

    public async getById(id:number):Promise<SalaryDetailResponse>{
        const response = await apiClient.get(`${this.managementUrl}/${id}`);
        if(response.ok){
            return await response.json();
        }
        throw response;
    }

    public async getByEmployeeId(employeeId:number):Promise<SalaryDetailResponse[]>{
        const response = await apiClient.get(`${this.managementUrl}/employee/${employeeId}`);
          if(response.ok){
            return await response.json();
        }
        throw response;
    }

}
export default new SalaryService();