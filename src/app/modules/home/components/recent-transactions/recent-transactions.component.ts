import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ITransaction } from '../../../transaction/shared/transaction.interface';
import { APP_CONSTANTS } from '../../../../app.constants';
import { CATEGORY_COLOR_VAR, categoryLabel } from '../../../transaction/shared/category.utils';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './recent-transactions.component.html',
  styleUrl: './recent-transactions.component.scss',
})
export class RecentTransactionsComponent {
  @Input() transactions: ITransaction[] = [];

  protected readonly viewMode = APP_CONSTANTS.MODE_VIEW;
  protected readonly addMode = APP_CONSTANTS.MODE_ADD;
  protected label = categoryLabel;

  protected color(transaction: ITransaction): string {
    return CATEGORY_COLOR_VAR[transaction.category];
  }

  protected isIncome(transaction: ITransaction): boolean {
    return transaction.category === 'INCOME';
  }

  protected amount(transaction: ITransaction): number {
    return Number(transaction.amount);
  }
}
