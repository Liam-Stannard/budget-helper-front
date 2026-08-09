import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AbstractNetworkingComponent } from '../../../../core/component/abstract/abstract-networking.component';
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
import { MatSelectModule } from '@angular/material/select';
import { Mode, APP_CONSTANTS } from '../../../../app.constants';
import { MenuOption } from '../../../../shared/interface/menu-options.interfaces';
import {
  freeTextValidator,
  moneyValidator,
  dateValidator,
} from '../../../../shared/validators/validator';
import { TransactionApiService } from '../../api/transaction-api.service';
import {
  IGetTransactionResponse,
  IPutTransactionRequest,
  IPostPutTransactionResponse,
  ITransaction,
} from '../../shared/transaction.interface';
import { Category } from '../../shared/transaction.types';
import { CATEGORY_OPTIONS } from '../../shared/transcations.constants';
import {
  ITransactionForm,
  ITransactionFormValues,
} from './transaction-card.interfaces';

@Component({
  selector: 'transaction-card.',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss',
})
export class TransactionCardComponent
  extends AbstractNetworkingComponent<
    IGetTransactionResponse,
    IPutTransactionRequest
  >
  implements OnInit, OnDestroy
{
  protected categoryOptions: MenuOption<string, Category>[] = CATEGORY_OPTIONS;

  protected form!: FormGroup<ITransactionForm>;
  protected formData!: ITransactionFormValues;
  protected mode: Mode = APP_CONSTANTS.MODE_EDIT;

  private id: string | undefined;

  constructor(
    private fb: FormBuilder,
    private apiService: TransactionApiService
  ) {
    super();
  }

  override ngOnInit(): void {
    this.mode = this.determineMode();

    if (this.mode === APP_CONSTANTS.MODE_EDIT) {
      this.id = this.route.snapshot.paramMap.get('ID') ?? undefined;
      this.shouldGetData = true;

      if (!this.id) {
        throw Error('Transaction should have an ID');
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

  protected formInit(): FormGroup<ITransactionForm> {
    return this.fb.nonNullable.group<ITransactionForm>({
      title: this.fb.nonNullable.control(undefined, [
        Validators.required,
        freeTextValidator,
      ]),
      amount: this.fb.nonNullable.control(undefined, [
        Validators.required,
        moneyValidator,
      ]),
      date: this.fb.nonNullable.control(undefined, [
        Validators.required,
        dateValidator,
      ]),
      category: this.fb.nonNullable.control(undefined, [Validators.required]),
      account: this.fb.nonNullable.control(undefined, [Validators.required]),
    });
  }

  protected getDataObservable(): Observable<IGetTransactionResponse> {
    if (!this.id) {
      throw Error('Transaction should have an ID');
    }

    return this.apiService.getTransaction(this.id);
  }

  protected override executeGetDataEffects(): void {
    this.formData = this.mapGetResponseToFormData();
    this.form.patchValue(this.formData);
  }

  protected override submitDataObservable(): Observable<IPostPutTransactionResponse> {
    if (this.mode === APP_CONSTANTS.MODE_EDIT) {
      if (!this.id) {
        throw Error('Transaction should have an ID');
      }
      return this.apiService.putTransaction(this.id, this.createPutRequest());
    } else {
      return this.apiService.postTransaction(this.createPostReqest());
    }
  }

  protected determineMode(): Mode {
    return this.router.url.includes(APP_CONSTANTS.MODE_EDIT)
      ? APP_CONSTANTS.MODE_EDIT
      : APP_CONSTANTS.MODE_ADD;
  }

  protected mapGetResponseToFormData(): ITransactionFormValues {
    return {
      title: this.getResponse.transaction.title,
      amount: this.getResponse.transaction.amount,
      date: this.getResponse.transaction.date,
      category: this.getResponse.transaction.category,
      account: this.getResponse.transaction.account,
    };
  }

  protected createPutRequest(): ITransaction {
    const formValues = this.form.getRawValue();
    if (
      !formValues.title ||
      !formValues.amount ||
      !formValues.date ||
      !formValues.category ||
      !formValues.account
    ) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    if (!this.id) {
      throw Error('Transaction should have an ID');
    }

    return {
      id: Number(this.id),
      title: formValues.title,
      amount: formValues.amount,
      date: formValues.date,
      category: formValues.category,
      account: formValues.account,
    };
  }

  protected createPostReqest(): ITransaction {
    const formValues = this.form.getRawValue();
    if (
      !formValues.title ||
      !formValues.amount ||
      !formValues.date ||
      !formValues.category ||
      !formValues.account
    ) {
      throw Error(`Required form value is undefined - ${formValues}`);
    }

    return {
      title: formValues.title,
      amount: formValues.amount,
      date: formValues.date,
      category: formValues.category,
      account: formValues.account,
    };
  }

  protected displayOptionCompare(
    first: MenuOption<Category, Category>,
    second: MenuOption<Category, Category>
  ): boolean {
    return first && second ? first.value === second.value : first === second;
  }
}
