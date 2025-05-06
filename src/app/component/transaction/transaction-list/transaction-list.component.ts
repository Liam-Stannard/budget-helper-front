import { Component, OnDestroy, OnInit, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TRANSACTION_LIST_TABLE_ROWS } from './interface/transaction-list.interface';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { APP_CONSTANTS } from '../../../app.constants';
import { ITransaction } from '../api/interfaces/transaction.interface';
import { TransactionApiService } from '../api/transaction-api.service';
import { AbstractComponent } from '../../abstract/abstract.component';

@Component({
  selector: 'transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected displayedColumns: string[] = TRANSACTION_LIST_TABLE_ROWS;

  protected data!: Signal<ITransaction[]>;
  protected error!: Signal<string | undefined>;

  constructor(private apiService: TransactionApiService) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.data = this.apiService.transactions;
    this.error = this.apiService.transactionsError;

    this.loading = false;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected add(): void {
    this.navigate(['transaction', APP_CONSTANTS.MODE_ADD]);
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
      this.apiService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          alert(
            `Deleted transaction ${transaction.title} - ${transaction.account} - ${transaction.amount}`
          );
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
