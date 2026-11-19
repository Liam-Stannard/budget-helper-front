import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AccountBalancesComponent } from './account-balances.component';

describe('AccountBalancesComponent', () => {
  let fixture: ComponentFixture<AccountBalancesComponent>;
  let component: AccountBalancesComponent;
  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountBalancesComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountBalancesComponent);
    component = fixture.componentInstance;
  });

  it('should list each account with its balance, negatives flagged', () => {
    component.accounts = [
      { id: 1, name: 'Main', currentBalance: '1250.0000' },
      { id: 2, name: 'Card', currentBalance: '-40.0000' },
    ];
    fixture.detectChanges();

    expect(element().textContent).toContain('Main');
    expect(element().textContent).toContain('£1,250.00');
    expect(element().querySelectorAll('.text-bad')).toHaveLength(1);
  });

  it('should offer to add an account when there are none', () => {
    fixture.detectChanges();

    expect(element().textContent).toContain('No accounts yet.');
    expect(element().textContent).toContain('Add account');
  });
});
