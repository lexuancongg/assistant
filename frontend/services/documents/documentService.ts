import apiClient from "@/utils/api/apiClient";

class DocumentService {
    private managementUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/v1/documents"
    }

    public async uploadDocumentToS3(fromData:FormData): Promise<any> {
        const response = await apiClient.post(this.managementUrl,fromData);
        if(!response.ok){
            throw  response;
        }

        return await response.json();
    }


}

export default new DocumentService();