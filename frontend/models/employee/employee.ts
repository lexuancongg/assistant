import { AddressCreateRequest, AddressResponse } from "../address/addressResponse";
import { Department } from "../department/department";
import { Image } from "../image/image";
import { Position } from "../positions/position";

export type EmployeeStatus = 'ACTIVE' | 'ONLEAVE' | 'PENDING';

export type Employee = {
  id: number;
  code: string;
  name: string;
  email: string;
  jobTitle: {
    name:string,
    id:number
  }
  status: EmployeeStatus;
  position: {
    name:string,
    id:number
  };
  department: {
    id:number,
    name:string
  };
  branch: {
    id:number,
    name:string
  };
  hireDate: string; 
  avatarUrl: string | null;
  level:{
    name:string,
    id:number
  }
};


export type EmployeeDetailResponse = {
  id: number
  name: string
  gender: string
  email: string
  phone: string
  birthday: string 
  hireDate: string 
  status: EmployeeStatus
  position: Position
  department: Department
  avatar: Image
  address?: AddressResponse
}


export type EmployeeField = {
  avatarId:number;
  code:string,
  name:string
  gender:string,
  birthday:Date,
  cccd:string,
  email:string,
  phone:string,
  status:EmployeeStatus,
  department:{
    id:number,
  }
  position:{
    id:number
  }
  jobTitle:{
    id:number
  },
  level:{
    id:number
  },
  hireDate:Date,
  address:{
    countryId:number,
    provinceId:number,
    districtId:number,
    specificAdress: string
  },
  account:{
    username:string,
    password:string,
    confirmPassword:string,
    roleId:number
  }
  branch:{
    id:number,
    name:string
  }


}

export type EmployeeDetail={
  avatarUrl:string;
  code:string,
  name:string
  gender:string,
  birthday:Date,
  cccd:string,
  email:string,
  phone:string,
  status:EmployeeStatus,
  department:{
    id:number,
  }
  position:{
    id:number
  }
  jobTitle:{
    id:number
  },
  level:{
    id:number
  },
  hireDate:Date,
  address:{
    countryId:number,
    provinceId:number,
    districtId:number,
    specificAdress: string
  },
  account:{
    username:string,
    password:string,
    confirmPassword:string,
    roleId:number
  },
  branch:{
    id:number,
  }
}

export type EmployeeCreateRequest = {
  name: string;
  gender: string; 
  email: string; 
  phone: string;
  birthday: string; 
  hireDate: string; 
  status?: EmployeeStatus;
  avatarId?: number;
  positionId: number;
  departmentId: number;
  // address: AddressCreateRequest



  //  countryId: number;
  // provinceId: number;
  // districtId: number;
  // specificAddress: string;
};

