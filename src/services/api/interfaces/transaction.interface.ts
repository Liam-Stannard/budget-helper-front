export interface IBaseTransaction {
  title: string;
  amount: string;
  date: string;
  category: string;
  account: string;
}
export interface ITransaction extends IBaseTransaction {
  id: number;
}

export interface IGetTransactionsResponse {
  transactions: ITransaction[];
}
export interface IGetTransactionResponse {
  transaction: ITransaction;
}

export interface IPutTransactionRequest {
  transaction: ITransaction;
}

export interface IPostTransactionRequest {
  transaction: IBaseTransaction;
}

export interface IPostPutTransactionResponse {
  transaction: ITransaction;
}
