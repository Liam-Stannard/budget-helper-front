import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  URL_ACCOUNT_BASE,
  URL_ACCOUNT_BY_ID,
} from './account-api.service.constants';
import {
  IAccount,
  IGetAccountResponse,
  IGetAccountListResponse,
  IPostPutAccountResponse,
} from '../shared/account.interface';

@Injectable({
  providedIn: 'root',
})
export class AccountApiService {
  constructor(private httpClient: HttpClient) {}

  getAccountList(): Observable<IGetAccountListResponse> {
    return this.httpClient.get<IGetAccountListResponse>(
      `${URL_ACCOUNT_BASE}`
    );
  }

  getAccount(id: string): Observable<IGetAccountResponse> {
    return this.httpClient.get<IGetAccountResponse>(
      `${URL_ACCOUNT_BY_ID}${id}`
    );
  }

  deleteAccount(id: number): Observable<any> {
    return this.httpClient.delete<any>(`${URL_ACCOUNT_BY_ID}${id}`);
  }

  putAccount(
    id: string,
    account: IAccount
  ): Observable<IPostPutAccountResponse> {
    return this.httpClient.put<any>(`${URL_ACCOUNT_BY_ID}${id}`, account);
  }

  postAccount(account: IAccount): Observable<IPostPutAccountResponse> {
    return this.httpClient.post<any>(URL_ACCOUNT_BASE, account);
  }
}
