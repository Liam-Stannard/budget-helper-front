import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCardComponent } from './account-card.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import {
  MockAccountApiService,
  MockAuthService,
} from '../../../../../test/mockService';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountApiService } from '../../api/account-api.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('AccountCardComponent', () => {
  let component: AccountCardComponent;
  let fixture: ComponentFixture<AccountCardComponent>;

  describe('add mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AccountCardComponent],
        providers: [
          provideAnimationsAsync(),
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: AuthService,
            useClass: MockAuthService,
          },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => null } } },
          },
          {
            provide: Router,
            useValue: { url: '/account/add', navigate: jest.fn() },
          },
          {
            provide: AccountApiService,
            useClass: MockAccountApiService,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AccountCardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not fetch data', () => {
      expect(component['shouldGetData']).toBe(false);
    });
  });

  describe('edit mode', () => {
    let accountApiService: MockAccountApiService;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AccountCardComponent],
        providers: [
          provideAnimationsAsync(),
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: AuthService,
            useClass: MockAuthService,
          },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => '1' } } },
          },
          {
            provide: Router,
            useValue: { url: '/account/edit/1', navigate: jest.fn() },
          },
          {
            provide: AccountApiService,
            useClass: MockAccountApiService,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AccountCardComponent);
      component = fixture.componentInstance;
      accountApiService = TestBed.inject(
        AccountApiService
      ) as unknown as MockAccountApiService;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should fetch the account by id', () => {
      expect(accountApiService.getAccount).toHaveBeenCalledWith('1');
    });

    it('should load the account name into the form', () => {
      expect(component['form'].controls.name.value).toBe('Main');
    });

    describe('when getAccount fails', () => {
      it('should stop the spinner and notify the user', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
        accountApiService.getAccount.mockReturnValueOnce(
          throwError(() => new Error('network down'))
        );

        component['getData']();

        expect(component['loading']()).toBe(false);
        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to load data',
          'Dismiss',
          expect.any(Object)
        );
      });
    });

    describe('when submit fails', () => {
      it('should notify the user without navigating away', () => {
        const snackBar = TestBed.inject(MatSnackBar);
        const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
        const backSpy = jest
          .spyOn(component as any, 'back')
          .mockImplementation();
        accountApiService.putAccount.mockReturnValueOnce(
          throwError(() => new Error('network down'))
        );
        component['form'].controls.name.setValue('Updated');

        component['submit']();

        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to save',
          'Dismiss',
          expect.any(Object)
        );
        expect(backSpy).not.toHaveBeenCalled();
      });
    });
  });
});
