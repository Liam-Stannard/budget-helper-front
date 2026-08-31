import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Category } from '../../../transaction/shared/transaction.types';
import { CATEGORY_OPTIONS } from '../../../transaction/shared/transcations.constants';
import { ICategoryComparison } from '../../home.utils';

const COLOR_VAR: Record<Category, string> = {
  FOOD: 'var(--series-food)',
  BILL: 'var(--series-bill)',
  SUBSCRIPTION: 'var(--series-subscription)',
  CLOTHING: 'var(--series-clothing)',
  // Unused today — INCOME is excluded from the spend-only comparison this chart renders (see
  // home.utils.ts's compareCategoriesByMonth) — but kept validated and in step with the rest of
  // the palette in case a future chart needs it.
  INCOME: 'var(--series-income)',
};

export type ComparisonMonth = 'current' | 'previous';

@Component({
  selector: 'app-category-comparison-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './category-comparison-chart.component.html',
  styleUrl: './category-comparison-chart.component.scss',
})
export class CategoryComparisonChartComponent {
  @Input() data: ICategoryComparison[] = [];

  constructor(private currencyPipe: CurrencyPipe) {}

  protected label(category: Category): string {
    return (
      CATEGORY_OPTIONS.find((option) => option.value === category)?.view ??
      category
    );
  }

  protected colorVar(category: Category): string {
    return COLOR_VAR[category];
  }

  /** Both months' bars share one scale, based on the largest single amount across either month,
   * so a category's this-month and last-month bars stay visually comparable. */
  protected widthPercent(amount: number): number {
    const max = Math.max(
      ...this.data.flatMap((item) => [item.currentAmount, item.previousAmount]),
      1
    );
    return (Math.max(0, amount) / max) * 100;
  }

  protected hasData(): boolean {
    return this.data.some(
      (item) => item.currentAmount > 0 || item.previousAmount > 0
    );
  }

  protected amountFor(item: ICategoryComparison, month: ComparisonMonth): number {
    return month === 'current' ? item.currentAmount : item.previousAmount;
  }

  protected ariaLabel(item: ICategoryComparison, month: ComparisonMonth): string {
    const amount = this.currencyPipe.transform(this.amountFor(item, month));
    const monthLabel = month === 'current' ? 'this month' : 'last month';

    return `${this.label(item.category)} ${monthLabel}: ${amount}`;
  }
}
