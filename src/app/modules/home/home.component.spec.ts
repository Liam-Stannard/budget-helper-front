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
import { MockApiService, MockAuthService } from '../../../test/mockService';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { ITransaction } from '../transaction/shared/transaction.interface';

const account = { id: 1, name: 'Main' };

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

    it('should not include income in the category comparison', () => {
      expect(
        component['categoryComparison']().some(
          (item) => (item.category as string) === 'INCOME'
        )
      ).toBe(false);
    });

    it('should still count the income transaction toward the transaction count', () => {
      expect(component['countThisMonth']()).toBe(2);
    });
  });

  describe('category comparison', () => {
    it('should return an all-zero, 4-category comparison for a brand-new user with no transactions in either month', () => {
      component['transactions'].set([]);
      fixture.detectChanges();

      const comparison = component['categoryComparison']();

      expect(comparison).toHaveLength(4);
      expect(
        comparison.every(
          (item) => item.currentAmount === 0 && item.previousAmount === 0
        )
      ).toBe(true);
    });

    it('should return an all-zero comparison when both months only contain INCOME transactions', () => {
      component['transactions'].set([
        makeTransaction({ category: 'INCOME', amount: '2000.00' }),
        makeTransaction({
          category: 'INCOME',
          amount: '1800.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);
      fixture.detectChanges();

      const comparison = component['categoryComparison']();

      expect(comparison).toHaveLength(4);
      expect(
        comparison.every(
          (item) => item.currentAmount === 0 && item.previousAmount === 0
        )
      ).toBe(true);
    });

    it('should zero-fill categories with spend in only one of the two months', () => {
      component['transactions'].set([
        makeTransaction({ category: 'FOOD', amount: '10.00' }),
        makeTransaction({
          category: 'BILL',
          amount: '20.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);
      fixture.detectChanges();

      const comparison = component['categoryComparison']();

      expect(comparison).toEqual(
        expect.arrayContaining([
          { category: 'FOOD', currentAmount: 10, previousAmount: 0 },
          { category: 'BILL', currentAmount: 0, previousAmount: 20 },
        ])
      );
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
