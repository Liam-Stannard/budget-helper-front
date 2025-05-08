import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionDetailsComponent } from './transaction-details.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../service/auth/auth.service';
import { MockAuthService, MockApiService } from '../../../../test/mockService';
import { TransactionApiService } from '../../../../app/component/transaction/api/transaction-api.service';

describe('TransactionDetailsComponent', () => {
  let component: TransactionDetailsComponent;
  let fixture: ComponentFixture<TransactionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionDetailsComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        {
          provide: TransactionApiService,
          useClass: MockApiService,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
