import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MockAuthService } from '../../../test/mockService';
import { AuthService } from '../../service/auth/auth.service';
import { AbstractComponent } from '../abstract/abstract.component';
import {
  ITransaction,
  IGetTransactionListResponse,
} from '../transaction/api/interfaces/transaction.interface';
import {
  HttpResult,
  TransactionApiService,
} from '../transaction/api/transaction-api.service';
import { TransactionListWrapperComponent } from './transaction-list-wrapper.component';

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

describe('TransactionListWrapperComponent', () => {
  let component: TransactionListWrapperComponent;
  let fixture: ComponentFixture<TransactionListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListWrapperComponent],
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

    fixture = TestBed.createComponent(TransactionListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      jest.spyOn(AbstractComponent.prototype, 'ngOnInit').mockImplementation();
    });

    it('should call super.ngOnInit', () => {
      component.ngOnInit();

      expect(AbstractComponent.prototype.ngOnInit).toHaveBeenCalledTimes(1);
    });

    it('should set the data signal', () => {
      component.ngOnInit();

      expect(component['data']).toBe(transactions);

      expect(component['data']()).toStrictEqual(
        getTransactionsResponse.transactionList
      );
    });

    it('should set the error signal', () => {
      component.ngOnInit();

      expect(component['error']).toBe(transactionsError);
    });

    it('should set loading to false', () => {
      component.ngOnInit();

      expect(component['loading']).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      jest
        .spyOn(AbstractComponent.prototype, 'ngOnDestroy')
        .mockImplementation();
    });

    it('should call super.ngOnDestroy', () => {
      component.ngOnDestroy();

      expect(AbstractComponent.prototype.ngOnDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('add', () => {
    beforeEach(() => {
      jest
        .spyOn(AbstractComponent.prototype as any, 'navigate')
        .mockImplementation();
    });

    it('should call navigate to the correct route', () => {
      component['add']();

      expect(component['navigate']).toHaveBeenCalledWith([
        'transaction',
        'add',
      ]);
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      jest
        .spyOn(AbstractComponent.prototype as any, 'navigate')
        .mockImplementation();
    });

    it('should call navigate to the correct route', () => {
      component['edit'](transaction1);

      expect(component['navigate']).toHaveBeenCalledWith([
        'transaction',
        'edit',
        '1',
      ]);
    });
  });

  describe('delete', () => {});
});
