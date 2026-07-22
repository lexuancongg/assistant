 export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: number;
  code: string;
  name: string;
  branch: {
    name:string;
    id:number;
  };
  manager: {
    name: string;
    avatarUrl: string;
  };
  status: DepartmentStatus;
  description: string;
}




 export interface DepartmentCreateRequest {
   code: string;
   name: string;
   branchId: number;
   status: DepartmentStatus;
   description?: string;
   managerId?: number;
 }
