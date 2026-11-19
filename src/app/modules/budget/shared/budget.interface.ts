import { Category } from '../../transaction/shared/transaction.types';

/** INCOME can't carry a budget — the backend rejects it with a 400. */
export type BudgetCategory = Exclude<Category, 'INCOME'>;

export type IBudget = {
  category: BudgetCategory;
  /** Decimal string at DECIMAL(19,4) scale, e.g. "250.0000". Always > 0. */
  monthlyLimit: string;
};

export type IGetBudgetListResponse = {
  budgetList: IBudget[];
};

export type IPutBudgetRequest = {
  monthlyLimit: string;
};

export type IPutBudgetResponse = {
  budget: IBudget;
};
