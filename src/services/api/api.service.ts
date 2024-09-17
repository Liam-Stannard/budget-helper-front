import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_EXPENSE } from './constants/api.service.constants';
import {
  ITransaction,
  ITransactionsResponse,
} from './interfaces/transaction.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  getExpense(): Observable<ITransactionsResponse> {
    return this.httpClient.get<ITransactionsResponse>(URL_EXPENSE);
  }

  deleteExpense(id: number): Observable<any> {
    return this.httpClient.delete<any>(`${URL_EXPENSE}/${id}`);
  }

  putExpense(expense: ITransaction): Observable<any> {
    return this.httpClient.put<any>(`${URL_EXPENSE}/${expense.id}`, expense);
  }

  postExpense(expense: ITransaction): Observable<any> {
    return this.httpClient.post<any>(URL_EXPENSE, expense);
  }
}
