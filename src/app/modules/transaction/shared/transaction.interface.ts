import { Category } from './transaction.types';
import { IAccount } from '../../account/shared/account.interface';

export type ITransaction = {
  id?: number;
  title: string;
  amount: string;
  date: string;
  category: Category;
  account: IAccount;
};

export type IGetTransactionListResponse = {
  transactionList: ITransaction[];
};
export type IGetTransactionResponse = {
  transaction: ITransaction;
};

export type IPutTransactionRequest = {
  transaction: ITransaction;
};

export type IPostTransactionRequest = {
  transaction: ITransaction;
};

export type IPostPutTransactionResponse = {
  transaction: ITransaction;
};
