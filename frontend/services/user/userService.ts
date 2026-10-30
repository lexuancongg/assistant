import apiClient from "@/utils/api/apiClientFixed";

export interface UserDto {
    id: number | string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatarInitial: string;
    avatarUrl?: string;
    departmentName?: string;
    departmentId?: number | string;
}

export interface UserCreateDto {
    name: string;
    email: string;
    password: string;
    role: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateProfileDto {
    name?: string;
    avatarUrl?: string;
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

    public async getProfile(): Promise<UserDto> {
        const response = await apiClient.get(`${this.baseUrl}/profile`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async updateProfile(data: UpdateProfileDto): Promise<UserDto> {
        const response = await apiClient.put(`${this.baseUrl}/profile`, JSON.stringify(data));
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post(`${this.baseUrl}/profile/avatar`, formData);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }

    public async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
        const response = await apiClient.post(`${this.baseUrl}/profile/change-password`, JSON.stringify(data));
        if (response.ok) {
            return await response.json();
        }
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || "Đổi mật khẩu thất bại");
    }
}

export default new UserService();

