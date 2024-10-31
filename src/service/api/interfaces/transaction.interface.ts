import { Category } from '../../../component/transaction/type/transaction.type';

export type IBaseTransaction = {
  title: string;
  amount: string;
  date: string;
  category: Category;
  account: string;
};

export type ITransaction = IBaseTransaction & {
  id: number;
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
  transaction: IBaseTransaction;
};

export type IPostPutTransactionResponse = {
  transaction: ITransaction;
};
