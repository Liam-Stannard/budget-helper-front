import dayjs from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { Category } from '../transaction/shared/transaction.types';
import { CATEGORY_OPTIONS } from '../transaction/shared/transcations.constants';

export interface ICategoryAmount {
  category: Category;
  amount: number;
}

/** The fixed set of spend categories charted on the home screen — everything in the category
 * enum except INCOME, which isn't spend (see filterExpenses). */
const EXPENSE_CATEGORIES: Category[] = CATEGORY_OPTIONS.filter(
  (option) => option.value !== 'INCOME'
).map((option) => option.value);

export function filterCurrentMonth(
  transactions: ITransaction[]
): ITransaction[] {
  return transactions.filter((transaction) =>
    dayjs(transaction.date).isSame(dayjs(), 'month')
  );
}

export function filterPreviousMonth(
  transactions: ITransaction[]
): ITransaction[] {
  return transactions.filter((transaction) =>
    dayjs(transaction.date).isSame(dayjs().subtract(1, 'month'), 'month')
  );
}

/** The `from`/`to` bounds covering this month and last month, for scoping the home screen's
 * transaction fetch — it only ever needs these two months' data. */
export function currentAndPreviousMonthRange(): { from: string; to: string } {
  return {
    from: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD'),
  };
}

/** Excludes INCOME transactions — the stat tiles and category breakdown are meant to answer
 * "how much did I spend," and an income transaction isn't spend. */
export function filterExpenses(transactions: ITransaction[]): ITransaction[] {
  return transactions.filter((transaction) => transaction.category !== 'INCOME');
}

export function getTotalAmount(transactions: ITransaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0
  );
}

export function sumByCategory(transactions: ITransaction[]): ICategoryAmount[] {
  const amountByCategory = new Map<Category, number>();

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    amountByCategory.set(
      transaction.category,
      (amountByCategory.get(transaction.category) ?? 0) + amount
    );
  }

  return Array.from(amountByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getTopCategory(
  breakdown: ICategoryAmount[]
): ICategoryAmount | undefined {
  return breakdown[0];
}

export interface ICategoryComparison {
  category: Category;
  currentAmount: number;
  previousAmount: number;
}

/** Pairs this month's and last month's spend per category, zero-filling any category with no
 * spend in a given month so the two months' bars always line up — unlike sumByCategory, which
 * only includes categories actually present in its input. Expects both transaction lists to
 * already have INCOME filtered out (see filterExpenses). */
export function compareCategoriesByMonth(
  currentMonthExpenses: ITransaction[],
  previousMonthExpenses: ITransaction[]
): ICategoryComparison[] {
  const currentByCategory = new Map(
    sumByCategory(currentMonthExpenses).map((item) => [
      item.category,
      item.amount,
    ])
  );
  const previousByCategory = new Map(
    sumByCategory(previousMonthExpenses).map((item) => [
      item.category,
      item.amount,
    ])
  );

  return EXPENSE_CATEGORIES.map((category) => ({
    category,
    currentAmount: currentByCategory.get(category) ?? 0,
    previousAmount: previousByCategory.get(category) ?? 0,
  })).sort(
    (a, b) =>
      b.currentAmount + b.previousAmount - (a.currentAmount + a.previousAmount)
  );
}

export interface IMonthDelta {
  changeAmount: number;
  /** undefined when there's no previous-month total to compare against */
  changePercent?: number;
}

export function getMonthOverMonthDelta(
  currentTotal: number,
  previousTotal: number
): IMonthDelta {
  return {
    changeAmount: currentTotal - previousTotal,
    changePercent:
      previousTotal === 0
        ? undefined
        : ((currentTotal - previousTotal) / previousTotal) * 100,
  };
}
