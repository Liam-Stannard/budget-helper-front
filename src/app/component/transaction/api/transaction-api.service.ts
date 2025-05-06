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
  IGetTransactionsResponse,
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

  // SIGNALS - START

  private EMPTY_TRANSACTIONS: IGetTransactionsResponse = {
    transactions: [],
  };

  private transactionsResult = toSignal(this.getTransactions(), {
    initialValue: { data: this.EMPTY_TRANSACTIONS, error: undefined },
  });

  transactions = computed(() => this.transactionsResult().data.transactions);
  transactionsError = computed(() => this.transactionsResult().error);

  private getTransactions(): Observable<HttpResult<IGetTransactionsResponse>> {
    return this.httpClient
      .get<IGetTransactionsResponse>(URL_TRANSACTION_BASE + '12')
      .pipe(
        map((response) => this.createHttpResult(response)),
        shareReplay(1),
        catchError((error: HttpErrorResponse) =>
          of(this.createHttpResult(this.EMPTY_TRANSACTIONS, `${error.message}`))
        )
      );
  }

  private createHttpResult<T>(data: T, error?: string): HttpResult<T> {
    return {
      data,
      error,
    };
  }

  //SIGNALS - END

  //OLD

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
