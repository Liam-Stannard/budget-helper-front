import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryComparisonChartComponent } from './category-comparison-chart.component';
import { ICategoryComparison } from '../../home.utils';

describe('CategoryComparisonChartComponent', () => {
  let component: CategoryComparisonChartComponent;
  let fixture: ComponentFixture<CategoryComparisonChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryComparisonChartComponent],
      providers: [{ provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryComparisonChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('with data', () => {
    const data: ICategoryComparison[] = [
      { category: 'BILL', currentAmount: 50, previousAmount: 20 },
      { category: 'FOOD', currentAmount: 0, previousAmount: 25 },
    ];

    beforeEach(() => {
      component.data = data;
      fixture.detectChanges();
    });

    it('should render a row per category with the friendly label and both months values', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Bill');
      expect(text).toContain('£50.00');
      expect(text).toContain('£20.00');
      expect(text).toContain('Food');
      expect(text).toContain('£25.00');
    });

    it('should still render a bar for a category with no spend in one of the two months', () => {
      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.bar'
      );

      // 2 categories x 2 months = 4 bars, even though FOOD has no current-month spend
      expect(bars.length).toBe(4);
    });

    it('should not show the empty state', () => {
      const emptyState = (fixture.nativeElement as HTMLElement).querySelector(
        '.empty-state'
      );

      expect(emptyState).toBeNull();
    });

    it('should render the legend exactly once, not once per category', () => {
      const legends = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.legend'
      );
      const legendItems = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.legend-item'
      );

      expect(legends.length).toBe(1);
      expect(legendItems.length).toBe(2); // "This month" + "Last month"
    });
  });

  describe('with all four categories present', () => {
    const fullData: ICategoryComparison[] = [
      { category: 'BILL', currentAmount: 50, previousAmount: 20 },
      { category: 'FOOD', currentAmount: 0, previousAmount: 25 },
      { category: 'SUBSCRIPTION', currentAmount: 15, previousAmount: 0 },
      { category: 'CLOTHING', currentAmount: 5, previousAmount: 5 },
    ];

    beforeEach(() => {
      component.data = fullData;
      fixture.detectChanges();
    });

    it('should render exactly 2 bars per category (this-month and last-month) and no more', () => {
      const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.row');
      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll('.bar');

      expect(rows.length).toBe(fullData.length);
      expect(bars.length).toBe(fullData.length * 2);

      rows.forEach((row) => {
        expect(row.querySelectorAll('.bar').length).toBe(2);
      });
    });

    it('should still render the legend exactly once with 4 categories', () => {
      const legendItems = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.legend-item'
      );

      expect(legendItems.length).toBe(2);
    });
  });

  describe('with a large amount disparity across categories', () => {
    beforeEach(() => {
      component.data = [
        { category: 'BILL', currentAmount: 10000, previousAmount: 0 },
        { category: 'FOOD', currentAmount: 10, previousAmount: 0 },
      ];
      fixture.detectChanges();
    });

    it('should render the largest bar at 100% width and not overflow past 100%', () => {
      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.bar-current'
      ) as NodeListOf<HTMLElement>;

      const widths = Array.from(bars).map((bar) => bar.style.width);

      expect(widths).toContain('100%');
      widths.forEach((width) => {
        expect(parseFloat(width)).toBeLessThanOrEqual(100);
      });
    });

    it('should render a visible non-zero width for the much smaller amount rather than collapsing it to nothing', () => {
      // locate by text content since row order depends on data order passed in
      const rows = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.row')
      );
      const foodRow = rows.find((row) => row.textContent?.includes('Food'));
      const bar = foodRow?.querySelector('.bar-current') as HTMLElement;

      expect(bar).toBeTruthy();
      expect(parseFloat(bar.style.width)).toBeCloseTo(0.1);
      expect(parseFloat(bar.style.width)).toBeGreaterThan(0);
    });
  });

  describe('with only one category ever present (new user with a single category of spend)', () => {
    it('should still render 2 bars and treat the single amount as 100% width', () => {
      component.data = [{ category: 'FOOD', currentAmount: 42, previousAmount: 0 }];
      fixture.detectChanges();

      const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.bar'
      ) as NodeListOf<HTMLElement>;

      expect(bars.length).toBe(2);
      expect(bars[0].style.width).toBe('100%');
      expect(bars[1].style.width).toBe('0%');
    });
  });

  describe('without data', () => {
    it('should show the empty state when the data array is empty', () => {
      component.data = [];
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('No transactions yet.');
    });

    it('should show the empty state when every category is zero-filled for both months', () => {
      component.data = [
        { category: 'BILL', currentAmount: 0, previousAmount: 0 },
        { category: 'FOOD', currentAmount: 0, previousAmount: 0 },
      ];
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('No transactions yet.');
    });
  });

  describe('widthPercent', () => {
    it('should scale the largest amount across either month to 100%', () => {
      component.data = [
        { category: 'BILL', currentAmount: 50, previousAmount: 10 },
        { category: 'FOOD', currentAmount: 25, previousAmount: 5 },
      ];

      expect(component['widthPercent'](50)).toBe(100);
      expect(component['widthPercent'](25)).toBe(50);
    });

    it('should not divide by zero when data is empty', () => {
      component.data = [];

      expect(component['widthPercent'](0)).toBe(0);
    });

    it('should not divide by zero when data is present but every amount is zero', () => {
      component.data = [
        { category: 'BILL', currentAmount: 0, previousAmount: 0 },
        { category: 'FOOD', currentAmount: 0, previousAmount: 0 },
      ];

      expect(component['widthPercent'](0)).toBe(0);
      expect(Number.isNaN(component['widthPercent'](0))).toBe(false);
    });

    it('should scale a very small amount to a tiny (but non-NaN, non-overflowing) percent next to a 1000x larger one', () => {
      component.data = [
        { category: 'BILL', currentAmount: 5000, previousAmount: 0 },
        { category: 'FOOD', currentAmount: 5, previousAmount: 0 },
      ];

      expect(component['widthPercent'](5000)).toBe(100);
      expect(component['widthPercent'](5)).toBeCloseTo(0.1);
      expect(Number.isFinite(component['widthPercent'](5))).toBe(true);
    });

    it('should clamp a negative amount to 0% rather than a negative percent (refund-style negative amounts)', () => {
      component.data = [{ category: 'FOOD', currentAmount: 20, previousAmount: -5 }];

      // Negative amounts are clamped to 0 before scaling, so a refund-heavy category
      // renders as an explicit 0% bar instead of a negative value relying on the
      // browser's CSS clamping of [style.width.%].
      expect(component['widthPercent'](-5)).toBe(0);
    });
  });

  describe('label', () => {
    it('should fall back to the raw category when not found', () => {
      expect(component['label']('Unknown' as never)).toBe('Unknown');
    });
  });
});
