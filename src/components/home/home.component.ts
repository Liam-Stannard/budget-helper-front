import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base.component';
import { ITransactionsResponse } from '../../services/api/interfaces/transaction.interface';
import { ApiService } from '../../services/api/api.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TransactionListComponent } from '../transaction/transaction-list/transaction-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TransactionListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  constructor(protected apiService: ApiService) {
    super();
  }
  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
