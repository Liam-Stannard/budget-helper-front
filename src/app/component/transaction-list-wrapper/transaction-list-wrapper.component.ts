import { Component, OnDestroy, OnInit, Signal } from '@angular/core';
import { APP_CONSTANTS } from '../../app.constants';
import { AbstractComponent } from '../abstract/abstract.component';
import { ITransaction } from '../transaction/api/interfaces/transaction.interface';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { IMatMenuButtonActionEvent } from '../transaction/transaction-list/interface/transaction-list.interface';
import { TransactionListComponent } from '../transaction/transaction-list/transaction-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-list-wrapper',
  standalone: true,
  imports: [CommonModule, TransactionListComponent],
  templateUrl: './transaction-list-wrapper.component.html',
  styleUrl: './transaction-list-wrapper.component.scss',
})
export class TransactionListWrapperComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected data!: ITransaction[];

  constructor(private transactionApiService: TransactionApiService) {
    super();
  }

  override ngOnInit(): void {
    this.getData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected getData(): void {
    this.transactionApiService.getTransactionList().subscribe({
      next: (res) => {
        this.data = res.transactionList;
        this.loading = false;
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

    if (
      confirm(
        `Are you sure to delete transaction ${transaction.title} - ${transaction.account} - ${transaction.amount}`
      )
    ) {
      this.transactionApiService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          alert(
            `Deleted transaction ${transaction.title} - ${transaction.account} - ${transaction.amount}`
          );
          this.getData();
        },
        error: () => {
          alert(
            `Delete transaction failed for ${transaction.title} - ${transaction.account} - ${transaction.amount}`
          );
        },
      });
    }
  }
}
