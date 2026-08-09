import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AbstractComponent } from '../../core/component/abstract/abstract.component';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { CATEGORY_OPTIONS } from '../transaction/shared/transcations.constants';
import { StatTileComponent } from './components/stat-tile/stat-tile.component';
import { CategoryBreakdownChartComponent } from './components/category-breakdown-chart/category-breakdown-chart.component';
import {
  filterCurrentMonth,
  getTopCategory,
  getTotalAmount,
  sumByCategory,
} from './home.utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    StatTileComponent,
    CategoryBreakdownChartComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected transactions = signal<ITransaction[]>([]);

  protected currentMonthTransactions = computed(() =>
    filterCurrentMonth(this.transactions())
  );

  protected totalThisMonth = computed(() =>
    getTotalAmount(this.currentMonthTransactions())
  );

  protected countThisMonth = computed(
    () => this.currentMonthTransactions().length
  );

  protected breakdown = computed(() => sumByCategory(this.transactions()));

  protected topCategoryLabel = computed(() => {
    const top = getTopCategory(this.breakdown());

    if (!top) {
      return 'Not started';
    }

    return (
      CATEGORY_OPTIONS.find((option) => option.value === top.category)
        ?.view ?? top.category
    );
  });

  constructor(private transactionApiService: TransactionApiService) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.getData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected getData(): void {
    this.transactionApiService.getTransactionList().subscribe({
      next: (res) => {
        this.transactions.set(res.transactionList);
        this.loading.set(false);
      },
    });
  }
}
