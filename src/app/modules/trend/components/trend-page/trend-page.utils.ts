import { ITransaction } from '../../../transaction/shared/transaction.interface';

/** Excludes INCOME transactions - the "total spend" summary is meant to answer "how much did
 * I spend in this range," and an income transaction isn't spend. */
export function filterExpenses(transactions: ITransaction[]): ITransaction[] {
  return transactions.filter((transaction) => transaction.category !== 'INCOME');
}

export function getTotalAmount(transactions: ITransaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0
  );
}
