import dayjs from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import {
  filterCurrentMonth,
  filterExpenses,
  filterPreviousMonth,
  getMonthOverMonthDelta,
  getSparklineBuckets,
  getTopCategory,
  getTotalAmount,
  sumByCategory,
} from './home.utils';

const account = { id: 1, name: 'Main' };

function makeTransaction(overrides: Partial<ITransaction>): ITransaction {
  return {
    id: 1,
    title: 'test',
    amount: '10.00',
    date: dayjs().format('YYYY-MM-DD'),
    category: 'FOOD',
    account,
    ...overrides,
  };
}

describe('home.utils', () => {
  describe('filterCurrentMonth', () => {
    it('should return an empty array for an empty list', () => {
      expect(filterCurrentMonth([])).toEqual([]);
    });

    it('should keep transactions dated in the current month', () => {
      const transaction = makeTransaction({});

      expect(filterCurrentMonth([transaction])).toEqual([transaction]);
    });

    it('should drop transactions dated in a different month', () => {
      const transaction = makeTransaction({
        date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      });

      expect(filterCurrentMonth([transaction])).toEqual([]);
    });
  });

  describe('filterPreviousMonth', () => {
    it('should return an empty array for an empty list', () => {
      expect(filterPreviousMonth([])).toEqual([]);
    });

    it('should keep transactions dated in the previous month', () => {
      const transaction = makeTransaction({
        date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      });

      expect(filterPreviousMonth([transaction])).toEqual([transaction]);
    });

    it('should drop transactions dated in the current month', () => {
      const transaction = makeTransaction({});

      expect(filterPreviousMonth([transaction])).toEqual([]);
    });

    it('should drop transactions dated two months ago', () => {
      const transaction = makeTransaction({
        date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      });

      expect(filterPreviousMonth([transaction])).toEqual([]);
    });
  });

  describe('filterExpenses', () => {
    it('should return an empty array for an empty list', () => {
      expect(filterExpenses([])).toEqual([]);
    });

    it('should drop INCOME transactions', () => {
      const income = makeTransaction({ category: 'INCOME', amount: '500.00' });
      const expense = makeTransaction({ category: 'FOOD', amount: '10.00' });

      expect(filterExpenses([income, expense])).toEqual([expense]);
    });

    it('should keep every non-INCOME category', () => {
      const transactions = [
        makeTransaction({ category: 'FOOD' }),
        makeTransaction({ category: 'BILL' }),
        makeTransaction({ category: 'SUBSCRIPTION' }),
        makeTransaction({ category: 'CLOTHING' }),
      ];

      expect(filterExpenses(transactions)).toEqual(transactions);
    });
  });

  describe('getTotalAmount', () => {
    it('should return 0 for an empty list', () => {
      expect(getTotalAmount([])).toBe(0);
    });

    it('should sum the amount across all transactions', () => {
      const transactions = [
        makeTransaction({ amount: '10.00' }),
        makeTransaction({ amount: '5.50' }),
      ];

      expect(getTotalAmount(transactions)).toBe(15.5);
    });
  });

  describe('sumByCategory', () => {
    it('should return an empty array for an empty list', () => {
      expect(sumByCategory([])).toEqual([]);
    });

    it('should sum amounts per category', () => {
      const transactions = [
        makeTransaction({ category: 'FOOD', amount: '10.00' }),
        makeTransaction({ category: 'FOOD', amount: '5.00' }),
        makeTransaction({ category: 'BILL', amount: '20.00' }),
      ];

      expect(sumByCategory(transactions)).toEqual([
        { category: 'BILL', amount: 20 },
        { category: 'FOOD', amount: 15 },
      ]);
    });

    it('should sort categories by amount descending', () => {
      const transactions = [
        makeTransaction({ category: 'CLOTHING', amount: '1.00' }),
        makeTransaction({ category: 'SUBSCRIPTION', amount: '50.00' }),
        makeTransaction({ category: 'FOOD', amount: '25.00' }),
      ];

      expect(sumByCategory(transactions).map((c) => c.category)).toEqual([
        'SUBSCRIPTION',
        'FOOD',
        'CLOTHING',
      ]);
    });
  });

  describe('getTopCategory', () => {
    it('should return undefined for an empty breakdown', () => {
      expect(getTopCategory([])).toBeUndefined();
    });

    it('should return the first (highest amount) entry', () => {
      const breakdown = sumByCategory([
        makeTransaction({ category: 'FOOD', amount: '5.00' }),
        makeTransaction({ category: 'BILL', amount: '50.00' }),
      ]);

      expect(getTopCategory(breakdown)).toEqual({
        category: 'BILL',
        amount: 50,
      });
    });
  });

  describe('getMonthOverMonthDelta', () => {
    it('should compute a positive change amount and percent when spend increased', () => {
      expect(getMonthOverMonthDelta(150, 100)).toEqual({
        changeAmount: 50,
        changePercent: 50,
      });
    });

    it('should compute a negative change amount and percent when spend decreased', () => {
      expect(getMonthOverMonthDelta(50, 100)).toEqual({
        changeAmount: -50,
        changePercent: -50,
      });
    });

    it('should leave changePercent undefined when there is no previous total to compare against', () => {
      expect(getMonthOverMonthDelta(100, 0)).toEqual({
        changeAmount: 100,
        changePercent: undefined,
      });
    });

    it('should report no change when both totals are zero', () => {
      expect(getMonthOverMonthDelta(0, 0)).toEqual({
        changeAmount: 0,
        changePercent: undefined,
      });
    });
  });

  describe('getSparklineBuckets', () => {
    it('should return 12 zeroed buckets when there are no transactions', () => {
      const buckets = getSparklineBuckets([]);

      expect(buckets).toHaveLength(12);
      expect(buckets.every((bucket) => bucket.amount === 0)).toBe(true);
      expect(
        buckets.every((bucket) => Number.isFinite(bucket.amount))
      ).toBe(true);
    });

    it('should support a custom bucket count', () => {
      expect(getSparklineBuckets([], 4)).toHaveLength(4);
    });

    it('should sum amounts falling within the same bucket', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const transactions = [
        makeTransaction({ date: today, amount: '10.00' }),
        makeTransaction({ date: today, amount: '5.00' }),
      ];

      const total = getSparklineBuckets(transactions).reduce(
        (sum, bucket) => sum + bucket.amount,
        0
      );

      expect(total).toBe(15);
    });

    it('should ignore transactions dated before the bucket window starts', () => {
      const transactions = [
        makeTransaction({
          date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
          amount: '999.00',
        }),
      ];

      const total = getSparklineBuckets(transactions).reduce(
        (sum, bucket) => sum + bucket.amount,
        0
      );

      expect(total).toBe(0);
    });

    it('should place a transaction dated at the very start of the window in the first bucket', () => {
      const rangeStart = dayjs().subtract(1, 'month').startOf('month');
      const transactions = [
        makeTransaction({
          date: rangeStart.format('YYYY-MM-DD'),
          amount: '10.00',
        }),
      ];

      expect(getSparklineBuckets(transactions)[0].amount).toBe(10);
    });

    it('should place a transaction dated today in the final bucket', () => {
      const transactions = [
        makeTransaction({ date: dayjs().format('YYYY-MM-DD'), amount: '10.00' }),
      ];

      expect(getSparklineBuckets(transactions)[11].amount).toBe(10);
    });

    it('should exclude a transaction with an INCOME category when the caller pre-filters expenses', () => {
      const income = makeTransaction({ category: 'INCOME', amount: '500.00' });
      const expense = makeTransaction({ category: 'FOOD', amount: '10.00' });

      const total = getSparklineBuckets(filterExpenses([income, expense])).reduce(
        (sum, bucket) => sum + bucket.amount,
        0
      );

      expect(total).toBe(10);
    });

    it('should flag the first bucket (starting at previous-month-start) as not current month', () => {
      // the first bucket's ~2-5 day span always falls entirely within the previous month,
      // regardless of where "today" falls in the current month
      expect(getSparklineBuckets([])[0].isCurrentMonth).toBe(false);
    });

    describe('bucket boundary precision', () => {
      // Real transaction dates are day-granularity ('YYYY-MM-DD') so they can never land
      // precisely on a sub-day bucket boundary in practice. These tests feed synthetic
      // millisecond-precision ISO timestamps straight into the pure function to exercise the
      // floor/clamp arithmetic at the exact instants where an off-by-one would double-count,
      // drop, or misplace a transaction.
      afterEach(() => {
        jest.useRealTimers();
      });

      function windowBounds() {
        const rangeStart = dayjs().subtract(1, 'month').startOf('month');
        const rangeEnd = dayjs().endOf('day');
        const rangeMs = rangeEnd.diff(rangeStart);

        return { rangeStart, rangeEnd, rangeMs, bucketMs: rangeMs / 12 };
      }

      /** Builds an ISO timestamp `offsetMs` after `base`, using integer Date-object arithmetic
       * rather than dayjs `.add(ms, 'millisecond')` (which truncates fractional milliseconds and
       * would otherwise nudge a synthetic boundary timestamp to the wrong side of the boundary). */
      function isoAtOffset(base: dayjs.Dayjs, offsetMs: number): string {
        return new Date(base.valueOf() + offsetMs).toISOString();
      }

      it('should place a transaction exactly on an interior bucket boundary into the later bucket, not both/neither', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-31T15:00:00.000Z'));

        const { rangeStart, bucketMs } = windowBounds();
        // offsetMs is nudged up to the nearest integer millisecond so it never falls fractionally
        // short of the boundary (bucketMs itself is a non-integer number of ms).
        const boundaryOffset = Math.ceil(bucketMs * 3);
        const justBeforeOffset = boundaryOffset - 1;

        const atBoundary = getSparklineBuckets([
          makeTransaction({
            date: isoAtOffset(rangeStart, boundaryOffset),
            amount: '10.00',
          }),
        ]);
        const justBefore = getSparklineBuckets([
          makeTransaction({
            date: isoAtOffset(rangeStart, justBeforeOffset),
            amount: '10.00',
          }),
        ]);

        // exactly on the boundary belongs to bucket 3, not bucket 2 or double-counted in both
        expect(atBoundary[3].amount).toBe(10);
        expect(atBoundary[2].amount).toBe(0);
        expect(atBoundary.reduce((sum, b) => sum + b.amount, 0)).toBe(10);

        // one millisecond earlier belongs to the previous bucket
        expect(justBefore[2].amount).toBe(10);
        expect(justBefore[3].amount).toBe(0);
      });

      it('should place a transaction at the very last instant of the window into the final bucket', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-31T15:00:00.000Z'));

        const { rangeStart, rangeMs } = windowBounds();

        const buckets = getSparklineBuckets([
          makeTransaction({
            date: isoAtOffset(rangeStart, rangeMs),
            amount: '10.00',
          }),
        ]);

        expect(buckets[11].amount).toBe(10);
        expect(buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(10);
      });

      it('should exclude a transaction one millisecond past the end of the window', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-31T15:00:00.000Z'));

        const { rangeStart, rangeMs } = windowBounds();

        const buckets = getSparklineBuckets([
          makeTransaction({
            date: isoAtOffset(rangeStart, rangeMs + 1),
            amount: '10.00',
          }),
        ]);

        expect(buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(0);
      });
    });

    describe('window length extremes', () => {
      afterEach(() => {
        jest.useRealTimers();
      });

      it('should bucket correctly across a short (~29 day) window, e.g. Feb -> Mar 1st', () => {
        // "today" is the 1st of the month, and the previous month (Feb, non-leap 2026) is 28
        // days, giving the shortest possible previous-month-start-to-today window.
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));

        const transactions = [
          makeTransaction({ date: '2026-02-01', amount: '10.00' }), // window start
          makeTransaction({ date: '2026-02-15', amount: '20.00' }), // mid previous month
          makeTransaction({ date: '2026-03-01', amount: '30.00' }), // today
        ];

        const buckets = getSparklineBuckets(transactions);

        expect(buckets).toHaveLength(12);
        expect(buckets.every((b) => Number.isFinite(b.amount))).toBe(true);
        expect(buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(60);
        expect(buckets[0].amount).toBe(10);
        expect(buckets[11].amount).toBe(30);
      });

      it('should bucket correctly across a long (~62 day) window, e.g. Dec 1st -> Jan 31st', () => {
        // previous month (Dec) has 31 days and "today" is the last day of a 31-day Jan, giving
        // close to the longest possible previous-month-start-to-today window.
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-31T15:00:00.000Z'));

        const transactions = [
          makeTransaction({ date: '2025-12-01', amount: '10.00' }), // window start
          makeTransaction({ date: '2025-12-15', amount: '20.00' }), // previous month
          makeTransaction({ date: '2026-01-31', amount: '30.00' }), // today
        ];

        const buckets = getSparklineBuckets(transactions);

        expect(buckets).toHaveLength(12);
        expect(buckets.every((b) => Number.isFinite(b.amount))).toBe(true);
        expect(buckets.reduce((sum, b) => sum + b.amount, 0)).toBe(60);
        expect(buckets[0].amount).toBe(10);
        expect(buckets[11].amount).toBe(30);
      });

      it('should flip isCurrentMonth at most once across the buckets in a long (~62 day) window', () => {
        // re-verifies the "at most one bucket straddles the boundary" reasoning at the opposite
        // extreme from the short-window tests below: a ~5.2-day bucket width is still far
        // shorter than a calendar month, so isCurrentMonth should go false -> true at most once
        // across the sequence, never back to false.
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-31T15:00:00.000Z'));

        const flags = getSparklineBuckets([]).map((bucket) => bucket.isCurrentMonth);
        const transitions = flags.filter(
          (flag, index) => index > 0 && flag !== flags[index - 1]
        ).length;

        expect(transitions).toBeLessThanOrEqual(1);
        expect(flags[0]).toBe(false);
        expect(flags[11]).toBe(true);
      });
    });

    describe('isCurrentMonth classification at the short-window extreme', () => {
      afterEach(() => {
        jest.useRealTimers();
      });

      // On the 1st calendar day of a month, with the shortest possible ~29 day window, the final
      // bucket's ~2.4-day span is mostly within the previous month, but it's still the bucket
      // "today" (and today's transactions) live in. isCurrentMonth is derived from the bucket's
      // END rather than its midpoint specifically so this bucket -- the one straddling the
      // boundary -- reads as current-month.
      it('classifies a same-day (current month) transaction as current-month on the 1st of the month', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));

        const buckets = getSparklineBuckets([
          makeTransaction({ date: '2026-03-01', amount: '42.00' }),
        ]);

        expect(buckets[11].amount).toBe(42);
        expect(buckets[11].isCurrentMonth).toBe(true);
      });

      it('classifies the same today-dated transaction as current-month by the 2nd of the month', () => {
        // one day later, on the same ~29 day window shape, the final bucket remains current-month
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));

        const buckets = getSparklineBuckets([
          makeTransaction({ date: '2026-03-02', amount: '42.00' }),
        ]);

        expect(buckets[11].amount).toBe(42);
        expect(buckets[11].isCurrentMonth).toBe(true);
      });
    });
  });
});
