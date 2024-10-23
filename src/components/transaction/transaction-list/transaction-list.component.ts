import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ITransaction } from '../../../services/api/interfaces/transaction.interface';
import { map, Observable, takeUntil } from 'rxjs';
import { AbstractNetworkingComponent } from '../../abstract/abstract-networking.component';
import { MatIconModule } from '@angular/material/icon';
import { TRANSACTION_LIST_TABLE_ROWS } from './interface/transaction-list.interface';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { APP_CONSTANTS } from '../../../app/app.constants';

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
  extends AbstractNetworkingComponent<ITransaction[], never>
  implements OnInit, OnDestroy
{
  displayedColumns: string[] = TRANSACTION_LIST_TABLE_ROWS;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected override getObservableForGet(): Observable<ITransaction[]> {
    return this.apiService.getTransactions().pipe(
      map((response) => {
        return response.transactions;
      })
    );
  }

  protected add(): void {
    this.navigate(['transaction', APP_CONSTANTS.MODE_ADD]);
  }

  protected edit(transaction: ITransaction): void {
    this.router.navigate([
      'transaction',
      APP_CONSTANTS.MODE_EDIT,
      transaction.id,
    ]);
  }

  protected delete(transaction: ITransaction): void {
    console.log('deleting', transaction.id);
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
          this.getData();
        },
        error: () => {
          alert(
            `Delete transaction failed for ${transaction.title} - ${transaction.account} - ${transaction.amount}`
          );
          this.getData();
        },
      });
    }
  }
}
