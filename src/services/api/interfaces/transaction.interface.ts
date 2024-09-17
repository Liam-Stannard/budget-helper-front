export interface ITransactionsResponse {
  expenses: ITransaction[];
}

export interface ITransaction {
  id: number;
  title: string;
  amount: string;
  date: string;
  category: string;
  account: string;
}
