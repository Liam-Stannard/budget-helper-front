import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { IAccount } from '../../../account/shared/account.interface';

@Component({
  selector: 'app-account-balances',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    MatButtonModule,
    MatListModule,
  ],
  templateUrl: './account-balances.component.html',
  styleUrl: './account-balances.component.scss',
})
export class AccountBalancesComponent {
  @Input() accounts: IAccount[] = [];

  protected balance(account: IAccount): number {
    return Number(account.currentBalance ?? 0);
  }
}
