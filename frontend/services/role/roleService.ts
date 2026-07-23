import { Role } from "@/models/role/role";
import apiClient from "@/utils/api/apiClientFixed";

class RoleService {
    private managementUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/roles"
    }

    public async getAllRoles():Promise<Role[]>{
        const response = await apiClient.get(this.managementUrl)
        if(response.ok){
            return await response.json();
        }
        throw response;
    }
}

export default new RoleService();