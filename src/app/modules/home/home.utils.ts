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
