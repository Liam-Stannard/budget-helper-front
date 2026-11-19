import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RecentTransactionsComponent } from './recent-transactions.component';

describe('RecentTransactionsComponent', () => {
  let fixture: ComponentFixture<RecentTransactionsComponent>;
  let component: RecentTransactionsComponent;
  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentTransactionsComponent);
    component = fixture.componentInstance;
  });

  it('should sign income positive and spend negative, linking to each transaction', () => {
    const account = { id: 1, name: 'Main' };
    component.transactions = [
      { id: 7, title: 'Salary', amount: '3200.00', date: '2026-11-01', category: 'INCOME', account },
      { id: 8, title: 'Tesco', amount: '42.10', date: '2026-11-02', category: 'FOOD', account },
    ];
    fixture.detectChanges();

    const text = element().textContent ?? '';
    expect(text).toContain('+£3,200.00');
    expect(text).toContain('−£42.10');
    expect(text).toContain('Food · Main');
    expect(element().querySelector('a[href="/transaction/view/8"]')).not.toBeNull();
  });

  it('should show an empty state', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('No transactions in the last two months.');
  });
});
