 export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: number | string;
  code: string;
  name: string;
  branch: {
    name:string;
    id: number | string;
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
   branchId: number | string;
   status: DepartmentStatus;
   description?: string;
   managerId?: number | string;
 }
