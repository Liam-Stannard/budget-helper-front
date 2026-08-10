import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MockAuthService } from '../../../../test/mockService';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
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

  describe('createReqest', () => {});

  describe('login', () => {
    beforeEach(() => {
      component['form'].controls.username.setValue('user');
      component['form'].controls.password.setValue('pass');
    });

    it('should navigate to home on success', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);

      component['login']();

      expect(navigateSpy).toHaveBeenCalledWith(['home']);
    });

    it('should notify the user on failure', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      const snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
      authService.authenticate.mockReturnValueOnce(
        throwError(() => new Error('Unauthorized'))
      );

      component['login']();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Invalid username or password',
        'Dismiss',
        expect.any(Object)
      );
    });

    it('should not attempt to log in with an invalid form', () => {
      component['form'].controls.username.setValue('');

      component['login']();

      expect(authService.authenticate).not.toHaveBeenCalled();
    });
  });
});
