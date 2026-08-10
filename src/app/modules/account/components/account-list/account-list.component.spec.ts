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

  describe('isNegative', () => {
    it('should be true for a negative balance', () => {
      expect(component['isNegative']('-40.0000')).toBe(true);
    });

    it('should be false for a positive balance', () => {
      expect(component['isNegative']('40.0000')).toBe(false);
    });

    it('should be false for a zero balance', () => {
      expect(component['isNegative']('0.0000')).toBe(false);
    });

    it('should be false when balance is undefined', () => {
      expect(component['isNegative'](undefined)).toBe(false);
    });
  });

  describe('sortingDataAccessor', () => {
    it('should sort currentBalance numerically, not lexicographically', () => {
      const accounts: IAccount[] = [
        { id: 1, name: 'A', currentBalance: '9.0000' },
        { id: 2, name: 'B', currentBalance: '-40.0000' },
        { id: 3, name: 'C', currentBalance: '100.0000' },
      ];

      const sorted = [...accounts].sort(
        (a, b) =>
          Number(
            component['dataSource'].sortingDataAccessor(a, 'currentBalance')
          ) -
          Number(
            component['dataSource'].sortingDataAccessor(b, 'currentBalance')
          )
      );

      expect(sorted.map((a) => a.name)).toEqual(['B', 'A', 'C']);
    });
  });
});
