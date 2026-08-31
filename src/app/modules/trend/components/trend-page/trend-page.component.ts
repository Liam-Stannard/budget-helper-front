import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import dayjs from 'dayjs';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { dateRangeValidator } from '../../../../shared/validators/validator';
import { StatTileComponent } from '../../../home/components/stat-tile/stat-tile.component';
import { TransactionListAllService } from '../../../transaction/api/transaction-list-all.service';
import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { ITrendDateRangeForm } from './trend-page.interfaces';
import { filterExpenses, getTotalAmount } from './trend-page.utils';

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
    StatTileComponent,
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

  /** `undefined` until the first successful fetch, so the summary/empty-state only render
   * once the user has actually searched a range. */
  protected transactions = signal<ITransaction[] | undefined>(undefined);

  protected hasSearched = computed(() => this.transactions() !== undefined);

  protected transactionCount = computed(
    () => (this.transactions() ?? []).length
  );

  protected totalSpend = computed(() =>
    getTotalAmount(filterExpenses(this.transactions() ?? []))
  );

  /** Drives the actual fetch, decoupled from `submit()` itself, so `switchMap` can cancel
   * any in-flight request as soon as a new one is submitted - a stale response arriving
   * after a more recent submission is otherwise silently applied over it (`.subscribe()`
   * per submit has no such protection), which matters here because
   * `TransactionListAllService.getAllTransactions()` can involve several sequential/
   * concurrent HTTP requests and take noticeably longer than a single request. */
  private submit$ = new Subject<{ from: string; to: string }>();

  constructor(
    private fb: FormBuilder,
    private transactionListAllService: TransactionListAllService
  ) {
    super();
    this.form = this.formInit();

    this.submit$
      .pipe(
        switchMap((range) =>
          this.transactionListAllService.getAllTransactions(range).pipe(
            catchError((err) => {
              this.handleError('Failed to load transactions', err);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((res) => {
        this.transactions.set(res.transactionList);
        this.loading.set(false);
      });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // No data is fetched on init - the range is picked by the user - so don't show a spinner
    // until they've submitted the form.
    this.loading.set(false);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected formInit(): FormGroup<ITrendDateRangeForm> {
    return this.fb.nonNullable.group<ITrendDateRangeForm>(
      {
        from: this.fb.nonNullable.control(undefined, [Validators.required]),
        to: this.fb.nonNullable.control(undefined, [Validators.required]),
      },
      { validators: [dateRangeValidator('from', 'to')] }
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { from, to } = this.form.getRawValue();

    if (!from || !to) {
      return;
    }

    this.loading.set(true);
    this.submit$.next({
      from: dayjs(from).format('YYYY-MM-DD'),
      to: dayjs(to).format('YYYY-MM-DD'),
    });
  }
}
