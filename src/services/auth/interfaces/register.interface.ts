export interface IRegisterRequest {
  username: string;
  password: string;
}

export interface IRegisterResponse {
  access: string;
  refresh: string;
}
