import { AuthenticatedUserResponse } from './AuthenticatedUserResponse';

export type AuthStateResponse = {
  isAuthenticated: boolean;
  authenticatedUser: AuthenticatedUserResponse ;
};