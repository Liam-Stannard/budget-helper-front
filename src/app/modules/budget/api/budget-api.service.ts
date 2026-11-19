import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_BUDGET_BASE } from './budget-api.service.constants';
import {
  BudgetCategory,
  IGetBudgetListResponse,
  IPutBudgetRequest,
  IPutBudgetResponse,
} from '../shared/budget.interface';

@Injectable({
  providedIn: 'root',
})
export class BudgetApiService {
  constructor(private httpClient: HttpClient) {}

  getBudgetList(): Observable<IGetBudgetListResponse> {
    return this.httpClient.get<IGetBudgetListResponse>(URL_BUDGET_BASE);
  }

  /** Creates or replaces the monthly limit for a category. */
  putBudget(
    category: BudgetCategory,
    monthlyLimit: string
  ): Observable<IPutBudgetResponse> {
    const body: IPutBudgetRequest = { monthlyLimit };
    return this.httpClient.put<IPutBudgetResponse>(
      `${URL_BUDGET_BASE}/${category}`,
      body
    );
  }

  deleteBudget(category: BudgetCategory): Observable<void> {
    return this.httpClient.delete<void>(`${URL_BUDGET_BASE}/${category}`);
  }
}
