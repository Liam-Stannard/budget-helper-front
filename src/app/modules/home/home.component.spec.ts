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

  describe('daily cumulative spend', () => {
    it('should build the current-month series through today only, excluding income', () => {
      component['transactions'].set([
        makeTransaction({ date: dayjs().startOf('month').format('YYYY-MM-DD'), amount: '10.00' }),
        makeTransaction({ date: dayjs().format('YYYY-MM-DD'), amount: '5.00' }),
        makeTransaction({
          date: dayjs().format('YYYY-MM-DD'),
          category: 'INCOME',
          amount: '500.00',
        }),
      ]);
      fixture.detectChanges();

      const series = component['currentMonthCumulativeSpend']();

      expect(series).toHaveLength(dayjs().date());
      expect(series[series.length - 1].cumulativeAmount).toBe(15);
    });

    it('should build the previous-month series for the full month, excluding income', () => {
      const previousMonthStart = dayjs().subtract(1, 'month').startOf('month');

      component['transactions'].set([
        makeTransaction({
          date: previousMonthStart.format('YYYY-MM-DD'),
          amount: '20.00',
        }),
        makeTransaction({
          date: previousMonthStart.format('YYYY-MM-DD'),
          category: 'INCOME',
          amount: '500.00',
        }),
      ]);
      fixture.detectChanges();

      const series = component['previousMonthCumulativeSpend']();

      expect(series).toHaveLength(previousMonthStart.daysInMonth());
      expect(series[series.length - 1].cumulativeAmount).toBe(20);
    });

    it('should be an all-zero flat series for both months when every transaction is INCOME', () => {
      component['transactions'].set([
        makeTransaction({
          date: dayjs().format('YYYY-MM-DD'),
          category: 'INCOME',
          amount: '500.00',
        }),
        makeTransaction({
          date: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
          category: 'INCOME',
          amount: '750.00',
        }),
      ]);
      fixture.detectChanges();

      const currentSeries = component['currentMonthCumulativeSpend']();
      const previousSeries = component['previousMonthCumulativeSpend']();

      // Not empty (a day-by-day series still exists), just flat at 0 -- and no leakage of the
      // INCOME amount into the running total.
      expect(currentSeries.length).toBeGreaterThan(0);
      expect(previousSeries.length).toBeGreaterThan(0);
      expect(currentSeries.every((point) => point.cumulativeAmount === 0)).toBe(
        true
      );
      expect(
        previousSeries.every((point) => point.cumulativeAmount === 0)
      ).toBe(true);
    });

    describe('when today is the 1st of the month', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-06-01T12:00:00'));

        component['transactions'].set([
          makeTransaction({ date: '2024-06-01', amount: '12.00' }),
        ]);
        fixture.detectChanges();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should produce a current-month series with exactly one point', () => {
        const series = component['currentMonthCumulativeSpend']();

        expect(series).toEqual([
          { day: 1, date: '2024-06-01', cumulativeAmount: 12 },
        ]);
      });
    });

    describe('when today is the last day of the month', () => {
      beforeEach(() => {
        // August and July 2024 both have 31 days -- a deliberate choice so that a
        // current/previous off-by-one bug (e.g. one series short/long by a day) would show up
        // as a length mismatch rather than being masked by the months naturally differing in
        // length.
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-08-31T12:00:00'));

        component['transactions'].set([
          makeTransaction({ date: '2024-08-15', amount: '10.00' }),
          makeTransaction({ date: '2024-07-15', amount: '10.00' }),
        ]);
        fixture.detectChanges();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should give the current and previous month series equal length, both covering a full month', () => {
        const currentSeries = component['currentMonthCumulativeSpend']();
        const previousSeries = component['previousMonthCumulativeSpend']();

        expect(currentSeries).toHaveLength(31);
        expect(previousSeries).toHaveLength(31);
        expect(currentSeries.length).toBe(previousSeries.length);
      });
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
