import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  Signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {
  IMatMenuButtonActionEvent,
  TRANSACTION_LIST_TABLE_COLUMNS,
} from './transaction-list.interfaces';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { ITransaction } from '../../shared/transaction.interface';

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
export class TransactionListComponent {
  [x: string]: any;
  @Input()
  tableData: ITransaction[] = [];

  @Output()
  actionTriggered = new EventEmitter<IMatMenuButtonActionEvent<ITransaction>>();

  protected columns: string[] = TRANSACTION_LIST_TABLE_COLUMNS;

  constructor() {}

  protected onClickEmitAction(action: IMatMenuButtonActionEvent<ITransaction>) {
    this.actionTriggered.emit(action);
  }
}
