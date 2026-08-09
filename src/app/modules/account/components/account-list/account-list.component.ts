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
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { IMatMenuButtonActionEvent } from '../../../transaction/components/transaction-list/transaction-list.interfaces';
import { ACCOUNT_LIST_TABLE_COLUMNS } from './account-list.interfaces';
import { IAccount } from '../../shared/account.interface';

@Component({
  selector: 'account-list',
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
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss',
})
export class AccountListComponent implements OnChanges, AfterViewInit {
  @Input()
  tableData: IAccount[] = [];

  @Output()
  actionTriggered = new EventEmitter<IMatMenuButtonActionEvent<IAccount>>();

  @ViewChild(MatSort) private sort!: MatSort;
  @ViewChild(MatPaginator) private paginator!: MatPaginator;

  protected columns: string[] = ACCOUNT_LIST_TABLE_COLUMNS;
  protected dataSource = new MatTableDataSource<IAccount>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableData']) {
      this.dataSource.data = this.tableData;
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  protected onClickEmitAction(action: IMatMenuButtonActionEvent<IAccount>) {
    this.actionTriggered.emit(action);
  }
}
