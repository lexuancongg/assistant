import apiClient from "@/utils/api/apiClient";
import {DashboardStats, DocumentDetail, DocumentItem} from "@/models/docs/docs";

class DocService{
    private url : string;
    constructor() {
        this.url = "http://localhost:8080/api/v1/documents"
    }


    public async getDashboardStats():Promise<DashboardStats>{
        const response = await  apiClient.get(`${this.url}/stats`);
        if(response.ok){
            return  await  response.json();
        }
        throw  response;
    }

    public async getDocsPaging():Promise<DocumentItem[]>{
        const response = await apiClient.get(this.url);
        if(response.ok){
            return  await  response.json();
        }
        throw  response;

    }

    public async getDocDetail(id:number):Promise<DocumentDetail>{
        const response = await  apiClient.get(`${this.url}/${id}`);
        if(response.ok){
            return  await  response.json();
        }
        throw  response;
    }

}

export  default  new DocService();