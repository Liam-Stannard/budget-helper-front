import dayjs from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { Category } from '../transaction/shared/transaction.types';

export interface ICategoryAmount {
  category: Category;
  amount: number;
}

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

export interface IDailyCumulativeAmount {
  /** 1-based day of month. */
  day: number;
  /** `YYYY-MM-DD`. */
  date: string;
  /** Running total of `amount` across days 1..`day` of the month. */
  cumulativeAmount: number;
}

/** Builds a day-by-day running total for a single month, from day 1 through `throughDay`
 * (inclusive) — pass the full day count of the month for a complete month, or today's
 * day-of-month for a month that's still in progress. Keeps one entry per day (rather than
 * collapsing straight to a plotted line) so a day can still be looked up individually later. */
export function getDailyCumulativeSpend(
  transactions: ITransaction[],
  monthStart: dayjs.Dayjs,
  throughDay: number
): IDailyCumulativeAmount[] {
  const amountByDay = new Map<number, number>();

  for (const transaction of transactions) {
    const day = dayjs(transaction.date).date();
    amountByDay.set(day, (amountByDay.get(day) ?? 0) + Number(transaction.amount));
  }

  const series: IDailyCumulativeAmount[] = [];
  let runningTotal = 0;

  for (let day = 1; day <= throughDay; day++) {
    runningTotal += amountByDay.get(day) ?? 0;
    series.push({
      day,
      date: monthStart.date(day).format('YYYY-MM-DD'),
      cumulativeAmount: runningTotal,
    });
  }

  return series;
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
