import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';
import { CommonModule } from '@angular/common';
import { AbstractComponent } from '../../components/abstract/abstract.component';
import { TransactionListComponent } from '../../components/transaction/transaction-list/transaction-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TransactionListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
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
