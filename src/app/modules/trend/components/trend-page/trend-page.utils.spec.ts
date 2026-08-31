import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { Category } from '../../../transaction/shared/transaction.types';
import {
  bucketTransactions,
  filterByCategories,
  filterExpenses,
  getBucketGranularity,
  getSpendTransactions,
  getTotalAmount,
  getTotalSpend,
} from './trend-page.utils';

const account = { id: 1, name: 'Main' };

function makeTransaction(overrides: Partial<ITransaction>): ITransaction {
  return {
    id: 1,
    title: 'test',
    amount: '10.00',
    date: '2024-01-01',
    category: 'FOOD',
    account,
    ...overrides,
  };
}

describe('trend-page.utils', () => {
  describe('filterExpenses', () => {
    it('should return an empty array for an empty list', () => {
      expect(filterExpenses([])).toEqual([]);
    });

    it('should exclude INCOME transactions', () => {
      const expense = makeTransaction({ category: 'FOOD' });
      const income = makeTransaction({ category: 'INCOME' });

      expect(filterExpenses([expense, income])).toEqual([expense]);
    });
  });

  describe('filterByCategories', () => {
    it('should return every transaction unchanged when no categories are selected', () => {
      const transactions = [
        makeTransaction({ category: 'FOOD' }),
        makeTransaction({ category: 'INCOME' }),
      ];

      expect(filterByCategories(transactions, [])).toEqual(transactions);
    });

    it('should return only transactions matching a single selected category', () => {
      const food = makeTransaction({ category: 'FOOD' });
      const bill = makeTransaction({ category: 'BILL' });

      expect(filterByCategories([food, bill], ['FOOD'])).toEqual([food]);
    });

    it('should return transactions matching any of several selected categories', () => {
      const food = makeTransaction({ category: 'FOOD' });
      const bill = makeTransaction({ category: 'BILL' });
      const clothing = makeTransaction({ category: 'CLOTHING' });

      expect(filterByCategories([food, bill, clothing], ['FOOD', 'BILL'])).toEqual([
        food,
        bill,
      ]);
    });

    it('should return an empty array when no transaction matches the selected categories', () => {
      const food = makeTransaction({ category: 'FOOD' });

      expect(filterByCategories([food], ['BILL'])).toEqual([]);
    });
  });

  describe('getTotalAmount', () => {
    it('should return 0 for an empty list', () => {
      expect(getTotalAmount([])).toBe(0);
    });

    it('should sum the amounts of every transaction', () => {
      const transactions = [
        makeTransaction({ amount: '10.00' }),
        makeTransaction({ amount: '5.50' }),
      ];

      expect(getTotalAmount(transactions)).toBe(15.5);
    });
  });

  describe('getTotalSpend', () => {
    it('should exclude INCOME by default when no category filter is applied', () => {
      const transactions = [
        makeTransaction({ category: 'FOOD', amount: '10.00' }),
        makeTransaction({ category: 'INCOME', amount: '500.00' }),
      ];

      expect(getTotalSpend(transactions, [])).toBe(10);
    });

    it('should count INCOME toward the total when the user has explicitly filtered to it', () => {
      const income = makeTransaction({ category: 'INCOME', amount: '500.00' });

      expect(getTotalSpend([income], ['INCOME'])).toBe(500);
    });

    it('should not apply any extra INCOME-stripping when explicitly filtered to a non-INCOME category (INCOME was never in the filtered set to begin with)', () => {
      const food = makeTransaction({ category: 'FOOD', amount: '10.00' });

      expect(getTotalSpend([food], ['FOOD'])).toBe(10);
    });
  });

  describe('getSpendTransactions', () => {
    it('should exclude INCOME by default when no category filter is applied', () => {
      const food = makeTransaction({ category: 'FOOD' });
      const income = makeTransaction({ category: 'INCOME' });

      expect(getSpendTransactions([food, income], [])).toEqual([food]);
    });

    it('should respect an explicit category selection as-is, including INCOME', () => {
      const income = makeTransaction({ category: 'INCOME' });

      expect(getSpendTransactions([income], ['INCOME'])).toEqual([income]);
    });
  });

  describe('getBucketGranularity', () => {
    it('should bucket by day for a range of 90 days or fewer', () => {
      expect(getBucketGranularity('2024-01-01', '2024-01-01')).toBe('day'); // 1 day
      expect(getBucketGranularity('2024-01-01', '2024-03-30')).toBe('day'); // 90 days
    });

    it('should bucket by week just above the daily threshold, up to 630 days', () => {
      expect(getBucketGranularity('2024-01-01', '2024-03-31')).toBe('week'); // 91 days
      expect(getBucketGranularity('2024-01-01', '2025-09-21')).toBe('week'); // 630 days
    });

    it('should bucket by month beyond the weekly threshold', () => {
      expect(getBucketGranularity('2024-01-01', '2025-09-22')).toBe('month'); // 631 days
      expect(getBucketGranularity('2020-01-01', '2025-01-01')).toBe('month'); // multi-year
    });
  });

  describe('bucketTransactions', () => {
    it('should produce one bucket per day for a short range, zero-filled where there is no spend', () => {
      const transactions = [
        makeTransaction({ date: '2024-01-01', amount: '10.00' }),
        makeTransaction({ date: '2024-01-03', amount: '5.00' }),
      ];

      const buckets = bucketTransactions(transactions, '2024-01-01', '2024-01-03');

      expect(buckets).toEqual([
        { label: '1 Jan', amount: 10 },
        { label: '2 Jan', amount: 0 },
        { label: '3 Jan', amount: 5 },
      ]);
    });

    it('should sum multiple transactions falling in the same day bucket', () => {
      const transactions = [
        makeTransaction({ date: '2024-01-01', amount: '10.00' }),
        makeTransaction({ date: '2024-01-01', amount: '2.50' }),
      ];

      const buckets = bucketTransactions(transactions, '2024-01-01', '2024-01-01');

      expect(buckets).toEqual([{ label: '1 Jan', amount: 12.5 }]);
    });

    it('should produce a single bucket for a single-day range', () => {
      const buckets = bucketTransactions([], '2024-01-15', '2024-01-15');

      expect(buckets).toEqual([{ label: '15 Jan', amount: 0 }]);
    });

    it('should return zero-filled buckets spanning the whole range when there are no transactions', () => {
      const buckets = bucketTransactions([], '2024-01-01', '2024-01-05');

      expect(buckets).toHaveLength(5);
      expect(buckets.every((bucket) => bucket.amount === 0)).toBe(true);
    });

    it('should aggregate into weekly buckets once the range is long enough', () => {
      const transactions = [
        makeTransaction({ date: '2024-01-01', amount: '10.00' }), // first week
        makeTransaction({ date: '2024-01-06', amount: '5.00' }), // still first week (day 6)
        makeTransaction({ date: '2024-01-08', amount: '3.00' }), // second week
      ];

      // 100-day range - past the 90-day daily threshold, so this buckets by week.
      const buckets = bucketTransactions(transactions, '2024-01-01', '2024-04-10');

      expect(getBucketGranularity('2024-01-01', '2024-04-10')).toBe('week');
      expect(buckets[0]).toEqual({ label: '1 Jan', amount: 15 });
      expect(buckets[1]).toEqual({ label: '8 Jan', amount: 3 });
    });

    it('should aggregate into monthly buckets for a multi-year range', () => {
      const transactions = [
        makeTransaction({ date: '2020-01-15', amount: '10.00' }),
        makeTransaction({ date: '2020-01-20', amount: '5.00' }),
        makeTransaction({ date: '2020-02-01', amount: '2.00' }),
      ];

      const buckets = bucketTransactions(transactions, '2020-01-01', '2022-01-01');

      expect(buckets[0]).toEqual({ label: 'Jan 2020', amount: 15 });
      expect(buckets[1]).toEqual({ label: 'Feb 2020', amount: 2 });
      expect(buckets).toHaveLength(25); // Jan 2020 through Jan 2022 inclusive
    });

    describe('monthly buckets are calendar-month-aligned, not a uniform "add N months to from"', () => {
      it('should place a transaction into the calendar month it actually falls in, even when "from" starts mid-month', () => {
        // "from" is June 15th, so a naive `rangeStart.add(index, 'month')` bucketing would run
        // the first bucket June 15 -> July 14 and mislabel July 10th as "Jun 2020". Calendar-
        // month alignment must instead place it in the "Jul 2020" bucket.
        const transactions = [
          makeTransaction({ date: '2020-06-15', amount: '10.00' }), // from's own date
          makeTransaction({ date: '2020-07-10', amount: '25.00' }), // must land in Jul, not Jun
        ];

        const buckets = bucketTransactions(transactions, '2020-06-15', '2022-06-15');

        expect(getBucketGranularity('2020-06-15', '2022-06-15')).toBe('month');
        expect(buckets[0]).toEqual({ label: 'Jun 2020', amount: 10 });
        expect(buckets[1]).toEqual({ label: 'Jul 2020', amount: 25 });
      });

      it('should give every bucket boundary at the 1st of a calendar month, except the first (truncated to "from") and last (truncated to "to")', () => {
        const buckets = bucketTransactions([], '2020-06-15', '2022-06-10');

        expect(getBucketGranularity('2020-06-15', '2022-06-10')).toBe('month');
        // First bucket: partial, "from" (Jun 15) through end of June - labeled by June.
        expect(buckets[0].label).toBe('Jun 2020');
        // Every full month in between is its own calendar-aligned bucket.
        expect(buckets[1].label).toBe('Jul 2020');
        expect(buckets[buckets.length - 3].label).toBe('Apr 2022');
        expect(buckets[buckets.length - 2].label).toBe('May 2022');
        // Last bucket: partial, 1st of June 2022 through "to" (Jun 10) - labeled by June 2022.
        expect(buckets[buckets.length - 1].label).toBe('Jun 2022');
        expect(buckets).toHaveLength(25); // Jun 2020 through Jun 2022 inclusive
      });

      it('should count a transaction dated on the 1st of a full calendar month in that month\'s bucket, not spill into the previous bucket', () => {
        const onFirst = makeTransaction({ date: '2020-08-01', amount: '99.00' });

        const buckets = bucketTransactions([onFirst], '2020-06-15', '2022-06-15');

        const augustBucket = buckets.find((bucket) => bucket.label === 'Aug 2020');
        expect(augustBucket?.amount).toBe(99);
        expect(buckets.filter((bucket) => bucket.label !== 'Aug 2020').every((bucket) => bucket.amount === 0)).toBe(true);
      });
    });

    it('should ignore transactions falling outside the given range', () => {
      const transactions = [
        makeTransaction({ date: '2023-12-31', amount: '999.00' }), // before range
        makeTransaction({ date: '2024-01-10', amount: '999.00' }), // after range
        makeTransaction({ date: '2024-01-02', amount: '10.00' }),
      ];

      const buckets = bucketTransactions(transactions, '2024-01-01', '2024-01-03');

      expect(buckets.reduce((sum, bucket) => sum + bucket.amount, 0)).toBe(10);
    });

    it('should not sum to a running/cumulative total - each bucket only reflects its own period', () => {
      const transactions = [
        makeTransaction({ date: '2024-01-01', amount: '10.00' }),
        makeTransaction({ date: '2024-01-02', amount: '10.00' }),
      ];

      const buckets = bucketTransactions(transactions, '2024-01-01', '2024-01-02');

      expect(buckets[0].amount).toBe(10);
      expect(buckets[1].amount).toBe(10); // not 20 - not cumulative
    });

    describe('boundary transactions', () => {
      it('should place a transaction dated exactly on the range "from" date into the first bucket only', () => {
        const onFrom = makeTransaction({ date: '2024-01-01', amount: '10.00' });

        const buckets = bucketTransactions([onFrom], '2024-01-01', '2024-01-10');

        expect(buckets[0].amount).toBe(10);
        expect(buckets.slice(1).every((bucket) => bucket.amount === 0)).toBe(true);
      });

      it('should place a transaction dated exactly on the range "to" date into the last bucket only', () => {
        const onTo = makeTransaction({ date: '2024-01-10', amount: '7.00' });

        const buckets = bucketTransactions([onTo], '2024-01-01', '2024-01-10');

        expect(buckets[buckets.length - 1].amount).toBe(7);
        expect(buckets.slice(0, -1).every((bucket) => bucket.amount === 0)).toBe(true);
      });

      it('should count "from" and "to" boundary transactions exactly once each, not dropped and not double-counted across two buckets', () => {
        const onFrom = makeTransaction({ date: '2024-01-01', amount: '10.00' });
        const onTo = makeTransaction({ date: '2024-01-10', amount: '7.00' });

        const buckets = bucketTransactions([onFrom, onTo], '2024-01-01', '2024-01-10');

        expect(buckets).toHaveLength(10);
        expect(buckets[0].amount).toBe(10);
        expect(buckets[9].amount).toBe(7);
        expect(buckets.reduce((sum, bucket) => sum + bucket.amount, 0)).toBe(17);
      });
    });

    describe('zero-fill completeness', () => {
      it('should zero-fill every bucket surrounding a transaction in the middle of the range, not just the first/last bucket', () => {
        const middle = makeTransaction({ date: '2024-01-05', amount: '42.00' });

        const buckets = bucketTransactions([middle], '2024-01-01', '2024-01-10');

        expect(buckets).toHaveLength(10);
        // Every bucket before and after the one containing the transaction is present and 0 -
        // not just the bucket with spend, and not just the range's first/last bucket.
        expect(buckets.slice(0, 4).map((bucket) => bucket.amount)).toEqual([0, 0, 0, 0]);
        expect(buckets[4].amount).toBe(42); // day 5 (0-indexed bucket 4)
        expect(buckets.slice(5).map((bucket) => bucket.amount)).toEqual([
          0, 0, 0, 0, 0,
        ]);
        expect(buckets.map((bucket) => bucket.label)).toEqual([
          '1 Jan',
          '2 Jan',
          '3 Jan',
          '4 Jan',
          '5 Jan',
          '6 Jan',
          '7 Jan',
          '8 Jan',
          '9 Jan',
          '10 Jan',
        ]);
      });
    });

    describe('granularity threshold edges', () => {
      it('should produce 90 daily buckets for an exactly-90-day range', () => {
        const buckets = bucketTransactions([], '2024-01-01', '2024-03-30');

        expect(getBucketGranularity('2024-01-01', '2024-03-30')).toBe('day');
        expect(buckets).toHaveLength(90);
        expect(buckets[0].label).toBe('1 Jan');
        expect(buckets[89].label).toBe('30 Mar');
      });

      it('should switch to weekly buckets for a 91-day range (one day past the daily threshold)', () => {
        const buckets = bucketTransactions([], '2024-01-01', '2024-03-31');

        expect(getBucketGranularity('2024-01-01', '2024-03-31')).toBe('week');
        expect(buckets).toHaveLength(13);
      });

      it('should still produce weekly buckets for an exactly-630-day range', () => {
        const buckets = bucketTransactions([], '2024-01-01', '2025-09-21');

        expect(getBucketGranularity('2024-01-01', '2025-09-21')).toBe('week');
        expect(buckets).toHaveLength(90);
      });

      it('should switch to monthly buckets for a 631-day range (one day past the weekly threshold)', () => {
        const buckets = bucketTransactions([], '2024-01-01', '2025-09-22');

        expect(getBucketGranularity('2024-01-01', '2025-09-22')).toBe('month');
        expect(buckets).toHaveLength(21);
        expect(buckets[0].label).toBe('Jan 2024');
      });
    });

    describe('bucket total matches getTotalSpend (chart/tile drift check)', () => {
      /** Mirrors the component's full pipeline: raw fetched transactions -> client-side
       * category-filter -> the shared "spend" set -> either summed directly (the tile) or
       * bucketed (the chart). The two must always agree, regardless of filter combination. */
      function sumOfBuckets(
        rawTransactions: ITransaction[],
        appliedCategories: Category[],
        from: string,
        to: string
      ): number {
        const filtered = filterByCategories(rawTransactions, appliedCategories);
        const spend = getSpendTransactions(filtered, appliedCategories);

        return bucketTransactions(spend, from, to).reduce(
          (sum, bucket) => sum + bucket.amount,
          0
        );
      }

      /** Same pipeline's tile-side total, for comparison against `sumOfBuckets`. */
      function tileTotal(
        rawTransactions: ITransaction[],
        appliedCategories: Category[]
      ): number {
        return getTotalSpend(
          filterByCategories(rawTransactions, appliedCategories),
          appliedCategories
        );
      }

      it('should match with no category filter applied (default INCOME exclusion)', () => {
        const transactions = [
          makeTransaction({ date: '2024-01-01', category: 'FOOD', amount: '10.00' }),
          makeTransaction({ date: '2024-01-05', category: 'BILL', amount: '5.50' }),
          makeTransaction({ date: '2024-01-10', category: 'INCOME', amount: '500.00' }),
        ];

        const chartTotal = sumOfBuckets(transactions, [], '2024-01-01', '2024-01-10');

        expect(chartTotal).toBe(tileTotal(transactions, []));
        expect(chartTotal).toBe(15.5);
      });

      it('should match when a category filter is applied (respected as-is, including INCOME)', () => {
        const transactions = [
          makeTransaction({ date: '2024-01-01', category: 'FOOD', amount: '10.00' }),
          makeTransaction({ date: '2024-01-05', category: 'INCOME', amount: '500.00' }),
        ];

        const chartTotal = sumOfBuckets(
          transactions,
          ['FOOD', 'INCOME'],
          '2024-01-01',
          '2024-01-10'
        );

        expect(chartTotal).toBe(tileTotal(transactions, ['FOOD', 'INCOME']));
        expect(chartTotal).toBe(510);
      });

      it('should match for a weekly-granularity range spanning a filter that excludes everything', () => {
        const transactions = [
          makeTransaction({ date: '2024-02-01', category: 'FOOD', amount: '10.00' }),
        ];

        const chartTotal = sumOfBuckets(
          transactions,
          ['CLOTHING'],
          '2024-01-01',
          '2024-04-10'
        );

        expect(chartTotal).toBe(tileTotal(transactions, ['CLOTHING']));
        expect(chartTotal).toBe(0);
      });

      it('should match for a monthly-granularity, multi-year range', () => {
        const transactions = [
          makeTransaction({ date: '2020-06-15', category: 'FOOD', amount: '10.00' }),
          makeTransaction({ date: '2021-12-01', category: 'BILL', amount: '25.00' }),
          makeTransaction({ date: '2021-12-15', category: 'INCOME', amount: '500.00' }),
        ];

        const chartTotal = sumOfBuckets(transactions, [], '2020-01-01', '2022-01-01');

        expect(chartTotal).toBe(tileTotal(transactions, []));
        expect(chartTotal).toBe(35);
      });

      it('should match for an account-filter-only scenario (account filtering already applied upstream by the backend, category filter left empty)', () => {
        // Account filtering happens server-side before these utils ever see the data, so from
        // this layer's perspective it's indistinguishable from "no filter" - included here to
        // exercise the "account filter only" combination named in the ticket.
        const alreadyAccountFiltered = [
          makeTransaction({ date: '2024-01-02', category: 'FOOD', amount: '12.34' }),
          makeTransaction({ date: '2024-01-06', category: 'BILL', amount: '7.66' }),
        ];

        const chartTotal = sumOfBuckets(
          alreadyAccountFiltered,
          [],
          '2024-01-01',
          '2024-01-10'
        );

        expect(chartTotal).toBe(tileTotal(alreadyAccountFiltered, []));
        expect(chartTotal).toBe(20);
      });
    });
  });
});
