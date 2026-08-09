import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountListComponent } from './account-list.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MockAuthService } from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';
import { AccountApiService } from '../../api/account-api.service';
import { IAccount } from '../../shared/account.interface';

const account1: IAccount = {
  id: 1,
  name: 'Main',
};

export class MockAccountApiService {}

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListComponent],
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
          useValue: {},
        },
        {
          provide: AccountApiService,
          useClass: MockAccountApiService,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should update the data source when tableData changes', () => {
      component.tableData = [account1];

      component.ngOnChanges({
        tableData: {
          previousValue: [],
          currentValue: [account1],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component['dataSource'].data).toEqual([account1]);
    });
  });

  describe('onClickEmitAction', () => {
    it('should emit the action', () => {
      const emitSpy = jest.spyOn(component.actionTriggered, 'emit');
      const action = { action: 'ACTION_EDIT', item: account1 };

      component['onClickEmitAction'](action);

      expect(emitSpy).toHaveBeenCalledWith(action);
    });
  });
});
