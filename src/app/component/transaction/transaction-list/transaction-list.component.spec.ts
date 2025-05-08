import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../../service/auth/auth.service';
import { MockAuthService } from '../../../../test/mockService';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  HttpResult,
  TransactionApiService,
} from '../api/transaction-api.service';
import { Signal, signal } from '@angular/core';
import {
  IGetTransactionListResponse,
  ITransaction,
} from '../api/interfaces/transaction.interface';
import { AbstractComponent } from '../../abstract/abstract.component';

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: 'test',
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

const getTransactionsResponse: IGetTransactionListResponse = {
  transactionList: [transaction1],
};

const transactions = signal<ITransaction[]>(
  getTransactionsResponse.transactionList
);
const transactionsError = signal(undefined);
const transactionsResult = signal<HttpResult<IGetTransactionListResponse>>({
  data: getTransactionsResponse,
  error: undefined,
});

export class MockApiService {
  transactions: Signal<ITransaction[]> = transactions;

  transactionsError: Signal<string | undefined> = transactionsError;

  transactionsResult = transactionsResult;
}

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: TransactionApiService,
          useClass: MockApiService,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
