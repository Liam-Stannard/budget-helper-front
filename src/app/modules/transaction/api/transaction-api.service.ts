import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  URL_TRANSACTION_BASE,
  URL_TRANSACTION_BY_ID,
} from './transaction-api.service.constants';
import {
  ITransaction,
  IGetTransactionResponse,
  IGetTransactionListResponse,
  IPostPutTransactionResponse,
} from '../shared/transaction.interface';

@Injectable({
  providedIn: 'root',
})
export class TransactionApiService {
  constructor(private httpClient: HttpClient) {}

  getTransactionList(): Observable<IGetTransactionListResponse> {
    return this.httpClient.get<IGetTransactionListResponse>(
      `${URL_TRANSACTION_BASE}`
    );
  }

  getTransaction(id: string): Observable<IGetTransactionResponse> {
    return this.httpClient.get<IGetTransactionResponse>(
      `${URL_TRANSACTION_BY_ID}${id}`
    );
  }

  deleteTransaction(id: number): Observable<any> {
    return this.httpClient.delete<any>(`${URL_TRANSACTION_BY_ID}${id}`);
  }

  putTransaction(
    id: string,
    transaction: ITransaction
  ): Observable<IPostPutTransactionResponse> {
    return this.httpClient.put<any>(
      `${URL_TRANSACTION_BY_ID}${id}`,
      transaction
    );
  }

  postTransaction(
    transaction: ITransaction
  ): Observable<IPostPutTransactionResponse> {
    return this.httpClient.post<any>(URL_TRANSACTION_BASE, transaction);
  }
}
