import apiClient from "@/utils/api/apiClientFixed";

export interface DepartmentMemberDto {
    userId: number | string;
    name: string;
    email: string;
    role: string;
}

export interface DepartmentDto {
    id: number | string;
    name: string;
    members: DepartmentMemberDto[];
}

class DepartmentService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/departments";
    }

    public async getDepartments(): Promise<DepartmentDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async createDepartment(name: string): Promise<DepartmentDto> {
        const response = await apiClient.post(this.baseUrl, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async updateDepartmentName(deptId: number | string, name: string): Promise<DepartmentDto> {
        const response = await apiClient.put(`${this.baseUrl}/${deptId}`, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async addMember(deptId: number | string, userId: number | string): Promise<DepartmentDto> {
        const response = await apiClient.post(`${this.baseUrl}/${deptId}/members`, JSON.stringify({ userId }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async removeMember(deptId: number | string, userId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${deptId}/members/${userId}`);
        if (!response.ok) {
            throw response;
        }
    }

    public async deleteDepartment(deptId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${deptId}`);
        if (!response.ok) {
            throw response;
        }
    }
}

export default new DepartmentService();
