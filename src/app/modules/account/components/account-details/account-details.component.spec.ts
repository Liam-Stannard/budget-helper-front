import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountDetailsComponent } from './account-details.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { MockAccountApiService, MockAuthService } from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';
import { AccountApiService } from '../../api/account-api.service';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDetailsComponent],
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

    fixture = TestBed.createComponent(AccountDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
