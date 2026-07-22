import { AddressCreateRequest, AddressResponse } from "../address/addressResponse";

export type Branch = {
  id: number;
  name: string;
  code:string;
  description:string;

  address: AddressResponse;
  status:BranchStatus
};

export  type BranchStatus = "ACTIVE"|"INACTIVE"






export type BranchCreateRequest = {
  name: string;
  code : string;
  description:string;
  status:BranchStatus;
  address: AddressCreateRequest;
};


export type AddressField = {
  countryId: number;
  provinceId: number;
  districtId: number;
  specificAddress: string;
};

export type BranchField = {
  name: string;
  code: string;
  status: BranchStatus;
  description: string;
  address: AddressField;
};