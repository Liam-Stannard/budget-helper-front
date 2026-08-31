import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpendingByAccountChartComponent } from './spending-by-account-chart.component';
import { IAccountAmount } from '../../home.utils';

describe('SpendingByAccountChartComponent', () => {
  let component: SpendingByAccountChartComponent;
  let fixture: ComponentFixture<SpendingByAccountChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingByAccountChartComponent],
      providers: [{ provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' }],
    }).compileComponents();

    fixture = TestBed.createComponent(SpendingByAccountChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('with data', () => {
    const data: IAccountAmount[] = [
      { accountId: 1, accountName: 'Main', amount: 50 },
      { accountId: 2, accountName: 'Savings', amount: 0 },
    ];

    beforeEach(() => {
      component.data = data;
      fixture.detectChanges();
    });

    it('should render a row per account with the name and value, including zero-spend accounts', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Main');
      expect(text).toContain('£50.00');
      expect(text).toContain('Savings');
      expect(text).toContain('£0.00');
    });

    it('should not show the empty state', () => {
      const emptyState = (fixture.nativeElement as HTMLElement).querySelector(
        '.empty-state'
      );

      expect(emptyState).toBeNull();
    });

    it('should render all bars with the same fixed accent color', () => {
      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.bar'
      );

      expect(bars.length).toBe(2);
      bars.forEach((bar) => {
        expect((bar as HTMLElement).style.backgroundColor).toBe('');
      });
    });
  });

  describe('with two accounts sharing the same display name (different ids)', () => {
    // The @for track key in the template is `item.accountId`, which stays unique
    // even when two accounts share the same display name.
    it('should still render one row per account, each with its own amount', () => {
      component.data = [
        { accountId: 1, accountName: 'Joint', amount: 50 },
        { accountId: 2, accountName: 'Joint', amount: 30 },
      ];
      fixture.detectChanges();

      const rows = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.row')
      );

      expect(rows).toHaveLength(2);
      const rowTexts = rows.map((row) => (row as HTMLElement).textContent ?? '');
      expect(rowTexts[0]).toContain('£50.00');
      expect(rowTexts[1]).toContain('£30.00');
    });

    it('should keep rows in sync with their own account after a data update that reorders same-named accounts', () => {
      component.data = [
        { accountId: 1, accountName: 'Joint', amount: 50 },
        { accountId: 2, accountName: 'Joint', amount: 30 },
      ];
      fixture.detectChanges();

      // account 2 now out-spends account 1, flipping the descending sort order,
      // while both rows are still tracked by the same 'Joint' key.
      component.data = [
        { accountId: 2, accountName: 'Joint', amount: 90 },
        { accountId: 1, accountName: 'Joint', amount: 10 },
      ];
      fixture.detectChanges();

      const rows = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.row')
      );
      const rowTexts = rows.map((row) => (row as HTMLElement).textContent ?? '');

      expect(rows).toHaveLength(2);
      expect(rowTexts[0]).toContain('£90.00');
      expect(rowTexts[1]).toContain('£10.00');
    });

    it('should not trigger a duplicate track key warning, since accountId is unique', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(() => {
        component.data = [
          { accountId: 1, accountName: 'Joint', amount: 50 },
          { accountId: 2, accountName: 'Joint', amount: 30 },
        ];
        fixture.detectChanges();
      }).not.toThrow();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('with tied (identical) amounts across multiple accounts', () => {
    it('should render every account rather than dropping any as a result of the tie', () => {
      component.data = [
        { accountId: 1, accountName: 'Main', amount: 20 },
        { accountId: 2, accountName: 'Savings', amount: 20 },
        { accountId: 3, accountName: 'Joint', amount: 20 },
      ];
      fixture.detectChanges();

      const rows = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.row'
      );

      expect(rows.length).toBe(3);
    });

    it('should split percentOfTotal evenly across tied accounts rather than erroring', () => {
      component.data = [
        { accountId: 1, accountName: 'Main', amount: 20 },
        { accountId: 2, accountName: 'Savings', amount: 20 },
      ];

      expect(component['percentOfTotal'](20)).toBeCloseTo(50);
    });
  });

  describe('without data', () => {
    it('should show the "no accounts" empty state', () => {
      component.data = [];
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('No accounts yet.');
    });
  });

  describe('widthPercent', () => {
    it('should scale the largest amount to 100%', () => {
      component.data = [
        { accountId: 1, accountName: 'Main', amount: 50 },
        { accountId: 2, accountName: 'Savings', amount: 25 },
      ];

      expect(component['widthPercent'](50)).toBe(100);
      expect(component['widthPercent'](25)).toBe(50);
    });

    it('should not divide by zero when data is empty', () => {
      component.data = [];

      expect(component['widthPercent'](0)).toBe(0);
    });
  });

  describe('percentOfTotal', () => {
    it('should not divide by zero when the total is zero', () => {
      component.data = [{ accountId: 1, accountName: 'Main', amount: 0 }];

      expect(component['percentOfTotal'](0)).toBe(0);
    });
  });
});
