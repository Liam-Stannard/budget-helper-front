import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SpendingPaceComponent } from './spending-pace.component';
import { ISpendingPace } from '../../dashboard.utils';

const pace: ISpendingPace = {
  dayOfMonth: 19,
  daysInMonth: 30,
  spentSoFar: 190,
  lastMonthToSameDay: 50,
  lastMonthTotal: 350,
  dailyAverage: 10,
  projectedTotal: 300,
};

describe('SpendingPaceComponent', () => {
  let fixture: ComponentFixture<SpendingPaceComponent>;
  let component: SpendingPaceComponent;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingPaceComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpendingPaceComponent);
    component = fixture.componentInstance;
  });

  it('should say how much more is being spent than last month', () => {
    component.pace = pace;
    fixture.detectChanges();

    expect(text()).toContain('Day 19 of 30');
    expect(text()).toContain('£140.00 more');
    expect(text()).toContain('£300.00');
  });

  it('should say how much less is being spent than last month', () => {
    component.pace = { ...pace, spentSoFar: 20 };
    fixture.detectChanges();

    expect(text()).toContain('£30.00 less');
  });

  it('should flag a projection over the total budget', () => {
    component.pace = pace;
    component.totalBudget = 250;
    fixture.detectChanges();

    expect(component['projectedOverBudget']).toBe(true);
    expect(text()).toContain('Total budget');
  });
});
