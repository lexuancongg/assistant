import apiClient from "@/utils/api/apiClientFixed";
import { PageResponse } from "@/models/page/pageResponse";
import { Position, PositionCreateRequest } from "@/models/positions/position";

class positionService {
    private managementUrl: string;
    private employeeUrl : string;
    constructor() {
        this.employeeUrl = "http://localhost:8080/api/employee/positions";
        this.managementUrl = "http://localhost:8080/api/management/positions";
    }

    public async getPositions(pageIndex:number,keyword:string): Promise<PageResponse<Position>> {
        const response = await apiClient.get(`${this.managementUrl}?pageIndex=${pageIndex}&keyword=${keyword}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;


    }

    public async createPosition(position: PositionCreateRequest): Promise<Position> {
        const response = await apiClient.post(this.managementUrl, JSON.stringify(position));
        if (response.ok) {
            return await response.json();
        }
        throw response;

    }
    public async deletePosition(id: number): Promise<Response> {
        return await apiClient.delete(this.managementUrl + `/${id}`);
    }

    public async updatePosition(id:number,position:PositionCreateRequest):Promise<void>{
        const response = await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(position))
        if(!response.ok){
        throw response;

        }

    }

    public async getPositionAlls():Promise<Position[]>{
        const response = await apiClient.get(this.employeeUrl);
        if(response.ok){
            return await response.json();
        }
        throw response;
    }

}

export default new positionService();