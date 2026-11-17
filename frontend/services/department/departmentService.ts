import apiClient, { API_ROOT } from "@/utils/api/apiClientFixed";
import { extractApiError } from "@/utils/api/errorHelper";

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
        this.baseUrl = `${API_ROOT}/api/v1/departments`;
    }

    public async getDepartments(): Promise<DepartmentDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Yêu cầu thất bại");
    }

    public async createDepartment(name: string): Promise<DepartmentDto> {
        const response = await apiClient.post(this.baseUrl, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Yêu cầu thất bại");
    }

    public async updateDepartmentName(deptId: number | string, name: string): Promise<DepartmentDto> {
        const response = await apiClient.put(`${this.baseUrl}/${deptId}`, JSON.stringify({ name }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Yêu cầu thất bại");
    }

    public async addMember(deptId: number | string, userId: number | string): Promise<DepartmentDto> {
        const response = await apiClient.post(`${this.baseUrl}/${deptId}/members`, JSON.stringify({ userId }));
        if (response.ok) {
            return await response.json();
        }
        throw await extractApiError(response, "Yêu cầu thất bại");
    }

    public async removeMember(deptId: number | string, userId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${deptId}/members/${userId}`);
        if (!response.ok) {
            throw await extractApiError(response, "Yêu cầu thất bại");
        }
    }

    public async deleteDepartment(deptId: number | string): Promise<void> {
        const response = await apiClient.delete(`${this.baseUrl}/${deptId}`);
        if (!response.ok) {
            throw await extractApiError(response, "Yêu cầu thất bại");
        }
    }
}

export default new DepartmentService();
