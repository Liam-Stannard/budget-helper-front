import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import {
  MockAccountApiService,
  MockAuthService,
} from '../../../../../test/mockService';
import { IAccount, IGetAccountListResponse } from '../../shared/account.interface';
import { AuthService } from '../../../../core/auth/auth.service';
import { AccountApiService } from '../../api/account-api.service';
import { AccountListWrapperComponent } from './account-list-wrapper.component';
import { APP_CONSTANTS } from '../../../../app.constants';

const account1: IAccount = {
  id: 1,
  name: 'Main',
};

const getAccountsResponse: IGetAccountListResponse = {
  accountList: [account1],
};

describe('AccountListWrapperComponent', () => {
  let component: AccountListWrapperComponent;
  let fixture: ComponentFixture<AccountListWrapperComponent>;
  let accountApiService: MockAccountApiService;
  let router: Router;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListWrapperComponent],
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

    fixture = TestBed.createComponent(AccountListWrapperComponent);
    component = fixture.componentInstance;
    accountApiService = TestBed.inject(
      AccountApiService
    ) as unknown as MockAccountApiService;
    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getAccountList', () => {
      expect(accountApiService.getAccountList).toHaveBeenCalled();
    });

    it('should set the data signal from the response', () => {
      expect(component['data']()).toEqual(getAccountsResponse.accountList);
    });

    it('should set loading to false', () => {
      expect(component['loading']()).toBe(false);
    });
  });

  describe('edit', () => {
    it('should navigate to the edit route for the account', () => {
      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);

      component['edit'](account1);

      expect(navigateSpy).toHaveBeenCalledWith(['account', 'edit', '1']);
    });

    it('should throw if the account has no id', () => {
      expect(() =>
        component['edit']({ ...account1, id: undefined })
      ).toThrow();
    });
  });

  describe('delete', () => {
    let snackBarSpy: jest.SpyInstance;

    beforeEach(() => {
      snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
    });

    it('should throw if the account has no id', () => {
      expect(() =>
        component['delete']({ ...account1, id: undefined })
      ).toThrow();
    });

    it('should do nothing if the user cancels the confirm dialog', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(false) } as any);

      component['delete'](account1);

      expect(accountApiService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should call deleteAccount and refresh the list on confirm', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(true) } as any);
      accountApiService.getAccountList.mockClear();

      component['delete'](account1);

      expect(accountApiService.deleteAccount).toHaveBeenCalledWith(1);
      expect(snackBarSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deleted account'),
        'Dismiss',
        expect.any(Object)
      );
      expect(accountApiService.getAccountList).toHaveBeenCalledTimes(1);
    });

    it('should notify with a generic message on delete failure', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(true) } as any);
      accountApiService.deleteAccount.mockReturnValueOnce(
        throwError(() => new Error('failed'))
      );

      component['delete'](account1);

      expect(snackBarSpy).toHaveBeenCalledWith(
        expect.stringContaining('Delete account failed'),
        'Dismiss',
        expect.any(Object)
      );
    });

    it('should surface the backend error message when present', () => {
      jest
        .spyOn(dialog, 'open')
        .mockReturnValue({ afterClosed: () => of(true) } as any);
      accountApiService.deleteAccount.mockReturnValueOnce(
        throwError(() => ({
          error: { message: 'Cannot delete an account that still has transactions.' },
        }))
      );

      component['delete'](account1);

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Cannot delete an account that still has transactions.',
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('triggerAction', () => {
    it('should call edit for ACTION_EDIT', () => {
      const editSpy = jest
        .spyOn(component as any, 'edit')
        .mockImplementation();

      component['triggerAction']({
        action: APP_CONSTANTS.ACTION_EDIT,
        item: account1,
      });

      expect(editSpy).toHaveBeenCalledWith(account1);
    });

    it('should call delete for ACTION_DELETE', () => {
      const deleteSpy = jest
        .spyOn(component as any, 'delete')
        .mockImplementation();

      component['triggerAction']({
        action: APP_CONSTANTS.ACTION_DELETE,
        item: account1,
      });

      expect(deleteSpy).toHaveBeenCalledWith(account1);
    });
  });
});
