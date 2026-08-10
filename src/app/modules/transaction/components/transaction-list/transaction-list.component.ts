import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import {
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
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
export class TransactionListComponent implements OnChanges {
  @Input()
  tableData: ITransaction[] = [];

  /** Total row count across every page, not just `tableData.length` — drives the paginator. */
  @Input()
  totalElements = 0;

  @Input()
  pageIndex = 0;

  @Input()
  pageSize = 10;

  @Input()
  sortActive = 'date';

  @Input()
  sortDirection: SortDirection = 'desc';

  @Output()
  actionTriggered =
    new EventEmitter<IMatMenuButtonActionEvent<ITransaction>>();

  @Output()
  pageChanged = new EventEmitter<PageEvent>();

  @Output()
  sortChanged = new EventEmitter<Sort>();

  protected columns: string[] = TRANSACTION_LIST_TABLE_COLUMNS;
  protected dataSource = new MatTableDataSource<ITransaction>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableData']) {
      this.dataSource.data = this.tableData;
    }
  }

  protected onClickEmitAction(
    action: IMatMenuButtonActionEvent<ITransaction>
  ) {
    this.actionTriggered.emit(action);
  }

  protected onPage(event: PageEvent): void {
    this.pageChanged.emit(event);
  }

  protected onSort(sort: Sort): void {
    this.sortChanged.emit(sort);
  }
}
