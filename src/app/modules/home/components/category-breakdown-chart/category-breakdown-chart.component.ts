import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './category-breakdown-chart.component.html',
  styleUrl: './category-breakdown-chart.component.scss',
})
export class CategoryBreakdownChartComponent {
  @Input() data: ICategoryAmount[] = [];

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
}
