import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import dayjs from 'dayjs';
import { HomeComponent } from './home.component';
import {
  MockAccountApiService,
  MockApiService,
  MockAuthService,
  MockBudgetApiService,
} from '../../../test/mockService';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
import { AccountApiService } from '../account/api/account-api.service';
import { BudgetApiService } from '../budget/api/budget-api.service';
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
        { provide: AccountApiService, useClass: MockAccountApiService },
        { provide: BudgetApiService, useClass: MockBudgetApiService },
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

  it('should exclude transactions from other months from this month\'s summary', () => {
    // the mock transaction is dated 2020-01-01
    expect(component['summary']()).toEqual(
      expect.objectContaining({ income: 0, spent: 0, net: 0 })
    );
  });

  describe('with current-month income and spend', () => {
    beforeEach(() => {
      component['transactions'].set([
        makeTransaction({ id: 1, category: 'FOOD', amount: '120.00' }),
        makeTransaction({ id: 2, category: 'INCOME', amount: '400.00' }),
      ]);
      fixture.detectChanges();
    });

    it('should split income from spend and compute the net', () => {
      expect(component['summary']()).toEqual({
        income: 400,
        spent: 120,
        net: 280,
        savingsRate: 70,
      });
      expect(component['savingsText']()).toBe('70% of income saved');
    });

    it('should report budget progress against the loaded budgets', () => {
      expect(component['budgetRows']()).toEqual([
        expect.objectContaining({
          category: 'FOOD',
          spent: 120,
          limit: 100,
          status: 'over',
        }),
      ]);
      expect(component['totalBudget']()).toBe(100);
    });

    it('should list recent transactions newest first', () => {
      expect(component['recentTransactions']().map((t) => t.id)).toEqual([
        2, 1,
      ]);
    });

    it('should render every dashboard card', () => {
      const element = fixture.nativeElement as HTMLElement;

      for (const selector of [
        'app-budget-progress',
        'app-spending-pace',
        'app-recent-transactions',
        'app-bills-due',
        'app-account-balances',
      ]) {
        expect(element.querySelector(selector)).not.toBeNull();
      }
    });
  });

  it('should report a savings placeholder when there is no income', () => {
    component['transactions'].set([makeTransaction({ amount: '10.00' })]);

    expect(component['savingsText']()).toBe('No income recorded yet');
  });

  it('should compute net worth from the loaded accounts', () => {
    const accountApiService = TestBed.inject(
      AccountApiService
    ) as unknown as MockAccountApiService;
    accountApiService.getAccountList.mockReturnValueOnce(
      of({
        accountList: [
          { id: 1, name: 'Main', currentBalance: '1000.0000' },
          { id: 2, name: 'Card', currentBalance: '-250.0000' },
        ],
      })
    );

    component['getData']();

    expect(component['netWorth']()).toBe(750);
  });

  describe('when budgets fail to load', () => {
    it('should still render the dashboard and notify the user', () => {
      const budgetApiService = TestBed.inject(
        BudgetApiService
      ) as unknown as MockBudgetApiService;
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      budgetApiService.getBudgetList.mockReturnValueOnce(
        throwError(() => new Error('network down'))
      );

      component['getData']();

      expect(component['loading']()).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load budgets',
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('spent-this-month delta', () => {
    it('should not show a delta when last month had no spend by this point', () => {
      component['transactions'].set([]);

      expect(component['spentDeltaText']()).toBeUndefined();
    });

    it('should show a "bad" delta when spending faster than last month', () => {
      component['transactions'].set([
        makeTransaction({ amount: '150.00' }),
        makeTransaction({
          amount: '100.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);

      expect(component['spentDeltaText']()).toBe(
        '▲ £50.00 (50%) vs this point last month'
      );
      expect(component['spentDeltaIsGood']()).toBe(false);
    });

    it('should show a "good" delta when spending slower than last month', () => {
      component['transactions'].set([
        makeTransaction({ amount: '50.00' }),
        makeTransaction({
          amount: '100.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);

      expect(component['spentDeltaText']()).toBe(
        '▼ £50.00 (50%) vs this point last month'
      );
      expect(component['spentDeltaIsGood']()).toBe(true);
    });
  });
});
