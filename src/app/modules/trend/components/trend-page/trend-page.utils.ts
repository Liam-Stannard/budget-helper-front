import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { Category } from '../../../transaction/shared/transaction.types';

/** Excludes INCOME transactions - the "total spend" summary is meant to answer "how much did
 * I spend in this range," and an income transaction isn't spend. */
export function filterExpenses(transactions: ITransaction[]): ITransaction[] {
  return transactions.filter((transaction) => transaction.category !== 'INCOME');
}

/** Filters to the given categories. An empty `categories` array is treated as "no filter" (all
 * categories), matching a multi-select where nothing checked means nothing excluded - not that
 * everything is excluded. */
export function filterByCategories(
  transactions: ITransaction[],
  categories: Category[]
): ITransaction[] {
  if (categories.length === 0) {
    return transactions;
  }

  return transactions.filter((transaction) =>
    categories.includes(transaction.category)
  );
}

/** Computes the "total spend" for the summary tile. When no category filter is explicitly
 * applied, INCOME is excluded by default (spend answers "how much did I spend," and income
 * isn't spend). When the user HAS explicitly selected one or more categories, their selection
 * is respected as-is - e.g. explicitly filtering to INCOME should count it toward the total,
 * rather than having it silently stripped back out again. */
export function getTotalSpend(
  filteredTransactions: ITransaction[],
  appliedCategories: Category[]
): number {
  const transactions =
    appliedCategories.length === 0
      ? filterExpenses(filteredTransactions)
      : filteredTransactions;

  return getTotalAmount(transactions);
}

export function getTotalAmount(transactions: ITransaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0
  );
}
