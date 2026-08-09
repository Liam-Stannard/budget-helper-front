import { Component, OnDestroy, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-transaction-list-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
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

  protected getData(): void {
    this.transactionApiService.getTransactionList().subscribe({
      next: (res) => {
        this.data.set(res.transactionList);
        this.loading.set(false);
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
        error: () => {
          this.snackBar.open(
            `Delete transaction failed for ${transaction.title}`,
            'Dismiss',
            { duration: 3000 }
          );
        },
      });
    });
  }
}
