import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  LOCAL_STORAGE_KEY_ACCESS,
  LOCAL_STORAGE_KEY_REFRESH,
  URL_AUTHENTICATE,
  URL_REGISTER,
} from './constants/auth.constants';
import {
  IRegisterRequest,
  IRegisterResponse,
} from './interfaces/register.interface';
import { Observable, tap } from 'rxjs';
import {
  IAuthenticateRequest,
  IAuthenticateResponse,
} from './interfaces/authenticate.interface';
import { jwtDecode } from 'jwt-decode';
import dayjs, { Dayjs } from 'dayjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public loggedIn = signal<boolean>(this.isLoggedIn());

  constructor(private httpClient: HttpClient, private router: Router) {}

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
    return this.httpClient
      .post<IAuthenticateResponse>(URL_AUTHENTICATE, authenticateRequest)
      .pipe(
        tap({
          next: (response) => this.storeTokens(response),
          error: (err) => {
            alert('Invalid user and password, please try again');
          },
        })
      );
  }

  public logout(): void {
    this.clearTokens();
    this.router.navigate(['login']);
  }

  public isLoggedIn(): boolean {
    const expriesAt = this.expriesAt();

    if (!expriesAt) {
      return false;
    }

    return dayjs().isBefore(expriesAt);
  }

  public expriesAt(): Dayjs | undefined {
    const access = this.getAccess();

    if (!access) {
      return undefined;
    }

    const exp = jwtDecode(access).exp;

    if (!exp) {
      return undefined;
    }

    return dayjs.unix(exp);
  }

  public getAccess(): string | undefined {
    return localStorage.getItem(LOCAL_STORAGE_KEY_ACCESS) || undefined;
  }

  public getRefresh(): string | undefined {
    return localStorage.getItem(LOCAL_STORAGE_KEY_REFRESH) || undefined;
  }

  private storeTokens(response: IAuthenticateResponse): void {
    if (response.access) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCESS, response.access);
    }

    if (response.refresh) {
      localStorage.setItem(LOCAL_STORAGE_KEY_REFRESH, response.refresh);
    }

    this.loggedIn.set(this.isLoggedIn());
  }

  public clearTokens(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACCESS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_REFRESH);

    this.loggedIn.set(false);
  }
}
