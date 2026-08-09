import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
import { freeTextValidator } from '../../../../shared/validators/validator';
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
    MatCardModule,
    MatProgressBarModule,
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
    };
  }

  protected createPutRequest(): IAccount {
    const formValues = this.form.getRawValue();
    if (!formValues.name) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    if (!this.id) {
      throw Error('Account should have an ID');
    }

    return {
      id: Number(this.id),
      name: formValues.name,
    };
  }

  protected createPostRequest(): IAccount {
    const formValues = this.form.getRawValue();
    if (!formValues.name) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    return {
      name: formValues.name,
    };
  }
}
