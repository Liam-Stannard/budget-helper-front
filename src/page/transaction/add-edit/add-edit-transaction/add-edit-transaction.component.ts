import { Component } from '@angular/core';
import { TransactionCardComponent } from '../../../../component/transaction/transaction-card/transaction-card.component';

@Component({
  selector: 'app-add-edit-transaction',
  standalone: true,
  imports: [TransactionCardComponent],
  templateUrl: './add-edit-transaction.component.html',
  styleUrl: './add-edit-transaction.component.scss',
})
export class AddEditTransactionComponent {}
