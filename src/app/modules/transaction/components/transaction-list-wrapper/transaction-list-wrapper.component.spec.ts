import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import {
  MockApiService,
  MockAuthService,
} from '../../../../../test/mockService';
import {
  IGetTransactionListResponse,
  ITransaction,
} from '../../shared/transaction.interface';
import { AuthService } from '../../../../core/auth/auth.service';
import { TransactionApiService } from '../../api/transaction-api.service';
import { TransactionListWrapperComponent } from './transaction-list-wrapper.component';
import { APP_CONSTANTS } from '../../../../app.constants';

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: { id: 1, name: 'Main' },
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

const getTransactionsResponse: IGetTransactionListResponse = {
  transactionList: [transaction1],
  totalElements: 1,
  totalPages: 1,
};

describe('TransactionListWrapperComponent', () => {
  let component: TransactionListWrapperComponent;
  let fixture: ComponentFixture<TransactionListWrapperComponent>;
  let transactionApiService: MockApiService;
  let router: Router;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;

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
    transactionApiService = TestBed.inject(
      TransactionApiService
    ) as unknown as MockApiService;
    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getTransactionList', () => {
      expect(transactionApiService.getTransactionList).toHaveBeenCalled();
    });

    it('should default to the current month, page 0, and date desc', () => {
      expect(transactionApiService.getTransactionList).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
          size: 10,
          sort: 'date,desc',
        })
      );
    });

    it('should set the data signal from the response', () => {
      expect(component['data']()).toEqual(
        getTransactionsResponse.transactionList
      );
    });

    it('should set the totalElements signal from the response', () => {
      expect(component['totalElements']()).toBe(
        getTransactionsResponse.totalElements
      );
    });

    it('should set loading to false', () => {
      expect(component['loading']()).toBe(false);
    });
  });

  describe('setPeriod', () => {
    it('should refetch with the new period and reset to page 0', () => {
      component['pageIndex'].set(2);
      transactionApiService.getTransactionList.mockClear();

      component['setPeriod']('week');

      expect(component['period']()).toBe('week');
      expect(component['pageIndex']()).toBe(0);
      expect(transactionApiService.getTransactionList).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });
  });

  describe('goToPreviousPeriod / goToNextPeriod', () => {
    it('should move the reference date back and refetch', () => {
      const before = component['referenceDate']();
      transactionApiService.getTransactionList.mockClear();

      component['goToPreviousPeriod']();

      expect(component['referenceDate']().isBefore(before)).toBe(true);
      expect(transactionApiService.getTransactionList).toHaveBeenCalled();
    });

    it('should move the reference date forward and refetch', () => {
      const before = component['referenceDate']();
      transactionApiService.getTransactionList.mockClear();

      component['goToNextPeriod']();

      expect(component['referenceDate']().isAfter(before)).toBe(true);
      expect(transactionApiService.getTransactionList).toHaveBeenCalled();
    });
  });

  describe('goToToday', () => {
    it('should reset the reference date and page, then refetch', () => {
      component['referenceDate'].set(component['referenceDate']().add(2, 'month'));
      component['pageIndex'].set(3);
      transactionApiService.getTransactionList.mockClear();

      component['goToToday']();

      expect(component['pageIndex']()).toBe(0);
      expect(transactionApiService.getTransactionList).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update page state and refetch', () => {
      transactionApiService.getTransactionList.mockClear();

      component['onPageChange']({ pageIndex: 2, pageSize: 25, length: 100 });

      expect(component['pageIndex']()).toBe(2);
      expect(component['pageSize']()).toBe(25);
      expect(transactionApiService.getTransactionList).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, size: 25 })
      );
    });
  });

  describe('onSortChange', () => {
    it('should update sort state, reset to page 0, and refetch', () => {
      component['pageIndex'].set(1);
      transactionApiService.getTransactionList.mockClear();

      component['onSortChange']({ active: 'amount', direction: 'asc' });

      expect(component['sortField']()).toBe('amount');
      expect(component['sortDirection']()).toBe('asc');
      expect(component['pageIndex']()).toBe(0);
      expect(transactionApiService.getTransactionList).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, sort: 'amount,asc' })
      );
    });

    it('should ignore a cleared sort instead of refetching', () => {
      transactionApiService.getTransactionList.mockClear();

      component['onSortChange']({ active: 'amount', direction: '' });

      expect(transactionApiService.getTransactionList).not.toHaveBeenCalled();
    });
  });

  describe('when getTransactionList fails', () => {
    it('should stop the spinner and notify the user', () => {
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      transactionApiService.getTransactionList.mockReturnValueOnce(
        throwError(() => new Error('network down'))
      );

      component['getData']();

      expect(component['loading']()).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load transactions',
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('edit', () => {
    it('should navigate to the edit route for the transaction', () => {
      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);

      component['edit'](transaction1);

      expect(navigateSpy).toHaveBeenCalledWith(['transaction', 'edit', '1']);
    });

    it('should throw if the transaction has no id', () => {
      expect(() =>
        component['edit']({ ...transaction1, id: undefined })
      ).toThrow();
    });
  });

  describe('delete', () => {
    let snackBarSpy: jest.SpyInstance;

    beforeEach(() => {
      snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
    });

    it('should throw if the transaction has no id', () => {
      expect(() =>
        component['delete']({ ...transaction1, id: undefined })
      ).toThrow();
    });

    it('should do nothing if the user cancels the confirm dialog', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(false) } as any);

      component['delete'](transaction1);

      expect(transactionApiService.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should call deleteTransaction and refresh the list on confirm', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(true) } as any);
      transactionApiService.getTransactionList.mockClear();

      component['delete'](transaction1);

      expect(transactionApiService.deleteTransaction).toHaveBeenCalledWith(1);
      expect(snackBarSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deleted transaction'),
        'Dismiss',
        expect.any(Object)
      );
      expect(transactionApiService.getTransactionList).toHaveBeenCalledTimes(
        1
      );
    });

    it('should notify on delete failure', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(true) } as any);
      transactionApiService.deleteTransaction.mockReturnValueOnce(
        throwError(() => new Error('failed'))
      );

      component['delete'](transaction1);

      expect(snackBarSpy).toHaveBeenCalledWith(
        expect.stringContaining('Delete transaction failed'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('triggerAction', () => {
    it('should call edit for ACTION_EDIT', () => {
      const editSpy = jest
        .spyOn(component as any, 'edit')
        .mockImplementation();

      component['triggerAction']({
        action: APP_CONSTANTS.ACTION_EDIT,
        item: transaction1,
      });

      expect(editSpy).toHaveBeenCalledWith(transaction1);
    });

    it('should call delete for ACTION_DELETE', () => {
      const deleteSpy = jest
        .spyOn(component as any, 'delete')
        .mockImplementation();

      component['triggerAction']({
        action: APP_CONSTANTS.ACTION_DELETE,
        item: transaction1,
      });

      expect(deleteSpy).toHaveBeenCalledWith(transaction1);
    });
  });
});
