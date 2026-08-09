import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MockAuthService } from '../../../../../test/mockService';
import {
  IGetTransactionListResponse,
  ITransaction,
} from '../../shared/transaction.interface';
import { AuthService } from '../../../../core/auth/auth.service';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { TransactionApiService } from '../../api/transaction-api.service';
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

export class MockApiService {}

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
  /*
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
  */
});
