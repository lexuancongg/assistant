import { DepartmentCreateRequest, Department } from "@/models/department/department";
import { PageResponse } from "@/models/page/pageResponse";
import apiClient from "@/utils/api/apiClient";

class DepartmentService {
    private managementUrl: string;
    private employeeUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/departments";
        this.employeeUrl = "http://localhost:8080/api/employee/departments";
    }

    public async getDepartments(pageIndex: number, keyword: string, branchId?: number): Promise<PageResponse<Department>> {
        const params = new URLSearchParams();
        params.append('pageIndex', pageIndex.toString());
        params.append('keyword', keyword);
        if (branchId) params.append('branchId', branchId.toString());
        const response = await apiClient.get(`${this.managementUrl}?${params.toString()}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async createDepartment(department:DepartmentCreateRequest):Promise<Department>{
        const response = await apiClient.post(this.managementUrl,JSON.stringify(department))
        if(response.ok){
            return await response.json();
        }
        throw response;
    }

    public async updateDepartment(id:number,department:DepartmentCreateRequest):Promise<void>{
        const response  =  await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(department));
        if(!response.ok){
            throw response;
        }
    }

    public async deleteDepartment(id:number):Promise<void>{
        const response = await apiClient.delete(`${this.managementUrl}/${id}`);
        if(!response.ok){
            throw response;
        }
    }

    public async getDepartmentByBranch(branchId:number):Promise<Department[]>{
        const response = await apiClient.get(`${this.employeeUrl}/${branchId}`);
        if(response.ok){
            return await response.json()
        }
        throw response;
    }
}

export default new DepartmentService();