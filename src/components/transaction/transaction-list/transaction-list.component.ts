import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ITransaction } from '../../../services/api/interfaces/transaction.interface';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api/api.service';
import { BaseNetworkingComponent } from '../../base/base-networking.component';
import { Router } from '@angular/router';

@Component({
  selector: 'transaction-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent
  extends BaseNetworkingComponent<ITransaction[]>
  implements OnInit, OnDestroy
{
  constructor(protected apiService: ApiService,
    protected router: Router
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected override getData(): Observable<ITransaction[]> {
    return this.apiService.getExpense().pipe(
      map((response) => {
        return response.expenses;
      })
    );
  }

  protected edit(expense: ITransaction): void {
this.router.navigate([])
  }

  protected delete(expense: ITransaction): void {
    console.log('deleting', expense.id);
    if (
      confirm(
        `Are you sure to delete transaction ${expense.title} - ${expense.account} - ${expense.amount}`
      )
    ) {
      this.apiService.deleteExpense(expense.id).subscribe({
        next: () => {
          alert(
            `Deleted transaction ${expense.title} - ${expense.account} - ${expense.amount}`
          );
          this.reloadData();
        },
        error: () => {
          alert(
            `Delete transaction failed for ${expense.title} - ${expense.account} - ${expense.amount}`
          );
          this.reloadData();
        },
      });
    }
  }
}
