import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BillsDueComponent } from './bills-due.component';
import { IBillDue } from '../../dashboard.utils';

describe('BillsDueComponent', () => {
  let fixture: ComponentFixture<BillsDueComponent>;
  let component: BillsDueComponent;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  const bill = (overrides: Partial<IBillDue>): IBillDue => ({
    title: 'Rent',
    category: 'BILL',
    expectedAmount: 800,
    expectedDate: '2026-11-25',
    daysUntilDue: 6,
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillsDueComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillsDueComponent);
    component = fixture.componentInstance;
  });

  it('should list bills with their due text and total', () => {
    component.bills = [
      bill({ title: 'Electric', expectedAmount: 60, daysUntilDue: -7 }),
      bill({}),
    ];
    fixture.detectChanges();

    expect(text()).toContain('About £860.00 still to go out');
    expect(text()).toContain('Expected 7 days ago');
    expect(text()).toContain('Due in 6 days');
  });

  it.each([
    [0, 'Due today'],
    [1, 'Due tomorrow'],
    [-1, 'Expected yesterday'],
  ])('should describe %i days as "%s"', (days, expected) => {
    expect(component['dueText'](bill({ daysUntilDue: days }))).toBe(expected);
  });

  it('should show an empty state', () => {
    fixture.detectChanges();

    expect(text()).toContain("All of last month's bills have been recorded this month.");
  });
});
