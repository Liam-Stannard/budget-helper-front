import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { filterExpenses, getTotalAmount } from './trend-page.utils';

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
});
