import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';
import { TrendPageComponent } from './trend-page.component';
import {
  MockAuthService,
  MockTransactionListAllService,
} from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';
import { TransactionListAllService } from '../../../transaction/api/transaction-list-all.service';
import {
  IGetTransactionListResponse,
  ITransaction,
} from '../../../transaction/shared/transaction.interface';

const account = { id: 1, name: 'Main' };

function makeTransaction(overrides: Partial<ITransaction>): ITransaction {
  return {
    id: 1,
    title: 'test',
    amount: '10.00',
    date: '2024-01-15',
    category: 'FOOD',
    account,
    ...overrides,
  };
}

describe('TrendPageComponent', () => {
  let component: TrendPageComponent;
  let fixture: ComponentFixture<TrendPageComponent>;
  let transactionListAllService: MockTransactionListAllService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendPageComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNativeDateAdapter(),
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
          provide: TransactionListAllService,
          useClass: MockTransactionListAllService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendPageComponent);
    component = fixture.componentInstance;
    transactionListAllService = TestBed.inject(
      TransactionListAllService
    ) as unknown as MockTransactionListAllService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show a spinner before the user has searched a range', () => {
    expect(component['loading']()).toBe(false);
  });

  it('should not fetch transactions on init', () => {
    expect(transactionListAllService.getAllTransactions).not.toHaveBeenCalled();
  });

  it('should not show the summary until a search has completed', () => {
    expect(component['hasSearched']()).toBe(false);
  });

  describe('form validation', () => {
    it('should be invalid when "from" and "to" are empty', () => {
      expect(component['form'].invalid).toBe(true);
    });

    it('should be invalid when "from" is after "to"', () => {
      component['form'].setValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });

      expect(component['form'].invalid).toBe(true);
      expect(component['form'].controls.to.hasError('dateRangeInvalid')).toBe(
        true
      );
    });

    it('should be valid when "from" is on or before "to"', () => {
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      expect(component['form'].valid).toBe(true);
    });

    it('should be valid (single-day range) when "from" and "to" are the same day', () => {
      component['form'].setValue({
        from: new Date('2024-01-15'),
        to: new Date('2024-01-15'),
      });

      expect(component['form'].valid).toBe(true);
    });

    it('should disable the submit button and show an error message in the DOM when "from" is after "to"', () => {
      component['form'].setValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      component['form'].markAllAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
      expect(compiled.textContent).toContain(
        '"From" date must not be after "To" date'
      );
    });

    it('should enable the submit button and show no error message once the range becomes valid', () => {
      component['form'].setValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      component['form'].markAllAsTouched();
      fixture.detectChanges();

      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(false);
      expect(compiled.textContent).not.toContain(
        '"From" date must not be after "To" date'
      );
    });

    it('should disable the submit button while "from"/"to" are empty', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    it('should not show the range error before the fields are touched, even with an invalid range (pristine form)', () => {
      component['form'].setValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      // Deliberately not marking touched/dirty here - mirrors a freshly-loaded page where
      // nothing has been interacted with yet.
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-error')).toBeNull();
    });
  });

  describe('submit', () => {
    it('should do nothing if the form is invalid', () => {
      component['submit']();

      expect(
        transactionListAllService.getAllTransactions
      ).not.toHaveBeenCalled();
    });

    it('should fetch transactions for the selected range', () => {
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();

      expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
      });
      expect(component['loading']()).toBe(false);
      expect(component['hasSearched']()).toBe(true);
    });

    it('should compute the total spend and transaction count from the response', () => {
      transactionListAllService.getAllTransactions.mockReturnValueOnce(
        of({
          transactionList: [
            makeTransaction({ amount: '10.00', category: 'FOOD' }),
            makeTransaction({ amount: '500.00', category: 'INCOME' }),
          ],
          totalElements: 2,
          totalPages: 1,
        })
      );
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();

      expect(component['transactionCount']()).toBe(2);
      expect(component['totalSpend']()).toBe(10);
    });

    it('should show the empty state when no transactions are returned', () => {
      transactionListAllService.getAllTransactions.mockReturnValueOnce(
        of({
          transactionList: [],
          totalElements: 0,
          totalPages: 0,
        })
      );
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();
      fixture.detectChanges();

      expect(component['hasSearched']()).toBe(true);
      expect(component['transactionCount']()).toBe(0);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-state')?.textContent).toContain(
        'No transactions in this range.'
      );
      expect(compiled.querySelector('.stat-row')).toBeNull();
    });

    it('should call the page-following TransactionListAllService (not a raw single-page fetch)', () => {
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();

      // Injected via TransactionListAllService (the multi-page-aware wrapper), and called
      // with only date filters - no "page"/"size" params, which the wrapper is responsible
      // for driving internally across as many backend pages as it takes.
      expect(transactionListAllService.getAllTransactions).toHaveBeenCalledTimes(
        1
      );
      expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
      });
    });

    it('should render the aggregate summary in the DOM for a large multi-page result set', () => {
      const largeTransactionList: ITransaction[] = Array.from(
        { length: 250 },
        (_, i) =>
          makeTransaction({ id: i, amount: '2.00', category: 'FOOD' })
      );
      transactionListAllService.getAllTransactions.mockReturnValueOnce(
        of({
          transactionList: largeTransactionList,
          totalElements: 250,
          totalPages: 3,
        })
      );
      component['form'].setValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      });

      component['submit']();
      fixture.detectChanges();

      expect(component['transactionCount']()).toBe(250);
      expect(component['totalSpend']()).toBe(500);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.stat-row')).not.toBeNull();
      expect(compiled.textContent).toContain('250');
      expect(compiled.querySelector('.empty-state')).toBeNull();
    });

    describe('rapid resubmission (stale-response race)', () => {
      it('should show the most recently submitted range\'s result even when the first (stale) request resolves after the second is submitted', () => {
        const firstResponse$ = new Subject<IGetTransactionListResponse>();
        const secondResponse$ = new Subject<IGetTransactionListResponse>();
        transactionListAllService.getAllTransactions
          .mockReturnValueOnce(firstResponse$)
          .mockReturnValueOnce(secondResponse$);

        component['form'].setValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });
        component['submit'](); // first submission - left in-flight

        component['form'].setValue({
          from: new Date('2024-02-01'),
          to: new Date('2024-02-29'),
        });
        component['submit'](); // second submission before the first resolves

        // The stale first request resolves last, after the second submission has
        // already gone out - it must not be allowed to overwrite the second's result.
        firstResponse$.next({
          transactionList: [makeTransaction({ id: 1, amount: '999.00' })],
          totalElements: 1,
          totalPages: 1,
        });
        firstResponse$.complete();

        secondResponse$.next({
          transactionList: [makeTransaction({ id: 2, amount: '20.00' })],
          totalElements: 1,
          totalPages: 1,
        });
        secondResponse$.complete();

        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(20);
        expect(component['loading']()).toBe(false);
      });

      it('should disable the submit button while a request is in flight, preventing an accidental resubmission', () => {
        const response$ = new Subject<IGetTransactionListResponse>();
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          response$
        );
        component['form'].setValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const submitButton = compiled.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement;
        expect(submitButton.disabled).toBe(true);

        response$.next({ transactionList: [], totalElements: 0, totalPages: 0 });
        response$.complete();
        fixture.detectChanges();

        expect(submitButton.disabled).toBe(false);
      });
    });

    describe('when the fetch fails', () => {
      it('should stop the spinner and notify the user', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          throwError(() => new Error('network down'))
        );
        component['form'].setValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();
        fixture.detectChanges();

        expect(component['loading']()).toBe(false);
        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to load transactions',
          'Dismiss',
          expect.any(Object)
        );

        // No spinner left hanging, and since the fetch never actually succeeded, no
        // summary/empty-state should render either.
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('mat-progress-bar')).toBeNull();
        expect(component['hasSearched']()).toBe(false);
        expect(compiled.querySelector('.stat-row')).toBeNull();
        expect(compiled.querySelector('.empty-state')).toBeNull();
      });
    });
  });
});
