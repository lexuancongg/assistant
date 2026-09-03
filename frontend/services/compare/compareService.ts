export interface DifferenceItemDto {
    clause: string;
    file1: string;
    file2: string;
    status: 'MODIFIED' | 'ADDED' | 'REMOVED' | string;
    risk: 'CAO' | 'TRUNG BÌNH' | 'THẤP' | string;
}

export interface CompareResponseDto {
    summary: string;
    similarityScore: number;
    riskLevel: 'THẤP' | 'TRUNG BÌNH' | 'CAO' | string;
    similarities: string[];
    differences: DifferenceItemDto[];
    recommendations: string[];
}

export interface CompareRequestDto {
    file1Name: string;
    file1Content?: string;
    file2Name: string;
    file2Content?: string;
    focusArea?: string;
}

class CompareService {
    private aiUrl = "http://127.0.0.1:8000/api/v1/compare";

    public async compare(req: CompareRequestDto): Promise<CompareResponseDto> {
        const resp = await fetch(this.aiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        if (resp.ok) return await resp.json();
        throw new Error("So sánh tài liệu thất bại");
    }
}

export default new CompareService();
