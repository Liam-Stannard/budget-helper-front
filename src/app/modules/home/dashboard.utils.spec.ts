import dayjs from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import {
  filterIncome,
  filterUpToDayOfMonth,
  getBillsDue,
  getBudgetProgress,
  getNetSummary,
  getNetWorth,
  getRecentTransactions,
  getSpendingPace,
} from './dashboard.utils';

const account = { id: 1, name: 'Main' };

function tx(overrides: Partial<ITransaction>): ITransaction {
  return {
    id: 1,
    title: 'test',
    amount: '10.00',
    date: '2026-11-01',
    category: 'FOOD',
    account,
    ...overrides,
  };
}

// 19 Nov 2026: 30-day month, previous month (Oct) has 31 days.
const TODAY = dayjs('2026-11-19');

describe('dashboard.utils', () => {
  describe('filterIncome', () => {
    it('should keep only INCOME transactions', () => {
      const result = filterIncome([
        tx({ id: 1, category: 'INCOME' }),
        tx({ id: 2, category: 'FOOD' }),
      ]);

      expect(result.map((t) => t.id)).toEqual([1]);
    });
  });

  describe('getNetSummary', () => {
    it('should compute net and savings rate', () => {
      expect(getNetSummary(2000, 1500)).toEqual({
        income: 2000,
        spent: 1500,
        net: 500,
        savingsRate: 25,
      });
    });

    it('should report a negative net for a deficit', () => {
      const summary = getNetSummary(1000, 1200);

      expect(summary.net).toBe(-200);
      expect(summary.savingsRate).toBe(-20);
    });

    it('should leave savings rate undefined with no income', () => {
      expect(getNetSummary(0, 50).savingsRate).toBeUndefined();
    });
  });

  describe('filterUpToDayOfMonth', () => {
    it('should include the boundary day and exclude later days', () => {
      const result = filterUpToDayOfMonth(
        [
          tx({ id: 1, date: '2026-10-19' }),
          tx({ id: 2, date: '2026-10-20' }),
        ],
        19
      );

      expect(result.map((t) => t.id)).toEqual([1]);
    });
  });

  describe('getSpendingPace', () => {
    const current = [
      tx({ amount: '100.00', date: '2026-11-02' }),
      tx({ amount: '90.00', date: '2026-11-19' }),
    ];
    const previous = [
      tx({ amount: '50.00', date: '2026-10-05' }),
      tx({ amount: '300.00', date: '2026-10-25' }),
    ];

    it('should compare against last month up to the same day', () => {
      const pace = getSpendingPace(current, previous, TODAY);

      expect(pace.spentSoFar).toBe(190);
      expect(pace.lastMonthToSameDay).toBe(50);
      expect(pace.lastMonthTotal).toBe(350);
    });

    it('should project the daily average across the month', () => {
      const pace = getSpendingPace(current, previous, TODAY);

      expect(pace.dayOfMonth).toBe(19);
      expect(pace.daysInMonth).toBe(30);
      expect(pace.dailyAverage).toBe(10);
      expect(pace.projectedTotal).toBe(300);
    });

    it('should clamp the comparison day to a shorter previous month', () => {
      // 31 Mar: February only has 28 days, so all of February counts.
      const pace = getSpendingPace(
        [],
        [tx({ amount: '20.00', date: '2026-02-28' })],
        dayjs('2026-03-31')
      );

      expect(pace.lastMonthToSameDay).toBe(20);
    });
  });

  describe('getBudgetProgress', () => {
    it('should classify over, warning and ok budgets, most-used first', () => {
      const result = getBudgetProgress(
        [
          { category: 'FOOD', amount: 90 },
          { category: 'BILL', amount: 600 },
          { category: 'SUBSCRIPTION', amount: 10 },
        ],
        [
          { category: 'FOOD', monthlyLimit: '100.0000' },
          { category: 'BILL', monthlyLimit: '500.0000' },
          { category: 'SUBSCRIPTION', monthlyLimit: '40.0000' },
        ]
      );

      expect(result.map((r) => [r.category, r.status])).toEqual([
        ['BILL', 'over'],
        ['FOOD', 'warning'],
        ['SUBSCRIPTION', 'ok'],
      ]);
      expect(result[0].remaining).toBe(-100);
      expect(result[0].percentUsed).toBe(120);
    });

    it('should include a budget with no spend yet', () => {
      const result = getBudgetProgress(
        [],
        [{ category: 'CLOTHING', monthlyLimit: '100.0000' }]
      );

      expect(result).toEqual([
        {
          category: 'CLOTHING',
          spent: 0,
          limit: 100,
          percentUsed: 0,
          remaining: 100,
          status: 'ok',
        },
      ]);
    });

    it('should list unbudgeted spend after budgeted rows, largest first', () => {
      const result = getBudgetProgress(
        [
          { category: 'FOOD', amount: 20 },
          { category: 'CLOTHING', amount: 70 },
          { category: 'BILL', amount: 5 },
        ],
        [{ category: 'BILL', monthlyLimit: '500.0000' }]
      );

      expect(result.map((r) => [r.category, r.status])).toEqual([
        ['BILL', 'ok'],
        ['CLOTHING', 'none'],
        ['FOOD', 'none'],
      ]);
    });

    it('should ignore income', () => {
      const result = getBudgetProgress([{ category: 'INCOME', amount: 2000 }], []);

      expect(result).toEqual([]);
    });
  });

  describe('getNetWorth', () => {
    it('should sum current balances, treating a missing balance as zero', () => {
      expect(
        getNetWorth([
          { name: 'A', currentBalance: '1250.5000' },
          { name: 'B', currentBalance: '-50.2500' },
          { name: 'C' },
        ])
      ).toBeCloseTo(1200.25);
    });
  });

  describe('getRecentTransactions', () => {
    it('should return the newest first, breaking date ties by id', () => {
      const result = getRecentTransactions(
        [
          tx({ id: 1, date: '2026-11-01' }),
          tx({ id: 2, date: '2026-11-10' }),
          tx({ id: 3, date: '2026-11-10' }),
          tx({ id: 4, date: '2026-11-05' }),
        ],
        3
      );

      expect(result.map((t) => t.id)).toEqual([3, 2, 4]);
    });
  });

  describe('getBillsDue', () => {
    it('should list last month bills not yet seen this month, soonest first', () => {
      const result = getBillsDue(
        [tx({ title: 'Rent', category: 'BILL', date: '2026-11-01' })],
        [
          tx({ title: 'Rent', category: 'BILL', date: '2026-10-01' }),
          tx({ title: 'Netflix', category: 'SUBSCRIPTION', amount: '10.99', date: '2026-10-25' }),
          tx({ title: 'Electric', category: 'BILL', amount: '60.00', date: '2026-10-12' }),
          tx({ title: 'Groceries', category: 'FOOD', date: '2026-10-20' }),
        ],
        TODAY
      );

      expect(result).toEqual([
        {
          title: 'Electric',
          category: 'BILL',
          expectedAmount: 60,
          expectedDate: '2026-11-12',
          daysUntilDue: -7,
        },
        {
          title: 'Netflix',
          category: 'SUBSCRIPTION',
          expectedAmount: 10.99,
          expectedDate: '2026-11-25',
          daysUntilDue: 6,
        },
      ]);
    });

    it('should match titles case- and whitespace-insensitively', () => {
      const result = getBillsDue(
        [tx({ title: ' netflix ', category: 'SUBSCRIPTION' })],
        [tx({ title: 'Netflix', category: 'SUBSCRIPTION', date: '2026-10-25' })],
        TODAY
      );

      expect(result).toEqual([]);
    });

    it('should clamp the expected day to the current month length', () => {
      const result = getBillsDue(
        [],
        [tx({ title: 'Gym', category: 'SUBSCRIPTION', date: '2026-10-31' })],
        TODAY
      );

      expect(result[0].expectedDate).toBe('2026-11-30');
    });

    it('should keep one entry for a bill paid twice last month', () => {
      const result = getBillsDue(
        [],
        [
          tx({ title: 'Phone', category: 'BILL', amount: '20.00', date: '2026-10-03' }),
          tx({ title: 'Phone', category: 'BILL', amount: '25.00', date: '2026-10-20' }),
        ],
        TODAY
      );

      expect(result).toHaveLength(1);
      expect(result[0].expectedAmount).toBe(25);
      expect(result[0].expectedDate).toBe('2026-11-20');
    });
  });
});
