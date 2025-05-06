import { Component } from '@angular/core';
import { TransactionCardComponent } from '../../../component/transaction/transaction-card/transaction-card.component';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [TransactionCardComponent],
  templateUrl: './transaction-details.component.html',
  styleUrl: './transaction-details.component.scss',
})
export class TransactionDetailsComponent {}
