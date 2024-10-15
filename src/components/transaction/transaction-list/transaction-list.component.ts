import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ITransaction } from '../../../services/api/interfaces/transaction.interface';
import { map, Observable, takeUntil } from 'rxjs';
import { BaseNetworkingComponent } from '../../base/base-networking.component';
import { MatIconModule } from '@angular/material/icon';
import { TRANSACTION_LIST_TABLE_ROWS } from './interface/transaction-list.interface';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

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
  extends BaseNetworkingComponent<ITransaction[], never>
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

  protected override getData(): Observable<ITransaction[]> {
    return this.apiService.getTransactions().pipe(
      map((response) => {
        return response.transactions;
      })
    );
  }

  protected add(): void {
    this.navigate(['transaction/add']);
  }

  protected edit(transaction: ITransaction): void {
    this.router.navigate([]);
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
          this.reloadData();
        },
        error: () => {
          alert(
            `Delete transaction failed for ${transaction.title} - ${transaction.account} - ${transaction.amount}`
          );
          this.reloadData();
        },
      });
    }
  }
}
