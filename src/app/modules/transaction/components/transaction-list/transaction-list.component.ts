import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
    MatSortModule,
    MatPaginatorModule,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent implements OnChanges, AfterViewInit {
  @Input()
  tableData: ITransaction[] = [];

  @Output()
  actionTriggered =
    new EventEmitter<IMatMenuButtonActionEvent<ITransaction>>();

  @ViewChild(MatSort) private sort!: MatSort;
  @ViewChild(MatPaginator) private paginator!: MatPaginator;

  protected columns: string[] = TRANSACTION_LIST_TABLE_COLUMNS;
  protected dataSource = new MatTableDataSource<ITransaction>([]);

  constructor() {
    this.dataSource.sortingDataAccessor = (item, property) =>
      property === 'account'
        ? item.account.name
        : (item as unknown as Record<string, string>)[property];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableData']) {
      this.dataSource.data = this.tableData;
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  protected onClickEmitAction(
    action: IMatMenuButtonActionEvent<ITransaction>
  ) {
    this.actionTriggered.emit(action);
  }
}
