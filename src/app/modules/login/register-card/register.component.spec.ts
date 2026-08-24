import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MockAuthService } from '../../../../test/mockService';
import { AuthService } from '../../../core/auth/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(
      AuthService
    ) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {});

  describe('formInit', () => {});

  describe('createRequest', () => {
    it('should build the request with role hardcoded to ROLE_USER regardless of form state', () => {
      component['form'].controls.username.setValue('user');
      component['form'].controls.email.setValue('user@example.com');
      component['form'].controls.password.setValue('pass1234');
      component['form'].controls.confirmPassword.setValue('pass1234');

      expect(component['createRequest']()).toStrictEqual({
        username: 'user',
        role: 'ROLE_USER',
        email: 'user@example.com',
        password: 'pass1234',
      });
    });
  });

  describe('pristine form', () => {
    it('should leave the submit button disabled and show no validation errors before the user has typed anything', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const submitButton = compiled.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);

      expect(
        component['form'].controls.confirmPassword.hasError('passwordsMismatch')
      ).toBe(false);

      const errorText = compiled.querySelector('mat-error');
      expect(errorText).toBeNull();
    });
  });

  describe('register', () => {
    beforeEach(() => {
      component['form'].controls.username.setValue('user');
      component['form'].controls.email.setValue('user@example.com');
      component['form'].controls.password.setValue('pass1234');
      component['form'].controls.confirmPassword.setValue('pass1234');
    });

    it('should navigate to home on success', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);

      component['register']();

      expect(navigateSpy).toHaveBeenCalledWith(['home']);
    });

    it('should notify the user on failure', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      authService.register.mockReturnValueOnce(
        throwError(() => new Error('Conflict'))
      );

      component['register']();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Unable to create account',
        'Dismiss',
        expect.any(Object)
      );
    });

    it('should not attempt to register with an invalid form', () => {
      component['form'].controls.username.setValue('');

      component['register']();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should not attempt to register when passwords do not match', () => {
      component['form'].controls.confirmPassword.setValue('different');

      component['register']();

      expect(authService.register).not.toHaveBeenCalled();
      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(true);
    });

    it('should treat a trailing-whitespace-only difference as a mismatch', () => {
      component['form'].controls.confirmPassword.setValue('pass1234 ');

      component['register']();

      expect(authService.register).not.toHaveBeenCalled();
      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(true);
    });

    it('should clear the mismatch error and allow submission once the user fixes it', () => {
      component['form'].controls.confirmPassword.setValue('different');
      fixture.detectChanges();
      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(true);

      component['form'].controls.confirmPassword.setValue('pass1234');
      fixture.detectChanges();

      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(false);
      expect(component['form'].valid).toBe(true);

      component['register']();
      expect(authService.register).toHaveBeenCalled();
    });

    it('should reach the same valid state when confirmPassword is filled in before password (order independence)', () => {
      component['form'].controls.username.setValue('user2');
      component['form'].controls.email.setValue('user2@example.com');
      component['form'].controls.password.setValue('');
      component['form'].controls.confirmPassword.setValue('secret1234');
      fixture.detectChanges();

      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(true);

      component['form'].controls.password.setValue('secret1234');
      fixture.detectChanges();

      expect(
        component['form'].controls.confirmPassword.hasError(
          'passwordsMismatch'
        )
      ).toBe(false);
      expect(component['form'].valid).toBe(true);
    });

    it('should surface the backend conflict message (not a generic fallback) via the snackbar on a 409 response', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      const backendEnvelope = {
        message: 'resource already exists',
        status: 409,
        timestamp: new Date().toISOString(),
      };
      authService.register.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: backendEnvelope,
            })
        )
      );

      component['register']();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'resource already exists',
        'Dismiss',
        expect.any(Object)
      );
    });
  });
});
