export enum JobTitleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type JobTitle = {
  id: number;
  name: string;
  description: string;
  status: JobTitleStatus;
};