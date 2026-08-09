import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionPageComponent } from './transaction-page.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MockAuthService } from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';

describe('TransactionPageComponent', () => {
  let component: TransactionPageComponent;
  let fixture: ComponentFixture<TransactionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionPageComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
