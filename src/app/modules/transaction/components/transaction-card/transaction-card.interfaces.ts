import { FormControl } from '@angular/forms';
import { Category } from '../../shared/transaction.types';
import { IAccount } from '../../../account/shared/account.interface';

export interface ITransactionFormValues {
  title?: string;
  amount?: string;
  date?: Date;
  category?: Category;
  account?: IAccount;
}

export interface ITransactionForm {
  title: FormControl<string | undefined>;
  amount: FormControl<string | undefined>;
  date: FormControl<Date | undefined>;
  category: FormControl<Category | undefined>;
  account: FormControl<IAccount | undefined>;
}

export type ToFormControls<T> = {
  [K in keyof T]: FormControl<T[K]>;
};
