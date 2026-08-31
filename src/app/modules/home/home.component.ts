import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { AbstractComponent } from '../../core/component/abstract/abstract.component';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { CATEGORY_OPTIONS } from '../transaction/shared/transcations.constants';
import { AccountApiService } from '../account/api/account-api.service';
import { IAccount } from '../account/shared/account.interface';
import { StatTileComponent } from './components/stat-tile/stat-tile.component';
import { CategoryBreakdownChartComponent } from './components/category-breakdown-chart/category-breakdown-chart.component';
import { SpendingByAccountChartComponent } from './components/spending-by-account-chart/spending-by-account-chart.component';
import {
  currentAndPreviousMonthRange,
  filterCurrentMonth,
  filterExpenses,
  filterPreviousMonth,
  getMonthOverMonthDelta,
  getTopCategory,
  getTotalAmount,
  sumByAccount,
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
    SpendingByAccountChartComponent,
  ],
  providers: [CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected transactions = signal<ITransaction[]>([]);

  protected accounts = signal<IAccount[]>([]);

  protected currentMonthTransactions = computed(() =>
    filterCurrentMonth(this.transactions())
  );

  protected totalThisMonth = computed(() =>
    getTotalAmount(filterExpenses(this.currentMonthTransactions()))
  );

  protected countThisMonth = computed(
    () => this.currentMonthTransactions().length
  );

  protected previousMonthTransactions = computed(() =>
    filterPreviousMonth(this.transactions())
  );

  protected totalLastMonth = computed(() =>
    getTotalAmount(filterExpenses(this.previousMonthTransactions()))
  );

  protected monthDelta = computed(() =>
    getMonthOverMonthDelta(this.totalThisMonth(), this.totalLastMonth())
  );

  protected deltaIsGood = computed(() => this.monthDelta().changeAmount <= 0);

  protected deltaText = computed(() => {
    const delta = this.monthDelta();

    if (delta.changePercent === undefined) {
      return undefined;
    }

    const arrow = delta.changeAmount >= 0 ? '▲' : '▼';
    const amount = this.currencyPipe.transform(Math.abs(delta.changeAmount));
    const percent = Math.abs(Math.round(delta.changePercent));

    return `${arrow} ${amount} (${percent}%) vs last month`;
  });

  protected breakdown = computed(() =>
    sumByCategory(filterExpenses(this.currentMonthTransactions()))
  );

  protected accountBreakdown = computed(() =>
    sumByAccount(
      filterExpenses(this.currentMonthTransactions()),
      this.accounts()
    )
  );

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

  constructor(
    private transactionApiService: TransactionApiService,
    private accountApiService: AccountApiService,
    private currencyPipe: CurrencyPipe
  ) {
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
    const { from, to } = currentAndPreviousMonthRange();

    forkJoin({
      transactions: this.transactionApiService.getTransactionList({
        from,
        to,
        size: 200,
      }),
      accounts: this.accountApiService.getAccountList(),
    }).subscribe({
      next: ({ transactions, accounts }) => {
        this.transactions.set(transactions.transactionList);
        this.accounts.set(accounts.accountList);
        this.loading.set(false);
      },
      error: (err) => {
        this.handleError('Failed to load transactions', err);
      },
    });
  }
}
