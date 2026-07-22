import { Employee, EmployeeCreateRequest, EmployeeDetail, EmployeeDetailResponse, EmployeeField } from "@/models/employee/employee";
import { PageResponse } from "@/models/page/pageResponse";
import apiClient from "@/utils/api/apiClient";

class EmployeeService {
  private managementUrl: string;
  private employeeUrl: string;

  constructor() {
    this.managementUrl = "http://localhost:8080/api/management/employees";
    this.employeeUrl = "http://localhost:8080/api/employee/employees";
  }

  public async getEmployees(
    name?: string,
    code?: string,
    email?: string,
    departmentId?: number,
    branchId?: number,
    positionId?: number,
    status?: string,
    hireDateFrom?: Date,
    hireDateTo?: Date,
    pageIndex: number = 0,
    pageSize: number = 10,
    sortBy: string = "id",
    sortDir: "asc" | "desc" = "desc"
  ): Promise<PageResponse<Employee>> {
    const params = new URLSearchParams();

    params.append("pageIndex", pageIndex.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortDir", sortDir);

    if (name) params.append("name", name);
    if (code) params.append("code", code);
    if (email) params.append("email", email);
    if (departmentId) params.append("departmentId", departmentId.toString());
    if (branchId) params.append("branchId", branchId.toString());
    if (positionId) params.append("positionId", positionId.toString());
    if (status) params.append("status", status);
    if (hireDateFrom) params.append("hireDateFrom", hireDateFrom.toISOString());
    if (hireDateTo) params.append("hireDateTo", hireDateTo.toISOString());

    const response = await apiClient.get(`${this.managementUrl}?${params.toString()}`);
    if (response.ok) {
      return await response.json();
    }
    throw response;
  }


  public async createEmployee(employee:EmployeeField):Promise<Employee>{
    const response = await apiClient.post(this.managementUrl,JSON.stringify(employee));
    if(response.ok){
      return await response.json()
    }
    throw response;

  }

  public async getDetailEmployee(id:number):Promise<EmployeeDetail>{
    const response = await apiClient.get(`${this.managementUrl}/${id}`);
    if(response.ok){
      return await response.json();
    }
    throw response;
  }

  public async updateEmployee(id:number,employee:EmployeeCreateRequest):Promise<void>{
    const response = await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(employee));
    if(!response.ok){
      throw response;
    }
  }

  public async deleteEmployee(id:number):Promise<void>{
    const response = await apiClient.delete(`${this.managementUrl}/${id}`);
    if(!response.ok){
      throw response;
    }
  }

  public async getEmployeeBySearch(keyword:string):Promise<Employee[]>{
    const response = await apiClient.get(
    `${this.managementUrl}/search?keyword=${keyword}`
  );

    if(response.ok){
      return await response.json();
    }
    throw response;
  }
}

export default new EmployeeService();