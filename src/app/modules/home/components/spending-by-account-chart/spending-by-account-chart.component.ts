import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IAccountAmount } from '../../home.utils';

@Component({
  selector: 'app-spending-by-account-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './spending-by-account-chart.component.html',
  styleUrl: './spending-by-account-chart.component.scss',
})
export class SpendingByAccountChartComponent {
  @Input() data: IAccountAmount[] = [];

  constructor(private currencyPipe: CurrencyPipe) {}

  protected widthPercent(amount: number): number {
    const max = Math.max(...this.data.map((item) => item.amount), 1);
    return (amount / max) * 100;
  }

  protected percentOfTotal(amount: number): number {
    const total = this.data.reduce((sum, item) => sum + item.amount, 0);
    return total === 0 ? 0 : (amount / total) * 100;
  }

  protected ariaLabel(item: IAccountAmount): string {
    const amount = this.currencyPipe.transform(item.amount);
    const percent = Math.round(this.percentOfTotal(item.amount));

    return `${item.accountName}: ${amount}, ${percent}% of total`;
  }
}
