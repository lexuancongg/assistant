import apiClient from "@/utils/api/apiClientFixed";

export interface UserDto {
    id: number | string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatarInitial: string;
    departmentName?: string;
    departmentId?: number | string;
}

export interface UserCreateDto {
    name: string;
    email: string;
    password: string;
    role: string;
}

class UserService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "http://localhost:8080/api/v1/users";
    }

    public async getUsers(): Promise<UserDto[]> {
        const response = await apiClient.get(this.baseUrl);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async createUser(data: UserCreateDto): Promise<UserDto> {
        const response = await apiClient.post(this.baseUrl, JSON.stringify(data));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async updateStatus(id: number | string, status: string): Promise<UserDto> {
        const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, JSON.stringify({ status }));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }
}

export default new UserService();
