type ProvinceResponse = {
  id: number;
  name: string;
  countryId: number;
  countryName:string;
  type: string;
};

type ProvinceCreateRequest = {
  name: string;
  countryId: number;
  type:string;
};