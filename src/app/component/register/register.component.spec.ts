import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterFormComponent } from './register.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../service/auth/auth.service';
import { provideRouter } from '@angular/router';
import { MockAuthService } from '../../../test/mockService';

describe('RegisterFormComponent', () => {
  let component: RegisterFormComponent;
  let fixture: ComponentFixture<RegisterFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFormComponent],
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

    fixture = TestBed.createComponent(RegisterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {});

  describe('formInit', () => {});

  describe('createRequest', () => {});

  describe('register', () => {});
});
