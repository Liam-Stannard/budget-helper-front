import dayjs from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import {
  filterCurrentMonth,
  filterExpenses,
  filterPreviousMonth,
  getMonthOverMonthDelta,
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
});
