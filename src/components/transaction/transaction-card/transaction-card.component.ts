import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BaseNetworkingComponent } from '../../base/base-networking.component';
import {
  IGetTransactionResponse,
  IPutTransactionRequest,
  IPostPutTransactionResponse,
  ITransaction,
  IBaseTransaction,
} from '../../../services/api/interfaces/transaction.interface';
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
import {
  ITransactionForm,
  ITransactionFormValues,
} from './interface/transaction-card.interface';
import { BaseInsertEditComponent } from '../../base/base-add-edit.component';
import {
  dateValidator,
  freeTextValidator,
  moneyValidator,
} from '../../../util/validators/validators';
import { CATEGORY_OPTIONS } from '../constants/transcations.constants';
import { SelectOption } from '../../../interface/interfaces';
import { MatSelect, MatSelectModule } from '@angular/material/select';

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
  extends BaseInsertEditComponent<
    IGetTransactionResponse,
    IPutTransactionRequest,
    ITransactionForm,
    ITransactionFormValues
  >
  implements OnInit, OnDestroy
{
  protected categoryOptions: SelectOption<string, string>[] = CATEGORY_OPTIONS;

  private id: string | undefined;

  constructor() {
    super();
    if (this.isEdit) {
      this.id = this.route.snapshot.paramMap.get('ID') ?? undefined;

      if (!this.id) {
        throw Error('Transaction should have an ID');
      }
    }
  }

  override ngOnInit(): void {
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

  protected override getData(): Observable<IGetTransactionResponse> {
    if (!this.id) {
      throw Error('Transaction should have an ID');
    }

    return this.apiService.getTransaction(this.id);
  }

  protected override furtherDataActions(): void {
    super.furtherDataActions();
    this.form.patchValue(this.formData);
  }

  protected override submitData(): Observable<IPostPutTransactionResponse> {
    if (this.isEdit) {
      if (!this.id) {
        throw Error('Transaction should have an ID');
      }
      return this.apiService.putTransaction(
        this.id,
        this.mapFormDataToITransactionForPut()
      );
    } else {
      return this.apiService.postTransaction(
        this.mapFormDataToITransactionForPost()
      );
    }
  }

  protected override mapGetResponseToFormData(): ITransactionFormValues {
    return {
      title: this.getResponse.transaction.title,
      amount: this.getResponse.transaction.amount,
      date: this.getResponse.transaction.date,
      category: this.getResponse.transaction.category,
      account: this.getResponse.transaction.account,
    };
  }

  protected mapFormDataToITransactionForPut(): ITransaction {
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

  protected mapFormDataToITransactionForPost(): IBaseTransaction {
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
}
