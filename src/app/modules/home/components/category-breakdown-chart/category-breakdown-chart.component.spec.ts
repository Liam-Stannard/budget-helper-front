import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryBreakdownChartComponent } from './category-breakdown-chart.component';
import { ICategoryAmount } from '../../home.utils';

describe('CategoryBreakdownChartComponent', () => {
  let component: CategoryBreakdownChartComponent;
  let fixture: ComponentFixture<CategoryBreakdownChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBreakdownChartComponent],
      providers: [{ provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBreakdownChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('with data', () => {
    const data: ICategoryAmount[] = [
      { category: 'BILL', amount: 50 },
      { category: 'FOOD', amount: 25 },
    ];

    beforeEach(() => {
      component.data = data;
      fixture.detectChanges();
    });

    it('should render a row per category with the friendly label and value', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Bill');
      expect(text).toContain('£50.00');
      expect(text).toContain('Food');
      expect(text).toContain('£25.00');
    });

    it('should not show the empty state', () => {
      const emptyState = (fixture.nativeElement as HTMLElement).querySelector(
        '.empty-state'
      );

      expect(emptyState).toBeNull();
    });
  });

  describe('without data', () => {
    it('should show the empty state', () => {
      component.data = [];
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('No transactions yet.');
    });
  });

  describe('widthPercent', () => {
    it('should scale the largest amount to 100%', () => {
      component.data = [
        { category: 'BILL', amount: 50 },
        { category: 'FOOD', amount: 25 },
      ];

      expect(component['widthPercent'](50)).toBe(100);
      expect(component['widthPercent'](25)).toBe(50);
    });

    it('should not divide by zero when data is empty', () => {
      component.data = [];

      expect(component['widthPercent'](0)).toBe(0);
    });
  });

  describe('label', () => {
    it('should fall back to the raw category when not found', () => {
      expect(component['label']('Unknown' as never)).toBe('Unknown');
    });
  });
});
