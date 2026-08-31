import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import dayjs from 'dayjs';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { dateRangeValidator } from '../../../../shared/validators/validator';
import { MenuOption } from '../../../../shared/interface/menu-options.interfaces';
import { StatTileComponent } from '../../../home/components/stat-tile/stat-tile.component';
import { AccountApiService } from '../../../account/api/account-api.service';
import { IAccount } from '../../../account/shared/account.interface';
import { TransactionListAllService } from '../../../transaction/api/transaction-list-all.service';
import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { Category } from '../../../transaction/shared/transaction.types';
import { CATEGORY_OPTIONS } from '../../../transaction/shared/transcations.constants';
import { TrendLineChartComponent } from './components/trend-line-chart/trend-line-chart.component';
import { ITrendDateRangeForm } from './trend-page.interfaces';
import {
  bucketTransactions,
  filterByCategories,
  getSpendTransactions,
  getTotalSpend,
} from './trend-page.utils';

@Component({
  selector: 'app-trend-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    StatTileComponent,
    TrendLineChartComponent,
  ],
  providers: [CurrencyPipe],
  templateUrl: './trend-page.component.html',
  styleUrl: './trend-page.component.scss',
})
export class TrendPageComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected form: FormGroup<ITrendDateRangeForm>;

  protected categoryOptions: MenuOption<string, Category>[] = CATEGORY_OPTIONS;

  protected accounts = signal<IAccount[]>([]);

  /** `undefined` until the first successful fetch, so the summary/empty-state only render
   * once the user has actually searched a range. */
  protected transactions = signal<ITransaction[] | undefined>(undefined);

  /** The `from`/`to` bounds of the last successfully-fetched range, kept alongside
   * `transactions` (rather than read live off the form) so the trend chart buckets the full
   * range the user actually searched - including any leading/trailing buckets with no
   * transactions - even while they're mid-edit on a new, not-yet-submitted date range. */
  protected submittedRange = signal<{ from: string; to: string } | undefined>(
    undefined
  );

  /** Live value of the category filter - the backend only supports filtering to a single
   * category per request, so a multi-select is instead applied client-side against the
   * already-fetched (unfiltered-by-category) range, rather than driving a second/separate
   * fetch path. Since applying it doesn't require a fetch, it tracks the categories control
   * directly rather than being snapshotted at submit time, so toggling a category applies
   * instantly - unlike the date range/account filter, which do drive a fetch and so still
   * require submit. */
  private appliedCategories!: Signal<Category[]>;

  protected filteredTransactions = computed(() =>
    filterByCategories(this.transactions() ?? [], this.appliedCategories())
  );

  protected hasSearched = computed(() => this.transactions() !== undefined);

  protected transactionCount = computed(
    () => this.filteredTransactions().length
  );

  protected totalSpend = computed(() =>
    getTotalSpend(this.filteredTransactions(), this.appliedCategories())
  );

  /** Same "spend" set the total spend tile sums - shared so the chart's bucket totals always
   * add up to that tile's figure. */
  private spendTransactions = computed(() =>
    getSpendTransactions(this.filteredTransactions(), this.appliedCategories())
  );

  protected trendBuckets = computed(() => {
    const range = this.submittedRange();

    if (!range) {
      return [];
    }

    return bucketTransactions(this.spendTransactions(), range.from, range.to);
  });

  /** Drives the actual fetch, decoupled from `submit()` itself, so `switchMap` can cancel
   * any in-flight request as soon as a new one is submitted - a stale response arriving
   * after a more recent submission is otherwise silently applied over it (`.subscribe()`
   * per submit has no such protection), which matters here because
   * `TransactionListAllService.getAllTransactions()` can involve several sequential/
   * concurrent HTTP requests and take noticeably longer than a single request. */
  private submit$ = new Subject<{
    from: string;
    to: string;
    accountId?: number;
  }>();

  constructor(
    private fb: FormBuilder,
    private transactionListAllService: TransactionListAllService,
    private accountApiService: AccountApiService
  ) {
    super();
    this.form = this.formInit();
    this.appliedCategories = toSignal(
      this.form.controls.categories.valueChanges,
      { initialValue: this.form.controls.categories.value }
    );

    this.submit$
      .pipe(
        switchMap((range) =>
          this.transactionListAllService.getAllTransactions(range).pipe(
            map((res) => ({ res, range })),
            catchError((err) => {
              this.handleError('Failed to load transactions', err);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(({ res, range }) => {
        this.transactions.set(res.transactionList);
        this.submittedRange.set({ from: range.from, to: range.to });
        this.loading.set(false);
      });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // No data is fetched on init - the range is picked by the user - so don't show a spinner
    // until they've submitted the form.
    this.loading.set(false);
    this.loadAccounts();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected loadAccounts(): void {
    this.accountApiService.getAccountList().subscribe({
      next: (res) => {
        this.accounts.set(res.accountList);
      },
      error: (err) => {
        this.errorNotifier.notify('Failed to load accounts', err);
      },
    });
  }

  protected formInit(): FormGroup<ITrendDateRangeForm> {
    return this.fb.nonNullable.group<ITrendDateRangeForm>(
      {
        from: this.fb.nonNullable.control(undefined, [Validators.required]),
        to: this.fb.nonNullable.control(undefined, [Validators.required]),
        accountId: this.fb.nonNullable.control<number | undefined>(
          undefined
        ),
        categories: this.fb.nonNullable.control<Category[]>([]),
      },
      { validators: [dateRangeValidator('from', 'to')] }
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { from, to, accountId } = this.form.getRawValue();

    if (!from || !to) {
      return;
    }

    this.loading.set(true);
    this.submit$.next({
      from: dayjs(from).format('YYYY-MM-DD'),
      to: dayjs(to).format('YYYY-MM-DD'),
      // The "All accounts" option's value is `undefined`, but an untouched/reset select
      // control's raw value comes back as `null` rather than `undefined` - normalize both
      // to `undefined` so callers/tests only ever see one "unset" representation.
      accountId: accountId ?? undefined,
    });
  }
}
