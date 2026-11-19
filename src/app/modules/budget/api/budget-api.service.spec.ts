import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BudgetApiService } from './budget-api.service';

describe('BudgetApiService', () => {
  let service: BudgetApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BudgetApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should GET the budget list', () => {
    service.getBudgetList().subscribe();

    const req = httpTestingController.expectOne('/api/v1/budget');

    expect(req.request.method).toBe('GET');

    req.flush({ budgetList: [] });
  });

  it('should PUT the monthly limit to the category path', () => {
    service.putBudget('FOOD', '250.00').subscribe();

    const req = httpTestingController.expectOne('/api/v1/budget/FOOD');

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ monthlyLimit: '250.00' });

    req.flush({ budget: { category: 'FOOD', monthlyLimit: '250.0000' } });
  });

  it('should DELETE the category path', () => {
    service.deleteBudget('BILL').subscribe();

    const req = httpTestingController.expectOne('/api/v1/budget/BILL');

    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
