import { Image } from "@/models/image/image";
import apiClient from "@/utils/api/apiClient";

class ImageService {
      private managementUrl: string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/images"
    }

     public async uploadImageToS3(fromData:FormData): Promise<Image> {
        const response = await apiClient.post(this.managementUrl,fromData);
        if(response.ok){
            return await response.json();
        }
        throw response;

       

    }


}

export default new ImageService();