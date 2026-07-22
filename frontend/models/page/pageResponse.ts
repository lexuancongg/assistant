export type PageResponse<T> = {
  data: T[];
  totalElements: number;
  totalPages: number;
  isLast: boolean;
};