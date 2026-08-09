import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { MockApiService, MockAuthService } from '../../../test/mockService';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionApiService } from '../transaction/api/transaction-api.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
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
          provide: TransactionApiService,
          useClass: MockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set loading to false once the transaction list resolves', () => {
    expect(component['loading']()).toBe(false);
  });

  it('should compute the category breakdown across all transactions', () => {
    expect(component['breakdown']()).toEqual([{ category: 'FOOD', amount: 100 }]);
  });

  it('should report the top category label', () => {
    expect(component['topCategoryLabel']()).toBe('Food');
  });

  it('should exclude transactions from a different month from "this month" stats', () => {
    // the mock transaction is dated 2020-01-01
    expect(component['totalThisMonth']()).toBe(0);
    expect(component['countThisMonth']()).toBe(0);
  });

  describe('with no transactions', () => {
    beforeEach(() => {
      component['transactions'].set([]);
      fixture.detectChanges();
    });

    it('should fall back to a placeholder top category label', () => {
      expect(component['topCategoryLabel']()).toBe('Not started');
    });
  });
});
