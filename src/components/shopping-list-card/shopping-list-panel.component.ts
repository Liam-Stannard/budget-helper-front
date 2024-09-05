import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IShoppingList,
  IShoppingListsResponse,
} from '../../services/api/interfaces/api.service.interfaces';

@Component({
  selector: 'app-shopping-list-panel',
  standalone: true,
  imports: [],
  templateUrl: './shopping-list-panel.component.html',
  styleUrl: './shopping-list-panel.component.scss',
})
export class ShoppingListPanelComponent implements OnInit, OnDestroy {
  @Input()
  protected data!: IShoppingList;

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
