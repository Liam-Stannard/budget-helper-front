import { Category } from '../../type/transaction.type';

export type ITransaction = {
  id?: number;
  title: string;
  amount: string;
  date: string;
  category: Category;
  account: string;
};

export type IGetTransactionsResponse = {
  transactions: ITransaction[];
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
