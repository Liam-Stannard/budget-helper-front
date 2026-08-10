import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { APP_CONSTANTS } from '../../../../app.constants';
import { IMatMenuButtonActionEvent } from '../transaction-list/transaction-list.interfaces';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { TransactionApiService } from '../../api/transaction-api.service';
import { ITransaction } from '../../shared/transaction.interface';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  formatPeriodLabel,
  PERIOD_OPTIONS,
  periodDateRange,
  PeriodType,
  shiftPeriod,
} from './transaction-list-wrapper.utils';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-transaction-list-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    TransactionListComponent,
  ],
  templateUrl: './transaction-list-wrapper.component.html',
  styleUrl: './transaction-list-wrapper.component.scss',
})
export class TransactionListWrapperComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected data = signal<ITransaction[]>([]);
  protected totalElements = signal(0);

  protected periodOptions = PERIOD_OPTIONS;
  protected period = signal<PeriodType>('month');
  protected referenceDate = signal<Dayjs>(dayjs());
  protected pageIndex = signal(0);
  protected pageSize = signal(DEFAULT_PAGE_SIZE);
  protected sortField = signal('date');
  protected sortDirection = signal<'asc' | 'desc'>('desc');

  protected periodLabel = computed(() =>
    formatPeriodLabel(this.referenceDate(), this.period())
  );

  constructor(
    private transactionApiService: TransactionApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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

  protected setPeriod(period: PeriodType): void {
    this.period.set(period);
    this.referenceDate.set(dayjs());
    this.pageIndex.set(0);
    this.getData();
  }

  protected goToPreviousPeriod(): void {
    this.referenceDate.update((date) =>
      shiftPeriod(date, this.period(), -1)
    );
    this.pageIndex.set(0);
    this.getData();
  }

  protected goToNextPeriod(): void {
    this.referenceDate.update((date) => shiftPeriod(date, this.period(), 1));
    this.pageIndex.set(0);
    this.getData();
  }

  protected goToToday(): void {
    this.referenceDate.set(dayjs());
    this.pageIndex.set(0);
    this.getData();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.getData();
  }

  protected onSortChange(sort: Sort): void {
    if (!sort.direction) {
      return;
    }
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.pageIndex.set(0);
    this.getData();
  }

  protected getData(): void {
    const { from, to } = periodDateRange(this.referenceDate(), this.period());

    this.loading.set(true);
    this.transactionApiService
      .getTransactionList({
        from,
        to,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: `${this.sortField()},${this.sortDirection()}`,
      })
      .subscribe({
        next: (res) => {
          this.data.set(res.transactionList);
          this.totalElements.set(res.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.handleError('Failed to load transactions', err);
        },
      });
  }

  protected triggerAction(
    event: IMatMenuButtonActionEvent<ITransaction>
  ): void {
    switch (event.action) {
      case APP_CONSTANTS.ACTION_EDIT:
        this.edit(event.item);
        break;

      case APP_CONSTANTS.ACTION_DELETE:
        this.delete(event.item);
    }
  }

  protected edit(transaction: ITransaction): void {
    if (!transaction.id) {
      throw Error('Transaction should have an ID');
    }

    this.navigate([
      'transaction',
      APP_CONSTANTS.MODE_EDIT,
      transaction.id.toString(),
    ]);
  }

  protected delete(transaction: ITransaction): void {
    if (!transaction.id) {
      throw Error('Transaction should have an ID');
    }

    const id = transaction.id;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete transaction',
        message: `Are you sure you want to delete ${transaction.title} - ${transaction.account} - ${transaction.amount}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.transactionApiService.deleteTransaction(id).subscribe({
        next: () => {
          this.snackBar.open(
            `Deleted transaction ${transaction.title}`,
            'Dismiss',
            { duration: 3000 }
          );
          this.getData();
        },
        error: (err) => {
          this.errorNotifier.notify(
            `Delete transaction failed for ${transaction.title}`,
            err
          );
        },
      });
    });
  }
}
