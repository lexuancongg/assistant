import { Level } from "@/models/level/level";
import apiClient from "@/utils/api/apiClientFixed";

class LevelService {
    private baseUrl:string
    constructor() {
        this.baseUrl = "http://localhost:8080/api/management/levels"
    }

    public async getAllLevels():Promise<Level[]>{
        const response = await apiClient.get(this.baseUrl);
        if(response.ok){
            return await response.json();
        }
        throw response;
    }

}

export default new LevelService();