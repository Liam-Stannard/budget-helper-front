import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Category } from '../../../transaction/shared/transaction.types';
import { CATEGORY_OPTIONS } from '../../../transaction/shared/transcations.constants';
import { ICategoryAmount } from '../../home.utils';

const COLOR_VAR: Record<Category, string> = {
  FOOD: 'var(--series-food)',
  BILL: 'var(--series-bill)',
  SUBSCRIPTION: 'var(--series-subscription)',
  CLOTHING: 'var(--series-clothing)',
};

@Component({
  selector: 'app-category-breakdown-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './category-breakdown-chart.component.html',
  styleUrl: './category-breakdown-chart.component.scss',
})
export class CategoryBreakdownChartComponent {
  @Input() data: ICategoryAmount[] = [];

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

  protected widthPercent(amount: number): number {
    const max = Math.max(...this.data.map((item) => item.amount), 1);
    return (amount / max) * 100;
  }

  protected percentOfTotal(amount: number): number {
    const total = this.data.reduce((sum, item) => sum + item.amount, 0);
    return total === 0 ? 0 : (amount / total) * 100;
  }

  protected ariaLabel(item: ICategoryAmount): string {
    const amount = this.currencyPipe.transform(item.amount);
    const percent = Math.round(this.percentOfTotal(item.amount));

    return `${this.label(item.category)}: ${amount}, ${percent}% of total`;
  }
}
