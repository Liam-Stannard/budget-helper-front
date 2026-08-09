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
      providers: [provideHttpClientTesting(), provideHttpClient()],
    });
    service = TestBed.inject(TransactionApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /*
  describe('getTransactions', () => {
    const getTransactionResponse: IGetTransactionsResponse = {
      transactions: [
        {
          id: 1,
          account: 'test',
          amount: '100.00',
          title: 'test',
          category: 'FOOD',
          date: '2020-01-01',
        },
      ],
    };

    service.getTransactions();

    const req = httpTestingController.expectOne('/api/transactions');

    expect(req.request.method).toEqual('GET');

    req.flush(getTransactionResponse);

    expect(service.getTransactionsResponseSignal()).toEqual(
      getTransactionResponse
    );

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });
  */
  describe('getTransaction', () => {});
  describe('deleteTransaction', () => {});
  describe('putTransaction', () => {});
  describe('postTransaction', () => {});
});
