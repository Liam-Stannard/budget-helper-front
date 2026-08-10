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

  it('should compute the category breakdown across all transactions', () => {
    expect(component['breakdown']()).toEqual([{ category: 'FOOD', amount: 100 }]);
  });

  it('should report the top category label', () => {
    expect(component['topCategoryLabel']()).toBe('Food');
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
