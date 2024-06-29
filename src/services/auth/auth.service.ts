import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_AUTHENTICATE, URL_REGISTER } from './constants/auth.constants';
import {
  IRegisterRequest,
  IRegisterResponse,
} from './interfaces/register.interface';
import { Observable } from 'rxjs';
import {
  IAuthenticateRequest,
  IAuthenticateResponse,
} from './interfaces/authenticate.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private httpClient: HttpClient) {}

  public register(
    registerRequest: IRegisterRequest
  ): Observable<IRegisterResponse> {
    return this.httpClient.post<IRegisterResponse>(
      URL_REGISTER,
      registerRequest
    );
  }

  public authenticate(
    authenticateRequest: IAuthenticateRequest
  ): Observable<IAuthenticateResponse> {
    return this.httpClient.post<IAuthenticateResponse>(
      URL_AUTHENTICATE,
      authenticateRequest
    );
  }
}
