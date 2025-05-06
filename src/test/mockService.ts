import { Signal, signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import {
  IGetTransactionResponse,
  IGetTransactionsResponse,
  ITransaction,
} from '../app/component/transaction/api/interfaces/transaction.interface';
import {
  HttpResult,
  TransactionApiService,
} from '../app/component/transaction/api/transaction-api.service';
import { toSignal } from '@angular/core/rxjs-interop';

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: 'test',
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

const getTransactionsResponse: IGetTransactionsResponse = {
  transactions: [transaction1],
};

const getTransactionResponse: IGetTransactionResponse = {
  transaction: transaction1,
};

export class MockAuthService {
  authenticate = of(true);
  isLoggedIn = jest.fn(() => true);
}

export class MockApiService {
  transactions: Signal<IGetTransactionsResponse> =
    signal<IGetTransactionsResponse>(getTransactionsResponse);

  transactionsError: Signal<string | undefined> = signal(undefined);

  transactionsResult = signal<HttpResult<IGetTransactionsResponse>>({
    data: getTransactionsResponse,
    error: undefined,
  });
}
