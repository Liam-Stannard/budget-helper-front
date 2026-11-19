import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BudgetProgressComponent } from './budget-progress.component';

describe('BudgetProgressComponent', () => {
  let fixture: ComponentFixture<BudgetProgressComponent>;
  let component: BudgetProgressComponent;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetProgressComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetProgressComponent);
    component = fixture.componentInstance;
  });

  it('should show the empty state with no rows', () => {
    fixture.detectChanges();

    expect(text()).toContain('No spending or budgets yet this month.');
  });

  it('should describe over, warning, ok and unbudgeted rows', () => {
    component.rows = [
      { category: 'BILL', spent: 600, limit: 500, percentUsed: 120, remaining: -100, status: 'over' },
      { category: 'FOOD', spent: 90, limit: 100, percentUsed: 90, remaining: 10, status: 'warning' },
      { category: 'SUBSCRIPTION', spent: 10, limit: 40, percentUsed: 25, remaining: 30, status: 'ok' },
      { category: 'CLOTHING', spent: 70, status: 'none' },
    ];
    fixture.detectChanges();

    expect(text()).toContain('£100.00 over budget');
    expect(text()).toContain('£10.00 left · 90% used');
    expect(text()).toContain('£30.00 left · 25% used');
    expect(text()).toContain('No budget set');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-progress-bar')
    ).toHaveLength(3);
  });

  it('should cap the bar at 100% and colour it by status', () => {
    const over = { category: 'BILL' as const, spent: 600, limit: 500, percentUsed: 120, remaining: -100, status: 'over' as const };
    const ok = { category: 'FOOD' as const, spent: 10, limit: 100, percentUsed: 10, remaining: 90, status: 'ok' as const };

    expect(component['barValue'](over)).toBe(100);
    expect(component['barColor'](over)).toBe('var(--status-bad)');
    expect(component['barColor'](ok)).toBe('var(--series-food)');
  });
});
