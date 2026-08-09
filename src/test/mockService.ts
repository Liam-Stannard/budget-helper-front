import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  IGetTransactionResponse,
  IGetTransactionListResponse,
  IPostPutTransactionResponse,
  ITransaction,
} from '../app/modules/transaction/shared/transaction.interface';

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

const postPutTransactionResponse: IPostPutTransactionResponse = {
  transaction: transaction1,
};

export class MockAuthService {
  authenticate = of(true);
  isLoggedIn = jest.fn(() => true);
  loggedIn = signal(true);
}

export class MockApiService {
  getTransactionList = jest.fn(() => of(getTransactionsResponse));
  getTransaction = jest.fn(() => of(getTransactionResponse));
  putTransaction = jest.fn(() => of(postPutTransactionResponse));
  postTransaction = jest.fn(() => of(postPutTransactionResponse));
  deleteTransaction = jest.fn(() => of(undefined));
}
