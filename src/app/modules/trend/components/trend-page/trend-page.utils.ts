import dayjs, { Dayjs } from 'dayjs';
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

/** The set of transactions counted as "spend" for both the summary tile and the trend chart.
 * When no category filter is explicitly applied, INCOME is excluded by default (spend answers
 * "how much did I spend," and income isn't spend). When the user HAS explicitly selected one or
 * more categories, their selection is respected as-is - e.g. explicitly filtering to INCOME
 * should count it toward the total, rather than having it silently stripped back out again.
 * Shared by `getTotalSpend` and `bucketTransactions` so the chart's bucket totals always sum to
 * the same figure as the "Total spend" tile above it. */
export function getSpendTransactions(
  filteredTransactions: ITransaction[],
  appliedCategories: Category[]
): ITransaction[] {
  return appliedCategories.length === 0
    ? filterExpenses(filteredTransactions)
    : filteredTransactions;
}

/** Computes the "total spend" for the summary tile. */
export function getTotalSpend(
  filteredTransactions: ITransaction[],
  appliedCategories: Category[]
): number {
  return getTotalAmount(
    getSpendTransactions(filteredTransactions, appliedCategories)
  );
}

export function getTotalAmount(transactions: ITransaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0
  );
}

/** A single plotted point on the trend line chart - the total spend within one time bucket
 * (day/week/month, depending on the selected range's length - see `getBucketGranularity`). */
export interface ITrendBucket {
  /** Short, human-readable label for the bucket's start (e.g. "5 Jan" or "Mar 2024"), used for
   * axis labels/tooltips. */
  label: string;
  amount: number;
}

export type BucketGranularity = 'day' | 'week' | 'month';

/** Below this range length, bucket by day - the most granular useful view, and even at the top
 * of this range (90 days) the point count stays within the ~30-90 point band the chart targets
 * for readability. */
const DAILY_BUCKET_MAX_SPAN_DAYS = 90;

/** Below this range length, bucket by week instead of by day - keeps the point count in roughly
 * the same band (13 points at the low end, 90 at the high end) rather than the 91-630 daily
 * points a range this long would otherwise produce. */
const WEEKLY_BUCKET_MAX_SPAN_DAYS = 630;

/** Beyond the weekly threshold, fall back to bucketing by calendar month (1st-to-last-day of
 * each month, with the first and last buckets truncated to `from`/`to` - see `bucketIndex` and
 * `bucketStartDate`) - even a multi-year range stays readable this way (e.g. 5 years is 60
 * points). A custom range that long is an edge case for a personal-finance tool, so this isn't
 * tuned any further beyond "stays sane". */
export function getBucketGranularity(
  from: string | Date,
  to: string | Date
): BucketGranularity {
  const spanDays = dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day') + 1;

  if (spanDays <= DAILY_BUCKET_MAX_SPAN_DAYS) {
    return 'day';
  }

  if (spanDays <= WEEKLY_BUCKET_MAX_SPAN_DAYS) {
    return 'week';
  }

  return 'month';
}

function bucketIndex(
  date: Dayjs,
  rangeStart: Dayjs,
  granularity: BucketGranularity
): number {
  switch (granularity) {
    case 'day':
      return date.diff(rangeStart, 'day');
    case 'week':
      return Math.floor(date.diff(rangeStart, 'day') / 7);
    case 'month':
      // Calendar-month-aligned, not a uniform "30ish days" bucket: dayjs's own `diff(_, 'month')`
      // counts complete months based on day-of-month (e.g. Jun 15 -> Jul 10 is 0 months, not 1),
      // which would misattribute a transaction to the wrong labeled month. Counting whole
      // calendar months crossed between the two months (ignoring day-of-month entirely) instead
      // means every date in a given calendar month always lands in that month's bucket.
      return (date.year() - rangeStart.year()) * 12 + (date.month() - rangeStart.month());
  }
}

function bucketStartDate(
  rangeStart: Dayjs,
  index: number,
  granularity: BucketGranularity
): Dayjs {
  switch (granularity) {
    case 'day':
      return rangeStart.add(index, 'day');
    case 'week':
      return rangeStart.add(index * 7, 'day');
    case 'month':
      // Aligned to the 1st of the calendar month `index` months after `rangeStart`'s month -
      // only the month/year are ever used (see `bucketLabel`), so the day-of-month here is
      // irrelevant to the label itself, but keeping it calendar-aligned matches `bucketIndex`.
      return rangeStart.startOf('month').add(index, 'month');
  }
}

function bucketLabel(bucketStart: Dayjs, granularity: BucketGranularity): string {
  return granularity === 'month' ? bucketStart.format('MMM YYYY') : bucketStart.format('D MMM');
}

/** Buckets `transactions` (already category/account-filtered "spend" transactions - see
 * `getSpendTransactions`) into per-period totals spanning the whole `[from, to]` range, at a
 * granularity chosen by `getBucketGranularity`. This is a per-bucket total, not a running/
 * cumulative total - it answers "how much did I spend in this period," not "how much have I
 * spent so far."
 *
 * Every bucket across the range is included even if its total is 0, rather than only the
 * buckets that happen to contain a transaction - a quiet week/month in the middle of the range
 * should show as a dip on the line, not be skipped over. */
export function bucketTransactions(
  transactions: ITransaction[],
  from: string | Date,
  to: string | Date
): ITrendBucket[] {
  const granularity = getBucketGranularity(from, to);
  const rangeStart = dayjs(from).startOf('day');
  const rangeEnd = dayjs(to).startOf('day');
  const bucketCount = bucketIndex(rangeEnd, rangeStart, granularity) + 1;

  const amounts = new Array<number>(Math.max(bucketCount, 0)).fill(0);

  for (const transaction of transactions) {
    // Transactions are already fetched for exactly this range, so every index should land in
    // bounds - but guard defensively rather than trust that invariant here too.
    const index = bucketIndex(
      dayjs(transaction.date).startOf('day'),
      rangeStart,
      granularity
    );

    if (index >= 0 && index < amounts.length) {
      amounts[index] += Number(transaction.amount);
    }
  }

  return amounts.map((amount, index) => ({
    label: bucketLabel(bucketStartDate(rangeStart, index, granularity), granularity),
    amount,
  }));
}
