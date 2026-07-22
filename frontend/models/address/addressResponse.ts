export type AddressResponse = {
  id: number;
  countryId: number;
  countryName: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  specificAddress: string;
};




export type AddressCreateRequest = {
  countryId: number;
  provinceId: number;
  districtId: number;
  specificAddress: string;
};