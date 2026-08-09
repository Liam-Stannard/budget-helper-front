import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { TransactionListWrapperComponent } from '../transaction-list-wrapper/transaction-list-wrapper.component';

@Component({
  selector: 'app-transaction-page',
  standalone: true,
  imports: [CommonModule, TransactionListWrapperComponent],
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss',
})
export class TransactionPageComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  constructor() {
    super();
  }
  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
