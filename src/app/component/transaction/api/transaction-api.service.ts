import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import {
  URL_TRANSACTION_BASE,
  URL_TRANSACTION_BY_ID,
} from './constants/transaction-api.service.constants';
import {
  ITransaction,
  IGetTransactionResponse,
  IGetTransactionListResponse,
  IPostPutTransactionResponse,
} from './interfaces/transaction.interface';
import { toSignal } from '@angular/core/rxjs-interop';

export interface HttpResult<T> {
  data: T;
  error?: string;
}

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
