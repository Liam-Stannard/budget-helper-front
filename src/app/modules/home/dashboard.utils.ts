import dayjs, { Dayjs } from 'dayjs';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { IAccount } from '../account/shared/account.interface';
import {
  BudgetCategory,
  IBudget,
} from '../budget/shared/budget.interface';
import { ICategoryAmount, getTotalAmount } from './home.utils';

// Pure helpers behind the dashboard cards. Every date-dependent function takes `today` so specs
// can pin the calendar instead of depending on when they run.

export function filterIncome(transactions: ITransaction[]): ITransaction[] {
  return transactions.filter((transaction) => transaction.category === 'INCOME');
}

export interface INetSummary {
  income: number;
  spent: number;
  /** income - spent; negative means a deficit. */
  net: number;
  /** net as a percentage of income; undefined when there's no income to divide by. */
  savingsRate?: number;
}

export function getNetSummary(income: number, spent: number): INetSummary {
  const net = income - spent;
  return {
    income,
    spent,
    net,
    savingsRate: income === 0 ? undefined : (net / income) * 100,
  };
}

/** Transactions dated on or before `day` of their own month. */
export function filterUpToDayOfMonth(
  transactions: ITransaction[],
  day: number
): ITransaction[] {
  return transactions.filter(
    (transaction) => dayjs(transaction.date).date() <= day
  );
}

export interface ISpendingPace {
  dayOfMonth: number;
  daysInMonth: number;
  spentSoFar: number;
  /** Last month's spend up to the same day of the month (clamped to last month's length). */
  lastMonthToSameDay: number;
  lastMonthTotal: number;
  dailyAverage: number;
  /** Straight-line projection of spentSoFar across the whole month. */
  projectedTotal: number;
}

/** Both inputs must already be expense-only and scoped to their month. */
export function getSpendingPace(
  currentMonthExpenses: ITransaction[],
  previousMonthExpenses: ITransaction[],
  today: Dayjs = dayjs()
): ISpendingPace {
  const dayOfMonth = today.date();
  const daysInMonth = today.daysInMonth();
  const lastMonthDay = Math.min(
    dayOfMonth,
    today.subtract(1, 'month').daysInMonth()
  );

  const spentSoFar = getTotalAmount(
    filterUpToDayOfMonth(currentMonthExpenses, dayOfMonth)
  );
  const dailyAverage = spentSoFar / dayOfMonth;

  return {
    dayOfMonth,
    daysInMonth,
    spentSoFar,
    lastMonthToSameDay: getTotalAmount(
      filterUpToDayOfMonth(previousMonthExpenses, lastMonthDay)
    ),
    lastMonthTotal: getTotalAmount(previousMonthExpenses),
    dailyAverage,
    projectedTotal: dailyAverage * daysInMonth,
  };
}

export type BudgetStatus = 'over' | 'warning' | 'ok' | 'none';

/** Share of a budget at which a category is flagged as close to its limit. */
export const BUDGET_WARNING_PERCENT = 85;

export interface IBudgetProgress {
  category: BudgetCategory;
  spent: number;
  limit?: number;
  /** spent / limit * 100; undefined when there's no budget. */
  percentUsed?: number;
  /** limit - spent; negative when over. undefined when there's no budget. */
  remaining?: number;
  status: BudgetStatus;
}

/**
 * One row per expense category that has either spend this month or a budget. Budgeted rows come
 * first, most-used first, so whatever needs attention is at the top; unbudgeted spend follows,
 * largest first.
 */
export function getBudgetProgress(
  breakdown: ICategoryAmount[],
  budgets: IBudget[]
): IBudgetProgress[] {
  const spentByCategory = new Map<BudgetCategory, number>();
  for (const item of breakdown) {
    if (item.category !== 'INCOME') {
      spentByCategory.set(item.category, item.amount);
    }
  }

  const budgeted: IBudgetProgress[] = budgets.map((budget) => {
    const limit = Number(budget.monthlyLimit);
    const spent = spentByCategory.get(budget.category) ?? 0;
    const percentUsed = (spent / limit) * 100;

    let status: BudgetStatus = 'ok';
    if (percentUsed > 100) {
      status = 'over';
    } else if (percentUsed >= BUDGET_WARNING_PERCENT) {
      status = 'warning';
    }

    return {
      category: budget.category,
      spent,
      limit,
      percentUsed,
      remaining: limit - spent,
      status,
    };
  });

  const budgetedCategories = new Set(budgets.map((budget) => budget.category));
  const unbudgeted: IBudgetProgress[] = Array.from(spentByCategory.entries())
    .filter(([category]) => !budgetedCategories.has(category))
    .map(([category, spent]) => ({ category, spent, status: 'none' as const }));

  return [
    ...budgeted.sort((a, b) => (b.percentUsed ?? 0) - (a.percentUsed ?? 0)),
    ...unbudgeted.sort((a, b) => b.spent - a.spent),
  ];
}

export function getNetWorth(accounts: IAccount[]): number {
  return accounts.reduce(
    (total, account) => total + Number(account.currentBalance ?? 0),
    0
  );
}

/** Newest first; ties on date fall back to the higher (later-created) id. */
export function getRecentTransactions(
  transactions: ITransaction[],
  count: number
): ITransaction[] {
  return [...transactions]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0)
    )
    .slice(0, count);
}

export interface IBillDue {
  title: string;
  category: 'BILL' | 'SUBSCRIPTION';
  /** What it cost last month — the best guess at what it'll cost this month. */
  expectedAmount: number;
  /** Same day of the month as last time, clamped to this month's length. */
  expectedDate: string;
  /** Negative when the expected date has already passed. */
  daysUntilDue: number;
}

function normaliseTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Recurring payments that haven't shown up yet: any BILL/SUBSCRIPTION from last month whose title
 * (case- and whitespace-insensitive) has no match this month. A heuristic — there's no recurring
 * flag in the data model — so a renamed or one-off bill will show up here too.
 */
export function getBillsDue(
  currentMonthTransactions: ITransaction[],
  previousMonthTransactions: ITransaction[],
  today: Dayjs = dayjs()
): IBillDue[] {
  const isRecurring = (transaction: ITransaction) =>
    transaction.category === 'BILL' || transaction.category === 'SUBSCRIPTION';

  const paidThisMonth = new Set(
    currentMonthTransactions
      .filter(isRecurring)
      .map((transaction) => normaliseTitle(transaction.title))
  );

  const startOfToday = today.startOf('day');
  const dueByTitle = new Map<string, IBillDue>();

  for (const transaction of previousMonthTransactions.filter(isRecurring)) {
    const key = normaliseTitle(transaction.title);
    if (paidThisMonth.has(key)) {
      continue;
    }

    const day = Math.min(dayjs(transaction.date).date(), today.daysInMonth());
    const expected = startOfToday.date(day);
    const existing = dueByTitle.get(key);

    // Paid more than once last month: keep the later occurrence, summing would overstate it.
    if (existing && existing.expectedDate >= expected.format('YYYY-MM-DD')) {
      continue;
    }

    dueByTitle.set(key, {
      title: transaction.title,
      category: transaction.category as 'BILL' | 'SUBSCRIPTION',
      expectedAmount: Number(transaction.amount),
      expectedDate: expected.format('YYYY-MM-DD'),
      daysUntilDue: expected.diff(startOfToday, 'day'),
    });
  }

  return Array.from(dueByTitle.values()).sort((a, b) =>
    a.expectedDate.localeCompare(b.expectedDate)
  );
}
