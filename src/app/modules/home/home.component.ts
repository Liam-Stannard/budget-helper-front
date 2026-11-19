import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import dayjs from 'dayjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AbstractComponent } from '../../core/component/abstract/abstract.component';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { ITransaction } from '../transaction/shared/transaction.interface';
import { AccountApiService } from '../account/api/account-api.service';
import { IAccount } from '../account/shared/account.interface';
import { BudgetApiService } from '../budget/api/budget-api.service';
import { IBudget } from '../budget/shared/budget.interface';
import { StatTileComponent } from './components/stat-tile/stat-tile.component';
import { BudgetProgressComponent } from './components/budget-progress/budget-progress.component';
import { SpendingPaceComponent } from './components/spending-pace/spending-pace.component';
import { AccountBalancesComponent } from './components/account-balances/account-balances.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { BillsDueComponent } from './components/bills-due/bills-due.component';
import {
  currentAndPreviousMonthRange,
  filterCurrentMonth,
  filterExpenses,
  filterPreviousMonth,
  getMonthOverMonthDelta,
  getTotalAmount,
  sumByCategory,
} from './home.utils';
import {
  filterIncome,
  getBillsDue,
  getBudgetProgress,
  getNetSummary,
  getNetWorth,
  getRecentTransactions,
  getSpendingPace,
} from './dashboard.utils';

const RECENT_TRANSACTION_COUNT = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    StatTileComponent,
    BudgetProgressComponent,
    SpendingPaceComponent,
    AccountBalancesComponent,
    RecentTransactionsComponent,
    BillsDueComponent,
  ],
  providers: [CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  // Transactions drive almost every card, so they gate the loading bar. Accounts and budgets load
  // independently: if either fails, its card degrades instead of blanking the whole dashboard.
  protected readonly currentMonthLabel = dayjs().format('MMMM YYYY');

  protected transactions = signal<ITransaction[]>([]);
  protected accounts = signal<IAccount[]>([]);
  protected accountsLoaded = signal(false);
  protected budgets = signal<IBudget[]>([]);

  protected currentMonthTransactions = computed(() =>
    filterCurrentMonth(this.transactions())
  );

  protected previousMonthTransactions = computed(() =>
    filterPreviousMonth(this.transactions())
  );

  private currentMonthExpenses = computed(() =>
    filterExpenses(this.currentMonthTransactions())
  );

  protected summary = computed(() =>
    getNetSummary(
      getTotalAmount(filterIncome(this.currentMonthTransactions())),
      getTotalAmount(this.currentMonthExpenses())
    )
  );

  protected pace = computed(() =>
    getSpendingPace(
      this.currentMonthExpenses(),
      filterExpenses(this.previousMonthTransactions())
    )
  );

  /** Like-for-like: spend so far vs last month's spend by the same day, not its full total. */
  protected spentDelta = computed(() => {
    const pace = this.pace();
    return getMonthOverMonthDelta(pace.spentSoFar, pace.lastMonthToSameDay);
  });

  protected spentDeltaIsGood = computed(() => this.spentDelta().changeAmount <= 0);

  protected spentDeltaText = computed(() => {
    const delta = this.spentDelta();

    if (delta.changePercent === undefined) {
      return undefined;
    }

    const arrow = delta.changeAmount >= 0 ? '▲' : '▼';
    const amount = this.currencyPipe.transform(Math.abs(delta.changeAmount));
    const percent = Math.abs(Math.round(delta.changePercent));

    return `${arrow} ${amount} (${percent}%) vs this point last month`;
  });

  protected savingsText = computed(() => {
    const rate = this.summary().savingsRate;
    if (rate === undefined) {
      return 'No income recorded yet';
    }
    return `${Math.round(rate)}% of income ${rate >= 0 ? 'saved' : 'overspent'}`;
  });

  protected netWorth = computed(() => getNetWorth(this.accounts()));

  protected budgetRows = computed(() =>
    getBudgetProgress(sumByCategory(this.currentMonthExpenses()), this.budgets())
  );

  protected totalBudget = computed(() => {
    const budgets = this.budgets();
    if (budgets.length === 0) {
      return undefined;
    }
    return budgets.reduce((sum, budget) => sum + Number(budget.monthlyLimit), 0);
  });

  protected monthElapsedPercent = computed(() => {
    const pace = this.pace();
    return (pace.dayOfMonth / pace.daysInMonth) * 100;
  });

  protected recentTransactions = computed(() =>
    getRecentTransactions(this.transactions(), RECENT_TRANSACTION_COUNT)
  );

  protected billsDue = computed(() =>
    getBillsDue(this.currentMonthTransactions(), this.previousMonthTransactions())
  );

  constructor(
    private transactionApiService: TransactionApiService,
    private accountApiService: AccountApiService,
    private budgetApiService: BudgetApiService,
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

    this.transactionApiService
      .getTransactionList({ from, to, size: 200 })
      .subscribe({
        next: (res) => {
          this.transactions.set(res.transactionList);
          this.loading.set(false);
        },
        error: (err) => {
          this.handleError('Failed to load transactions', err);
        },
      });

    this.accountApiService.getAccountList().subscribe({
      next: (res) => {
        this.accounts.set(res.accountList);
        this.accountsLoaded.set(true);
      },
      error: (err) => {
        this.errorNotifier.notify('Failed to load accounts', err);
      },
    });

    this.budgetApiService.getBudgetList().subscribe({
      next: (res) => {
        this.budgets.set(res.budgetList);
      },
      error: (err) => {
        this.errorNotifier.notify('Failed to load budgets', err);
      },
    });
  }
}
