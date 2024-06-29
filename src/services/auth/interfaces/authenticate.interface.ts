export interface IAuthenticateRequest {
  username: string;
  password: string;
}

export interface IAuthenticateResponse {
  access: string;
  refresh: string;
}
