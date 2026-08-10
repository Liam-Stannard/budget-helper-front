import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { APP_CONSTANTS } from '../../../../app.constants';
import { IMatMenuButtonActionEvent } from '../../../transaction/components/transaction-list/transaction-list.interfaces';
import { AccountListComponent } from '../account-list/account-list.component';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { AccountApiService } from '../../api/account-api.service';
import { IAccount } from '../../shared/account.interface';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-account-list-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    AccountListComponent,
  ],
  templateUrl: './account-list-wrapper.component.html',
  styleUrl: './account-list-wrapper.component.scss',
})
export class AccountListWrapperComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected data = signal<IAccount[]>([]);

  constructor(
    private accountApiService: AccountApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.getData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected getData(): void {
    this.accountApiService.getAccountList().subscribe({
      next: (res) => {
        this.data.set(res.accountList);
        this.loading.set(false);
      },
      error: (err) => {
        this.handleError('Failed to load accounts', err);
      },
    });
  }

  protected triggerAction(event: IMatMenuButtonActionEvent<IAccount>): void {
    switch (event.action) {
      case APP_CONSTANTS.ACTION_EDIT:
        this.edit(event.item);
        break;

      case APP_CONSTANTS.ACTION_DELETE:
        this.delete(event.item);
    }
  }

  protected edit(account: IAccount): void {
    if (!account.id) {
      throw Error('Account should have an ID');
    }

    this.navigate(['account', APP_CONSTANTS.MODE_EDIT, account.id.toString()]);
  }

  protected delete(account: IAccount): void {
    if (!account.id) {
      throw Error('Account should have an ID');
    }

    const id = account.id;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete account',
        message: `Are you sure you want to delete ${account.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.accountApiService.deleteAccount(id).subscribe({
        next: () => {
          this.snackBar.open(`Deleted account ${account.name}`, 'Dismiss', {
            duration: 3000,
          });
          this.getData();
        },
        error: (err) => {
          this.errorNotifier.notify(
            `Delete account failed for ${account.name}`,
            err
          );
        },
      });
    });
  }
}
