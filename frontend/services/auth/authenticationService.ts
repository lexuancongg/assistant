import { LoginResponse } from "@/models/auth/loginResponse";
import { AuthRequest } from "@/models/auth/authRequest";
import apiClient from "@/utils/api/apiClient";
import { AuthStateResponse } from "@/models/auth/AuthStateResponse";

class AuthenticationService{
    private baseUrl:string
    constructor() {
        this.baseUrl = "http://localhost:8080/api/authentication"
    }

    public async login(authRequest : AuthRequest):Promise<LoginResponse>{
        const response = await apiClient.post(`${this.baseUrl}/login`,JSON.stringify(authRequest));
        if(response.ok){
            return await response.json();
        }
        throw response;
    }

    public  async checkAuthenticated():Promise<AuthStateResponse>{
        const response = await apiClient.get(this.baseUrl);
        if(response.ok){
            return await response.json();
        }
        throw response;

    }

}

export default new AuthenticationService();