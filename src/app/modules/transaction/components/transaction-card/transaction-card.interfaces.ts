import { FormControl } from '@angular/forms';
import { Category } from '../../shared/transaction.types';

export interface ITransactionFormValues {
  title?: string;
  amount?: string;
  date?: Date;
  category?: Category;
  account?: string;
}

export interface ITransactionForm {
  title: FormControl<string | undefined>;
  amount: FormControl<string | undefined>;
  date: FormControl<Date | undefined>;
  category: FormControl<Category | undefined>;
  account: FormControl<string | undefined>;
}

export type ToFormControls<T> = {
  [K in keyof T]: FormControl<T[K]>;
};
