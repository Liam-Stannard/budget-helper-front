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
  totalElements: number;
  totalPages: number;
};

export type ITransactionListParams = {
  /** Inclusive lower bound on `date`, `YYYY-MM-DD`. Omit for unbounded. */
  from?: string;
  /** Inclusive upper bound on `date`, `YYYY-MM-DD`. Omit for unbounded. */
  to?: string;
  /** 0-based. */
  page?: number;
  size?: number;
  /** `"<field>,<direction>"`, e.g. `"date,desc"`. */
  sort?: string;
  /** Filters to a single category. Omit for all categories. */
  category?: Category;
  /** Filters to a single account. Omit for all accounts. 403 if it belongs to another
   * user, 404 if it doesn't exist. */
  accountId?: number;
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
