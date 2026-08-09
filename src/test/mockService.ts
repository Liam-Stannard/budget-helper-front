import { Signal, signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import {
  IGetTransactionResponse,
  IGetTransactionListResponse,
  ITransaction,
} from '../app/modules/transaction/api/interfaces/transaction.interface';
import {
  HttpResult,
  TransactionApiService,
} from '../app/modules/transaction/api/transaction-api.service';
import { toSignal } from '@angular/core/rxjs-interop';

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: 'test',
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

const getTransactionsResponse: IGetTransactionListResponse = {
  transactionList: [transaction1],
};

const getTransactionResponse: IGetTransactionResponse = {
  transaction: transaction1,
};

export class MockAuthService {
  authenticate = of(true);
  isLoggedIn = jest.fn(() => true);
}

export class MockApiService {
  transactions: Signal<IGetTransactionListResponse> =
    signal<IGetTransactionListResponse>(getTransactionsResponse);

  transactionsError: Signal<string | undefined> = signal(undefined);

  transactionsResult = signal<HttpResult<IGetTransactionListResponse>>({
    data: getTransactionsResponse,
    error: undefined,
  });
}
