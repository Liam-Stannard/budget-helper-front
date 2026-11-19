import { Component, OnDestroy, OnInit } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AbstractNetworkingSignalComponent } from '../../../../core/component/abstract/abstract-networking-signals.component';
import { Observable } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Mode, APP_CONSTANTS } from '../../../../app.constants';
import {
  freeTextValidator,
  moneyValidator,
} from '../../../../shared/validators/validator';
import { AccountApiService } from '../../api/account-api.service';
import {
  IGetAccountResponse,
  IPutAccountRequest,
  IPostPutAccountResponse,
  IAccount,
} from '../../shared/account.interface';
import { IAccountForm, IAccountFormValues } from './account-card.interfaces';

@Component({
  selector: 'account-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss',
})
export class AccountCardComponent
  extends AbstractNetworkingSignalComponent<
    IGetAccountResponse,
    IPutAccountRequest
  >
  implements OnInit, OnDestroy
{
  protected form!: FormGroup<IAccountForm>;
  protected formData!: IAccountFormValues;
  protected mode: Mode = APP_CONSTANTS.MODE_EDIT;

  private id: string | undefined;

  constructor(
    private fb: FormBuilder,
    private apiService: AccountApiService
  ) {
    super();
  }

  override ngOnInit(): void {
    this.mode = this.determineMode();

    if (this.mode === APP_CONSTANTS.MODE_EDIT) {
      this.id = this.route.snapshot.paramMap.get('ID') ?? undefined;
      this.shouldGetData = true;

      if (!this.id) {
        throw Error('Account should have an ID');
      }
    } else {
      this.shouldGetData = false;
    }

    this.form = this.formInit();
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected formInit(): FormGroup<IAccountForm> {
    return this.fb.nonNullable.group<IAccountForm>({
      name: this.fb.nonNullable.control(undefined, [
        Validators.required,
        freeTextValidator,
      ]),
      startingBalance: this.fb.nonNullable.control('0.00', [
        Validators.required,
        moneyValidator,
      ]),
    });
  }

  protected getDataObservable(): Observable<IGetAccountResponse> {
    if (!this.id) {
      throw Error('Account should have an ID');
    }

    return this.apiService.getAccount(this.id);
  }

  protected override executeGetDataEffects(): void {
    this.formData = this.mapGetResponseToFormData();
    this.form.patchValue(this.formData);
  }

  protected override submitDataObservable(): Observable<IPostPutAccountResponse> {
    if (this.mode === APP_CONSTANTS.MODE_EDIT) {
      if (!this.id) {
        throw Error('Account should have an ID');
      }
      return this.apiService.putAccount(this.id, this.createPutRequest());
    } else {
      return this.apiService.postAccount(this.createPostRequest());
    }
  }

  protected determineMode(): Mode {
    return this.router.url.includes(APP_CONSTANTS.MODE_EDIT)
      ? APP_CONSTANTS.MODE_EDIT
      : APP_CONSTANTS.MODE_ADD;
  }

  protected mapGetResponseToFormData(): IAccountFormValues {
    const response = this.data();

    if (!response) {
      throw Error('Account data should be loaded');
    }

    return {
      name: response.account.name,
      // The backend returns a DECIMAL(19,4) string (e.g. "500.0000"); moneyValidator only
      // accepts exactly 2 decimal places, so this needs reformatting rather than passing the
      // raw value straight into the form.
      startingBalance: Number(response.account.startingBalance ?? 0).toFixed(
        2
      ),
    };
  }

  protected createPutRequest(): IAccount {
    const formValues = this.form.getRawValue();
    if (!formValues.name || !formValues.startingBalance) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    if (!this.id) {
      throw Error('Account should have an ID');
    }

    return {
      id: Number(this.id),
      name: formValues.name,
      startingBalance: formValues.startingBalance,
    };
  }

  protected createPostRequest(): IAccount {
    const formValues = this.form.getRawValue();
    if (!formValues.name || !formValues.startingBalance) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    return {
      name: formValues.name,
      startingBalance: formValues.startingBalance,
    };
  }
}
