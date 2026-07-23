import {ChatRequest, ChatSession, MessageAnswer} from "@/models/chat-message/chat";
import apiClient from "@/utils/api/apiClientFixed";

class ChatService{
    private managementUrl: string;
    private employeeUrl:string;
    constructor() {
        this.managementUrl = "http://localhost:8080/api/v1/chat-sessions"
        this.employeeUrl =  "http://localhost:8080/api/employee/branchs"
    }

    public async getChatSession(documentId: number): Promise<ChatSession> {
        const response = await apiClient.get(
            `${this.managementUrl}/document/${documentId}`
        );

        if (response.ok) {
            return await response.json();
        }

        throw response;
    }

    public async ask(chatRequest:ChatRequest):Promise<MessageAnswer>{
        const response = await  apiClient.post(`${this.managementUrl}/ask`,JSON.stringify(chatRequest));
        if(response.ok){
            return  await  response.json()
        }
        throw  response;
    }



}
export  default new ChatService();