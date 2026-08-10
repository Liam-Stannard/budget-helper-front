import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionCardComponent } from './transaction-card.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MockAccountApiService,
  MockApiService,
  MockAuthService,
} from '../../../../../test/mockService';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransactionApiService } from '../../api/transaction-api.service';
import { AccountApiService } from '../../../account/api/account-api.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('TransactionCardComponent', () => {
  let component: TransactionCardComponent;
  let fixture: ComponentFixture<TransactionCardComponent>;
  let accountApiService: MockAccountApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionCardComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 123 }),
          },
        },
        {
          provide: TransactionApiService,
          useClass: MockApiService,
        },
        {
          provide: AccountApiService,
          useClass: MockAccountApiService,
        },
        provideRouter([]),
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCardComponent);
    component = fixture.componentInstance;
    accountApiService = TestBed.inject(
      AccountApiService
    ) as unknown as MockAccountApiService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when loadAccounts fails', () => {
    it('should notify the user', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      accountApiService.getAccountList.mockReturnValueOnce(
        throwError(() => new Error('network down'))
      );

      component['loadAccounts']();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load accounts',
        'Dismiss',
        expect.any(Object)
      );
    });
  });
});
