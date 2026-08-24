export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface IRegisterRequest {
  username: string;
  role: Role;
  email: string;
  password: string;
}

export interface IRegisterResponse {
  access: string;
  refresh: string;
}
