export type Position = {
  id: number;
  name: string;
  description:string;
  status:PositionStatus;
  level:number;
  inUse:number;
  code:string
};




export type PositionCreateRequest = {
  name: string;
  code: string;
  status: PositionStatus;
  description: string;
  levelOrder: number;
};

export enum PositionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type PositionField = {
  name:string,
  code:string,
  description:string,
  levelOrder:number,
  status :PositionStatus
}