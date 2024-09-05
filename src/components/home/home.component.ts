import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base.component';
import { IShoppingListsResponse } from '../../services/api/interfaces/api.service.interfaces';
import { ApiService } from '../../services/api/api.service';
import { Observable } from 'rxjs';
import { ShoppingListCardComponent } from '../../app/shopping-list-card/shopping-list-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ShoppingListCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent
  extends BaseComponent<IShoppingListsResponse>
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

  protected override getObservable(): Observable<IShoppingListsResponse> {
    return this.apiService.getShoppingLists();
  }
}
