import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MockAuthService } from '../../../../test/mockService';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NavComponent } from './nav.component';

@Component({ standalone: true, template: '' })
class BlankComponent {}

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let router: Router;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        provideRouter([{ path: '**', component: BlankComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Trends nav link', () => {
    it('should render the Trends link when the user is logged in', () => {
      authService.loggedIn.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const trendsLink = compiled.querySelector('a[routerLink="/trends"]');

      expect(trendsLink).not.toBeNull();
      expect(trendsLink?.textContent).toContain('Trends');
    });

    it('should not render the Trends link (or any other logged-in-only link) when the user is logged out', () => {
      authService.loggedIn.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('a[routerLink="/trends"]')).toBeNull();
      expect(compiled.querySelector('a[routerLink="/home"]')).toBeNull();
      expect(compiled.querySelector('a[routerLink="/transactions"]')).toBeNull();
      expect(compiled.querySelector('a[routerLink="/accounts"]')).toBeNull();
      expect(compiled.querySelector('a[routerLink="/login"]')).not.toBeNull();
    });
  });

  describe('showBackButton', () => {
    it('should be false on the home route', async () => {
      await router.navigateByUrl('/home');
      fixture.detectChanges();

      expect(component['showBackButton']()).toBe(false);
    });

    it('should be true after navigating to a non top-level route', async () => {
      await router.navigateByUrl('/transaction/add');
      fixture.detectChanges();

      expect(component['showBackButton']()).toBe(true);
    });

    it('should be false on the /trends route', async () => {
      await router.navigateByUrl('/trends');
      fixture.detectChanges();

      expect(component['showBackButton']()).toBe(false);
    });

    it('should be false after navigating to /login', async () => {
      await router.navigateByUrl('/transaction/add');
      fixture.detectChanges();

      await router.navigateByUrl('/login');
      fixture.detectChanges();

      expect(component['showBackButton']()).toBe(false);
    });
  });
});
