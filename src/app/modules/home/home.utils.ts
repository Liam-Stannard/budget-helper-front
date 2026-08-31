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

export interface ISparklineBucket {
  amount: number;
  /** Whether this bucket counts as "current month" for coloring purposes. A bucket's ~2-5 day
   * span is always far shorter than a calendar month, so a bucket can only ever straddle the
   * previous/current month boundary once — checking whether the bucket's END falls on or after
   * the start of the current calendar month identifies exactly that straddling bucket (and every
   * later bucket, though there are none) as current-month, without needing to split a single
   * bucket's amount across two colors. This intentionally classifies the whole straddling bucket
   * as current-month rather than previous-month: it's the bucket "today" lives in, and any part
   * of it representing today's spend should read as current. */
  isCurrentMonth: boolean;
}

const SPARKLINE_BUCKET_COUNT = 12;

/** Buckets expense transactions into `bucketCount` equal-length time slices spanning the home
 * screen's whole fetch window — previous-month-start through today (see
 * currentAndPreviousMonthRange) — for the "Total this month" stat tile's sparkline. Callers
 * should pass already-expense-filtered transactions (see filterExpenses); INCOME isn't spend.
 * Degrades gracefully to a set of empty (0-amount) buckets when there are no transactions. */
export function getSparklineBuckets(
  transactions: ITransaction[],
  bucketCount: number = SPARKLINE_BUCKET_COUNT
): ISparklineBucket[] {
  const rangeStart = dayjs().subtract(1, 'month').startOf('month');
  const rangeEnd = dayjs().endOf('day');
  const rangeMs = Math.max(rangeEnd.diff(rangeStart), 1);
  const bucketMs = rangeMs / bucketCount;
  const currentMonthStart = dayjs().startOf('month');

  const buckets: ISparklineBucket[] = Array.from(
    { length: bucketCount },
    (_, index) => ({
      amount: 0,
      isCurrentMonth: !rangeStart
        .add(bucketMs * (index + 1), 'millisecond')
        .isBefore(currentMonthStart),
    })
  );

  for (const transaction of transactions) {
    const offsetMs = dayjs(transaction.date).diff(rangeStart);

    if (offsetMs < 0 || offsetMs > rangeMs) {
      continue;
    }

    const index = Math.min(Math.floor(offsetMs / bucketMs), bucketCount - 1);
    buckets[index].amount += Number(transaction.amount);
  }

  return buckets;
}
