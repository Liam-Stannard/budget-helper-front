import { FormControl } from '@angular/forms';

export interface ITransactionFormValues {
  title?: string;
  amount?: string;
  date?: string;
  category?: string;
  account?: string;
}

export interface ITransactionForm {
  title: FormControl<string | undefined>;
  amount: FormControl<string | undefined>;
  date: FormControl<string | undefined>;
  category: FormControl<string | undefined>;
  account: FormControl<string | undefined>;
}

export type ToFormControls<T> = {
  [K in keyof T]: FormControl<T[K]>;
};
