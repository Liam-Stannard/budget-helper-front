import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_SHOPPING_LISTS } from './constants/api.service.constants';
import { IShoppingListsResponse } from './interfaces/api.service.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  getShoppingLists(): Observable<IShoppingListsResponse> {
    return this.httpClient.get<IShoppingListsResponse>(URL_SHOPPING_LISTS);
  }
}
