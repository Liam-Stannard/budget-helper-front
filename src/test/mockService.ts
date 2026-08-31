import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  IGetTransactionResponse,
  IGetTransactionListResponse,
  IPostPutTransactionResponse,
  ITransaction,
} from '../app/modules/transaction/shared/transaction.interface';
import {
  IAccount,
  IGetAccountResponse,
  IGetAccountListResponse,
  IPostPutAccountResponse,
} from '../app/modules/account/shared/account.interface';

const account1: IAccount = {
  id: 1,
  name: 'Main',
};

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: account1,
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

const getTransactionsResponse: IGetTransactionListResponse = {
  transactionList: [transaction1],
  totalElements: 1,
  totalPages: 1,
};

const getTransactionResponse: IGetTransactionResponse = {
  transaction: transaction1,
};

const postPutTransactionResponse: IPostPutTransactionResponse = {
  transaction: transaction1,
};

export class MockAuthService {
  authenticate = jest.fn(() => of(true));
  register = jest.fn(() => of(true));
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

export class MockTransactionListAllService {
  getAllTransactions = jest.fn(() => of(getTransactionsResponse));
}

const getAccountsResponse: IGetAccountListResponse = {
  accountList: [account1],
};

const getAccountResponse: IGetAccountResponse = {
  account: account1,
};

const postPutAccountResponse: IPostPutAccountResponse = {
  account: account1,
};

export class MockAccountApiService {
  getAccountList = jest.fn(() => of(getAccountsResponse));
  getAccount = jest.fn(() => of(getAccountResponse));
  putAccount = jest.fn(() => of(postPutAccountResponse));
  postAccount = jest.fn(() => of(postPutAccountResponse));
  deleteAccount = jest.fn(() => of(undefined));
}
