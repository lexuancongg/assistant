import { DistrictCreateRequest, DistrictResponse } from "@/models/district/district";
import { PageResponse } from "@/models/page/pageResponse";
import apiClient from "@/utils/api/apiClient";

class  DistrictService {
    private managementUrl:string;
    private employeeUrl:string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/districts";
        this.employeeUrl = "http://localhost:8080/api/employee/districts";
    }

    public async getDistricts(keyword:string,pageIndex:number,countryId?:number,provinceId?:number):Promise<PageResponse<DistrictResponse>>{
         const params = new URLSearchParams();
        params.append('pageIndex', pageIndex.toString());
        params.append('keyword', keyword);
        if (countryId) params.append('countryId', countryId.toString());
        if (provinceId) params.append('provinceId', provinceId.toString());

        const response = await apiClient.get(`${this.managementUrl}?${params.toString()}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;
    }


    public async createDistrict(district:DistrictCreateRequest):Promise<DistrictResponse>{
        const response  = await apiClient.post(this.managementUrl,JSON.stringify(district));
        if (response.ok) {
            return await response.json();
        }
        throw response;

    }

    public async updateDistrict(id:number,district:DistrictCreateRequest):Promise<void>{
        const response  = await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(district));
        if(!response.ok){
            throw response;
        }

    }

    public async getDistrictByProvince(id:number):Promise<DistrictResponse[]>{
        const response  = await apiClient.get(`${this.managementUrl}/${id}`);
        if(response.ok){
            return await response.json();
        }
        throw response;
        
    }
}
export default new DistrictService();