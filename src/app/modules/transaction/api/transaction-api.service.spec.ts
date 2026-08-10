import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TransactionApiService } from './transaction-api.service';

describe('ApiService', () => {
  let service: TransactionApiService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTransactionList', () => {
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    it('should request with no query params when none are given', () => {
      service.getTransactionList().subscribe();

      const req = httpTestingController.expectOne(
        (r) => r.url === '/api/v1/transaction'
      );
      expect(req.request.method).toEqual('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ transactionList: [], totalElements: 0, totalPages: 0 });

      httpTestingController.verify();
    });

    it('should only include the params that were provided', () => {
      service
        .getTransactionList({
          from: '2026-03-01',
          to: '2026-03-31',
          page: 1,
          size: 10,
          sort: 'date,desc',
        })
        .subscribe();

      const req = httpTestingController.expectOne(
        (r) => r.url === '/api/v1/transaction'
      );
      expect(req.request.params.get('from')).toBe('2026-03-01');
      expect(req.request.params.get('to')).toBe('2026-03-31');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('date,desc');
      req.flush({ transactionList: [], totalElements: 0, totalPages: 0 });

      httpTestingController.verify();
    });

    it('should include page 0 rather than omitting it', () => {
      service.getTransactionList({ page: 0 }).subscribe();

      const req = httpTestingController.expectOne(
        (r) => r.url === '/api/v1/transaction'
      );
      expect(req.request.params.get('page')).toBe('0');
      req.flush({ transactionList: [], totalElements: 0, totalPages: 0 });

      httpTestingController.verify();
    });
  });

  describe('getTransaction', () => {});
  describe('deleteTransaction', () => {});
  describe('putTransaction', () => {});
  describe('postTransaction', () => {});
});
