import { Category } from './transaction.types';
import { CATEGORY_OPTIONS } from './transcations.constants';

/** CSS custom properties defined globally in styles.scss. */
export const CATEGORY_COLOR_VAR: Record<Category, string> = {
  FOOD: 'var(--series-food)',
  BILL: 'var(--series-bill)',
  SUBSCRIPTION: 'var(--series-subscription)',
  CLOTHING: 'var(--series-clothing)',
  INCOME: 'var(--series-income)',
};

export function categoryLabel(category: Category): string {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.view ??
    category
  );
}
