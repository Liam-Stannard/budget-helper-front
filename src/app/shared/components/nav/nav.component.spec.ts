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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

    it('should be false after navigating to /login', async () => {
      await router.navigateByUrl('/transaction/add');
      fixture.detectChanges();

      await router.navigateByUrl('/login');
      fixture.detectChanges();

      expect(component['showBackButton']()).toBe(false);
    });
  });
});
