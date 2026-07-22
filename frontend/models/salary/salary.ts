export type SalaryDetailResponse = {
  id: number;
  employeeId: number;
  employeeName: string;
  branchName: string;
  departmentName: string;
  positionName: string;
  email: string;
  baseSalary: number;               
  allowance: number;               
  socialInsurance: number;          
  healthInsurance: number;      
  unemploymentInsurance: number;    
  effectiveDate: string;            
  active: boolean;
  note: string;
  endDate:string;
};



export type SalaryCreateRequest = {
  baseSalary: number;
  effectiveDate: string;
  note?: string;
  allowance?: number;
  employeeId: number;
};