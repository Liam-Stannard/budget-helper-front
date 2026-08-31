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
  MockAccountApiService,
  MockAuthService,
  MockTransactionListAllService,
} from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';
import { AccountApiService } from '../../../account/api/account-api.service';
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
  let accountApiService: MockAccountApiService;

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
        {
          provide: AccountApiService,
          useClass: MockAccountApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendPageComponent);
    component = fixture.componentInstance;
    transactionListAllService = TestBed.inject(
      TransactionListAllService
    ) as unknown as MockTransactionListAllService;
    accountApiService = TestBed.inject(
      AccountApiService
    ) as unknown as MockAccountApiService;
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

  it('should return 0 count/spend (not throw) when accessed before any submission', () => {
    expect(() => component['transactionCount']()).not.toThrow();
    expect(component['transactionCount']()).toBe(0);
    expect(component['totalSpend']()).toBe(0);
  });

  describe('form validation', () => {
    it('should be invalid when "from" and "to" are empty', () => {
      expect(component['form'].invalid).toBe(true);
    });

    it('should be invalid when "from" is after "to"', () => {
      component['form'].patchValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });

      expect(component['form'].invalid).toBe(true);
      expect(component['form'].controls.to.hasError('dateRangeInvalid')).toBe(
        true
      );
    });

    it('should be valid when "from" is on or before "to"', () => {
      component['form'].patchValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      expect(component['form'].valid).toBe(true);
    });

    it('should be valid (single-day range) when "from" and "to" are the same day', () => {
      component['form'].patchValue({
        from: new Date('2024-01-15'),
        to: new Date('2024-01-15'),
      });

      expect(component['form'].valid).toBe(true);
    });

    it('should disable the submit button and show an error message in the DOM when "from" is after "to"', () => {
      component['form'].patchValue({
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
      component['form'].patchValue({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      component['form'].markAllAsTouched();
      fixture.detectChanges();

      component['form'].patchValue({
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
      component['form'].patchValue({
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
      component['form'].patchValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();

      expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        accountId: undefined,
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
      component['form'].patchValue({
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
      component['form'].patchValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      component['submit']();
      fixture.detectChanges();

      expect(component['hasSearched']()).toBe(true);
      expect(component['transactionCount']()).toBe(0);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-state')?.textContent).toContain(
        'No transactions match this range and filters.'
      );
      expect(compiled.querySelector('.stat-row')).toBeNull();
    });

    it('should call the page-following TransactionListAllService (not a raw single-page fetch)', () => {
      component['form'].patchValue({
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
        accountId: undefined,
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
      component['form'].patchValue({
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

        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });
        component['submit'](); // first submission - left in-flight

        component['form'].patchValue({
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

      it("should show the second submission's result (not the first, stale one) when only the account filter changes between rapid resubmissions", () => {
        const firstResponse$ = new Subject<IGetTransactionListResponse>();
        const secondResponse$ = new Subject<IGetTransactionListResponse>();
        transactionListAllService.getAllTransactions
          .mockReturnValueOnce(firstResponse$)
          .mockReturnValueOnce(secondResponse$);

        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          accountId: 1,
        });
        component['submit'](); // first submission (account 1) - left in-flight

        component['form'].patchValue({ accountId: 2 });
        component['submit'](); // second submission (account 2), before the first resolves

        // The stale first request (account 1) resolves last - it must not overwrite the
        // second (account 2) submission's result.
        firstResponse$.next({
          transactionList: [
            makeTransaction({
              id: 1,
              amount: '999.00',
              account: { id: 1, name: 'Main' },
            }),
          ],
          totalElements: 1,
          totalPages: 1,
        });
        firstResponse$.complete();

        secondResponse$.next({
          transactionList: [
            makeTransaction({
              id: 2,
              amount: '20.00',
              account: { id: 2, name: 'Savings' },
            }),
          ],
          totalElements: 1,
          totalPages: 1,
        });
        secondResponse$.complete();

        expect(
          transactionListAllService.getAllTransactions
        ).toHaveBeenNthCalledWith(2, {
          from: '2024-01-01',
          to: '2024-01-31',
          accountId: 2,
        });
        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(20);
        expect(component['loading']()).toBe(false);
      });

      it('should disable the submit button while a request is in flight, preventing an accidental resubmission', () => {
        const response$ = new Subject<IGetTransactionListResponse>();
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          response$
        );
        component['form'].patchValue({
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

    describe('account filter', () => {
      it('should populate the account dropdown from AccountApiService', () => {
        expect(accountApiService.getAccountList).toHaveBeenCalled();
        expect(component['accounts']()).toEqual([account]);
      });

      it('should send the selected accountId to the backend-driven fetch', () => {
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          accountId: 2,
        });

        component['submit']();

        expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
          from: '2024-01-01',
          to: '2024-01-31',
          accountId: 2,
        });
      });

      it('should omit accountId (all accounts) when left at its default', () => {
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();

        expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
          from: '2024-01-01',
          to: '2024-01-31',
          accountId: undefined,
        });
        // Inspect the actual params object, not just the assertion sugar above - confirm
        // no accountId key sneaks through as `0`/`''` instead of a genuinely absent value.
        const params = (
          transactionListAllService.getAllTransactions.mock
            .calls[0] as unknown as [{ accountId?: unknown }]
        )[0];
        expect(params.accountId).toBeUndefined();
        expect(Object.is(params.accountId, 0)).toBe(false);
        expect(Object.is(params.accountId, '')).toBe(false);
      });

      it('should normalize a null accountId (an untouched/reset select control\'s raw value) to undefined rather than sending it as-is', () => {
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });
        // Simulate a reset mat-select control, whose raw form value comes back as `null`
        // rather than `undefined` (per the comment in trend-page.component.ts).
        component['form'].controls.accountId.setValue(
          null as unknown as number
        );

        component['submit']();

        const params = (
          transactionListAllService.getAllTransactions.mock
            .calls[0] as unknown as [{ accountId?: unknown }]
        )[0];
        expect(params.accountId).toBeUndefined();
        expect(Object.is(params.accountId, null)).toBe(false);
      });
    });

    describe('category filter (client-side, multi-select)', () => {
      it('should not restrict results when no category is selected', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'BILL', amount: '20.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(2);
      });

      it('should restrict the summary to transactions matching any of the selected categories', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'BILL', amount: '20.00' }),
              makeTransaction({ id: 3, category: 'CLOTHING', amount: '30.00' }),
            ],
            totalElements: 3,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          categories: ['FOOD', 'BILL'],
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(2);
        expect(component['totalSpend']()).toBe(30);
      });

      it('should not drive a second/separate fetch when only categories are selected - the same single fetch call is reused', () => {
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          categories: ['FOOD'],
        });

        component['submit']();

        expect(transactionListAllService.getAllTransactions).toHaveBeenCalledTimes(
          1
        );
      });

      it('should show the empty state when a category filter legitimately excludes every fetched transaction', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
            ],
            totalElements: 1,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          categories: ['CLOTHING'],
        });

        component['submit']();
        fixture.detectChanges();

        expect(component['transactionCount']()).toBe(0);
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.empty-state')).not.toBeNull();
        expect(compiled.querySelector('.stat-row')).toBeNull();
      });

      it('should update the summary immediately when the categories control is toggled, without calling submit - it is a pure client-side filter and applies live', () => {
        transactionListAllService.getAllTransactions.mockReturnValue(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'BILL', amount: '20.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });
        component['submit'](); // initial submit with no category filter applied

        expect(component['transactionCount']()).toBe(2);
        expect(component['totalSpend']()).toBe(30);

        // Toggle the categories control WITHOUT resubmitting - mirrors a user changing the
        // multi-select but not (yet) pressing "View trends".
        component['form'].controls.categories.setValue(['FOOD']);
        fixture.detectChanges();

        // The category filter is applied client-side against the already-fetched range, so
        // it takes effect immediately as the multi-select changes - no resubmit needed.
        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(10);

        // Clearing the filter live restores the full (already-fetched) result too.
        component['form'].controls.categories.setValue([]);
        fixture.detectChanges();

        expect(component['transactionCount']()).toBe(2);
        expect(component['totalSpend']()).toBe(30);
      });

      it('should not throw and should keep showing the previous (empty/undefined) result while a fetch is in flight, even if the categories control is changed mid-flight', () => {
        const response$ = new Subject<IGetTransactionListResponse>();
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          response$
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit'](); // in flight - transactions() still undefined

        expect(() => {
          component['form'].controls.categories.setValue(['FOOD']);
          fixture.detectChanges();
        }).not.toThrow();

        // filteredTransactions/transactionCount/totalSpend must tolerate `transactions()`
        // still being `undefined` mid-fetch, rather than computing against stale/garbage data.
        expect(component['transactionCount']()).toBe(0);
        expect(component['totalSpend']()).toBe(0);
        expect(component['hasSearched']()).toBe(false);

        response$.next({
          transactionList: [
            makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
            makeTransaction({ id: 2, category: 'BILL', amount: '20.00' }),
          ],
          totalElements: 2,
          totalPages: 1,
        });
        response$.complete();

        // The category change made mid-flight (before the fetch resolved) still applies live
        // once the data does arrive, since it's tracked reactively rather than snapshotted.
        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(10);
      });
    });

    describe('INCOME category behaviour', () => {
      it('should include INCOME in the unfiltered transaction count but exclude it from total spend', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'INCOME', amount: '500.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(2); // INCOME is counted
        expect(component['totalSpend']()).toBe(10); // INCOME is excluded from spend
      });

      it('should list INCOME as a selectable category filter option', () => {
        expect(
          component['categoryOptions'].map((option) => option.value)
        ).toContain('INCOME');
      });

      it('should show the correct non-zero total when explicitly filtering to the INCOME category - an explicit selection is respected as-is, not silently stripped back out', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'INCOME', amount: '500.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          categories: ['INCOME'],
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(500);
      });

      it('should still exclude INCOME from the total when explicitly filtering to a non-INCOME category - INCOME was never in the filtered set to begin with', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'INCOME', amount: '500.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          categories: ['FOOD'],
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(10);
      });

      it('should default to excluding INCOME from the total when no category filter is applied', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({ id: 1, category: 'FOOD', amount: '10.00' }),
              makeTransaction({ id: 2, category: 'INCOME', amount: '500.00' }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        });

        component['submit']();

        expect(component['transactionCount']()).toBe(2);
        expect(component['totalSpend']()).toBe(10);
      });
    });

    describe('combined account + category filters', () => {
      it('should apply the client-side category filter on top of the backend account-filtered response, matching both', () => {
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          of({
            transactionList: [
              makeTransaction({
                id: 1,
                category: 'FOOD',
                amount: '10.00',
                account: { id: 2, name: 'Savings' },
              }),
              makeTransaction({
                id: 2,
                category: 'BILL',
                amount: '20.00',
                account: { id: 2, name: 'Savings' },
              }),
            ],
            totalElements: 2,
            totalPages: 1,
          })
        );
        component['form'].patchValue({
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
          accountId: 2,
          categories: ['FOOD'],
        });

        component['submit']();

        expect(transactionListAllService.getAllTransactions).toHaveBeenCalledWith({
          from: '2024-01-01',
          to: '2024-01-31',
          accountId: 2,
        });
        // Only the FOOD transaction from the (already account-filtered) response survives.
        expect(component['transactionCount']()).toBe(1);
        expect(component['totalSpend']()).toBe(10);
      });
    });

    describe('when the fetch fails', () => {
      it('should stop the spinner and notify the user', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
        transactionListAllService.getAllTransactions.mockReturnValueOnce(
          throwError(() => new Error('network down'))
        );
        component['form'].patchValue({
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
