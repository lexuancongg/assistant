export type DistrictResponse = {
  id: number;
  name: string;
  provinceId: number;
  provinceName: string;
  countryId: number;
  countryName: string;
};


export type DistrictCreateRequest = {
  name: string;
  provinceId: number;
};

export type DistrictField = {
  name:string,
  provinceId: number;
  countryId:number;
  
}