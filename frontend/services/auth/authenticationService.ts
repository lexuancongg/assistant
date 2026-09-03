import { LoginResponse } from "@/models/auth/loginResponse";
import { AuthRequest } from "@/models/auth/authRequest";
import apiClient from "@/utils/api/apiClientFixed";
import { AuthStateResponse } from "@/models/auth/AuthStateResponse";

class AuthenticationService{
    private baseUrl:string
    constructor() {
        // backend auth endpoints
        this.baseUrl = "http://localhost:8080/api/v1/auth"
    }

    public async login(authRequest : AuthRequest):Promise<LoginResponse>{
        const response = await apiClient.post(`${this.baseUrl}/login`,JSON.stringify(authRequest));
        if(response.ok){
            const json = await response.json();
            try{
                // store tokens for later requests (Authorization header is applied automatically by apiClient)
                if (typeof window !== 'undefined'){
                    if(json.accessToken) window.localStorage.setItem('accessToken', json.accessToken);
                    if(json.refreshToken) window.localStorage.setItem('refreshToken', json.refreshToken);
                    window.localStorage.setItem('authUsername', json.username ?? '');
                }
            }catch(e){
                console.warn('Cannot access localStorage', e);
            }
            return json;
        }
        throw response;
    }

    public async register(request: { username: string; password: string; email?: string }): Promise<LoginResponse> {
        const response = await apiClient.post(`${this.baseUrl}/register`, JSON.stringify(request));
        if (response.ok || response.status === 201) {
            const json = await response.json().catch(() => null);
            // register returns AuthResponse without tokens; do not store tokens automatically
            return json;
        }
        throw response;
    }

    public  async checkAuthenticated():Promise<AuthStateResponse>{
        const response = await apiClient.get(`${this.baseUrl}/me`);
        if(response.ok){
            return await response.json();
        }
        throw response;

    }

    public async logout(): Promise<void>{
        // attempt server-side logout to remove refresh tokens
        try{
            await apiClient.post(`${this.baseUrl}/logout`);
        }catch(e){
            // ignore network errors - still clear local state
            console.warn('Server logout failed', e);
        }

        try{
            if(typeof window !== 'undefined'){
                window.localStorage.removeItem('accessToken');
                window.localStorage.removeItem('refreshToken');
                window.localStorage.removeItem('authUsername');
            }
        }catch(e){
            console.warn('Cannot clear localStorage', e);
        }
    }

}

export default new AuthenticationService();