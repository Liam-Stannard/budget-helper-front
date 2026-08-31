import { ITransaction } from '../../../transaction/shared/transaction.interface';
import {
  filterByCategories,
  filterExpenses,
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
});
