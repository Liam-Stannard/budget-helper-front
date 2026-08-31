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

  describe('sparklineBuckets', () => {
    it('should return 12 buckets summing to the total expense spend across both months', () => {
      component['transactions'].set([
        makeTransaction({ category: 'FOOD', amount: '10.00' }),
        makeTransaction({ category: 'INCOME', amount: '500.00' }),
        makeTransaction({
          category: 'FOOD',
          amount: '5.00',
          date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        }),
      ]);
      fixture.detectChanges();

      const buckets = component['sparklineBuckets']();
      const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

      expect(buckets).toHaveLength(12);
      expect(total).toBe(15);
    });

    it('should render 12 buckets when there are no transactions', () => {
      component['transactions'].set([]);
      fixture.detectChanges();

      expect(component['sparklineBuckets']()).toHaveLength(12);
    });

    it('should never let an INCOME transaction contribute to the bucket it would otherwise land in', () => {
      // an INCOME transaction dated "today" would land in the final bucket (index 11) if it
      // weren't filtered out before reaching getSparklineBuckets -- assert that specific bucket
      // stays clean, not just that the grand total nets out correctly.
      component['transactions'].set([
        makeTransaction({ category: 'INCOME', amount: '5000.00' }),
      ]);
      fixture.detectChanges();

      const buckets = component['sparklineBuckets']();

      expect(buckets[11].amount).toBe(0);
      expect(buckets.every((bucket) => bucket.amount === 0)).toBe(true);
    });

    it('should render only finite, non-negative-NaN bar heights for a brand-new user with no transactions', () => {
      component['transactions'].set([]);
      fixture.detectChanges();

      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-sparkline .bar'
      );

      expect(bars).toHaveLength(12);
      bars.forEach((bar) => {
        const height = Number(bar.getAttribute('height'));

        expect(Number.isFinite(height)).toBe(true);
        expect(height).toBeGreaterThan(0);
      });
    });
  });

  describe('stat tiles without projected content', () => {
    it('should still render the transaction-count and top-category tiles correctly after the sparkline was added to the total tile', () => {
      component['transactions'].set([makeTransaction({ category: 'FOOD' })]);
      fixture.detectChanges();

      const tiles = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-stat-tile'
      );

      expect(tiles).toHaveLength(3);

      const countTileText = tiles[1].textContent ?? '';
      const topCategoryTileText = tiles[2].textContent ?? '';

      expect(countTileText).toContain('Transactions this month');
      expect(countTileText).toContain('1');
      expect(topCategoryTileText).toContain('Top category');
      expect(topCategoryTileText).toContain('Food');

      // neither of these tiles projects any content (no <app-sparkline> inside them)
      expect(tiles[1].querySelector('app-sparkline')).toBeNull();
      expect(tiles[2].querySelector('app-sparkline')).toBeNull();
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
