import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import dayjs from 'dayjs';
import { HomeComponent } from './home.component';
import {
  MockAccountApiService,
  MockApiService,
  MockAuthService,
} from '../../../test/mockService';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { AccountApiService } from '../account/api/account-api.service';
import { ITransaction } from '../transaction/shared/transaction.interface';

const account = { id: 1, name: 'Main' };
const account2 = { id: 2, name: 'Savings' };

function makeTransaction(overrides: Partial<ITransaction>): ITransaction {
  return {
    id: 1,
    title: 'test',
    amount: '10.00',
    date: dayjs().format('YYYY-MM-DD'),
    category: 'FOOD',
    account,
    ...overrides,
  };
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
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
        {
          provide: AccountApiService,
          useClass: MockAccountApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set loading to false once the transaction list resolves', () => {
    expect(component['loading']()).toBe(false);
  });

  describe('when the transaction list fails to load', () => {
    it('should stop the spinner and notify the user', () => {
      const transactionApiService = TestBed.inject(
        TransactionApiService
      ) as unknown as MockApiService;
      const snackBar = TestBed.inject(MatSnackBar);
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

  describe('when the account list fails to load but the transaction list succeeds', () => {
    it('should still stop the spinner and notify the user (forkJoin surfaces either failure)', () => {
      const accountApiService = TestBed.inject(
        AccountApiService
      ) as unknown as MockAccountApiService;
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      accountApiService.getAccountList.mockReturnValueOnce(
        throwError(() => new Error('accounts down'))
      );

      component['getData']();

      expect(component['loading']()).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load transactions',
        'Dismiss',
        expect.any(Object)
      );
      // forkJoin never emits `next` when one source errors, so the signals simply retain
      // whatever they held before this call (the successful initial load from `beforeEach`)
      // rather than being partially updated from the transaction call that did succeed.
      expect(component['accounts']()).toEqual([{ id: 1, name: 'Main' }]);
    });
  });

  it('should not include transactions from a different month in the category breakdown', () => {
    // the mock transaction is dated 2020-01-01, so it falls outside "this month"
    expect(component['breakdown']()).toEqual([]);
  });

  describe('with a current-month transaction', () => {
    beforeEach(() => {
      component['transactions'].set([makeTransaction({ category: 'FOOD' })]);
      fixture.detectChanges();
    });

    it('should compute the category breakdown for this month', () => {
      expect(component['breakdown']()).toEqual([
        { category: 'FOOD', amount: 10 },
      ]);
    });

    it('should report the top category label', () => {
      expect(component['topCategoryLabel']()).toBe('Food');
    });
  });

  describe('with a current-month income transaction', () => {
    beforeEach(() => {
      component['transactions'].set([
        makeTransaction({ category: 'FOOD', amount: '10.00' }),
        makeTransaction({ category: 'INCOME', amount: '500.00' }),
      ]);
      fixture.detectChanges();
    });

    it('should not count income toward "Total this month"', () => {
      expect(component['totalThisMonth']()).toBe(10);
    });

    it('should not include income in the category breakdown', () => {
      expect(component['breakdown']()).toEqual([
        { category: 'FOOD', amount: 10 },
      ]);
    });

    it('should still count the income transaction toward the transaction count', () => {
      expect(component['countThisMonth']()).toBe(2);
    });
  });

  it('should exclude transactions from a different month from "this month" stats', () => {
    // the mock transaction is dated 2020-01-01
    expect(component['totalThisMonth']()).toBe(0);
    expect(component['countThisMonth']()).toBe(0);
  });

  describe('with no transactions', () => {
    beforeEach(() => {
      component['transactions'].set([]);
      fixture.detectChanges();
    });

    it('should fall back to a placeholder top category label', () => {
      expect(component['topCategoryLabel']()).toBe('Not started');
    });

    it('should not show a delta when there is no previous month to compare against', () => {
      expect(component['deltaText']()).toBeUndefined();
    });
  });

  describe('accountBreakdown', () => {
    it('should sum current-month expenses per account', () => {
      component['accounts'].set([account, account2]);
      component['transactions'].set([
        makeTransaction({ category: 'FOOD', amount: '10.00', account }),
        makeTransaction({ category: 'BILL', amount: '15.00', account }),
      ]);
      fixture.detectChanges();

      expect(component['accountBreakdown']()).toEqual([
        { accountId: 1, accountName: 'Main', amount: 25 },
        { accountId: 2, accountName: 'Savings', amount: 0 },
      ]);
    });

    it('should exclude income transactions', () => {
      component['accounts'].set([account]);
      component['transactions'].set([
        makeTransaction({ category: 'INCOME', amount: '500.00', account }),
      ]);
      fixture.detectChanges();

      expect(component['accountBreakdown']()).toEqual([
        { accountId: 1, accountName: 'Main', amount: 0 },
      ]);
    });

    it('should include accounts with no current-month transactions at all', () => {
      component['accounts'].set([account, account2]);
      component['transactions'].set([]);
      fixture.detectChanges();

      expect(component['accountBreakdown']()).toEqual([
        { accountId: 1, accountName: 'Main', amount: 0 },
        { accountId: 2, accountName: 'Savings', amount: 0 },
      ]);
    });

    it('should not drop any account when several have identical spend this month', () => {
      const account3 = { id: 3, name: 'Joint' };
      component['accounts'].set([account, account2, account3]);
      component['transactions'].set([
        makeTransaction({ account, amount: '20.00' }),
        makeTransaction({ account: account2, amount: '20.00' }),
        makeTransaction({ account: account3, amount: '20.00' }),
      ]);
      fixture.detectChanges();

      expect(component['accountBreakdown']()).toHaveLength(3);
      expect(
        component['accountBreakdown']().every((item) => item.amount === 20)
      ).toBe(true);
    });

    it('should keep both accounts when two accounts share the same display name but different ids', () => {
      const accountA = { id: 10, name: 'Joint' };
      const accountB = { id: 11, name: 'Joint' };
      component['accounts'].set([accountA, accountB]);
      component['transactions'].set([
        makeTransaction({ account: accountA, amount: '40.00' }),
        makeTransaction({ account: accountB, amount: '15.00' }),
      ]);
      fixture.detectChanges();

      expect(component['accountBreakdown']()).toEqual([
        { accountId: 10, accountName: 'Joint', amount: 40 },
        { accountId: 11, accountName: 'Joint', amount: 15 },
      ]);
    });
  });

  describe('month-over-month delta', () => {
    it('should show a "bad" delta when spend increased vs last month', () => {
      component['transactions'].set([
        makeTransaction({ amount: '150.00' }),
        makeTransaction({
          amount: '100.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);
      fixture.detectChanges();

      expect(component['deltaText']()).toBe('▲ £50.00 (50%) vs last month');
      expect(component['deltaIsGood']()).toBe(false);
    });

    it('should show a "good" delta when spend decreased vs last month', () => {
      component['transactions'].set([
        makeTransaction({ amount: '50.00' }),
        makeTransaction({
          amount: '100.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);
      fixture.detectChanges();

      expect(component['deltaText']()).toBe('▼ £50.00 (50%) vs last month');
      expect(component['deltaIsGood']()).toBe(true);
    });
  });
});
