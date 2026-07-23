export type LoginResponse = {
  id?: number;
  username?: string;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  role?: string | null;
}