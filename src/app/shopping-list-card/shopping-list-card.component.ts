import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IShoppingItem,
  IShoppingList,
} from '../../services/api/interfaces/api.service.interfaces';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shopping-list-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './shopping-list-card.component.html',
  styleUrl: './shopping-list-card.component.scss',
})
export class ShoppingListCardComponent implements OnInit, OnDestroy {
  @Input()
  public data!: IShoppingList;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  protected edit(): void {
    console.log('edit - ', this.data.name);
  }

  protected delete(): void {
    console.log('delete - ', this.data.name);
  }
}
