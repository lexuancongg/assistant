import { JobTitle } from "@/models/jobtitle/jobtitle";
import apiClient from "@/utils/api/apiClientFixed";

class JobTitleService{
     private managementUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/management/job-titles";
    }

     public async getJobtitleByDepartment(departmentId:number): Promise<JobTitle[]> {
        const response = await apiClient.get(`${this.managementUrl}/${departmentId}`);
        if (response.ok) {
            return await response.json();
        }
        throw response;


    }
}

export default new JobTitleService();