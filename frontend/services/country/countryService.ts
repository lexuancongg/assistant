import apiClient from "@/utils/api/apiClient";
import { PageResponse } from "@/models/page/pageResponse";
import { CountryCreateRequest, CountryResponse } from "@/models/country/countryResponse";

class CountryService{
    private managementUrl:string;
    private employeeUrl:string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/countries";
        this.employeeUrl = "http://localhost:8080/api/employee/countries";
    }

    public async getCountriesPaging(pageIndex:number,keyword:string):Promise<PageResponse<CountryResponse>>{
        const response = await apiClient.get(`${this.managementUrl}?pageIndex=${pageIndex}&keyword=${keyword}`);
        if(response.ok){
            return await response.json();
        }
        throw response;

    }


    public async createCountry(country:CountryCreateRequest):Promise<CountryResponse>{
        const response = await apiClient.post(this.managementUrl,JSON.stringify(country));
          if(response.ok){
            return await response.json();
        }
        throw response;


    }

    public async getCountries():Promise<CountryResponse[]>{
          const response = await apiClient.get(this.employeeUrl);
          if(response.ok){
            return await response.json();
        }
        throw response;
    }


    public async delete(id:number):Promise<void>{
        const response = await apiClient.delete(`${this.managementUrl}/${id}`)
        if(!response.ok){
            throw response;
        }
    }

    public async updateCountry(id:number,country:CountryCreateRequest):Promise<void>{
        const response = await apiClient.put(`${this.managementUrl}/${id}`,JSON.stringify(country));
         if(!response.ok){
            throw response;
        }
    }
   

}

export default new CountryService();