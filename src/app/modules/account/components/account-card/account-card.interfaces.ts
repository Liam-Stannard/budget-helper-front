import { FormControl } from '@angular/forms';

export interface IAccountFormValues {
  name?: string;
  startingBalance?: string;
}

export interface IAccountForm {
  name: FormControl<string | undefined>;
  startingBalance: FormControl<string | undefined>;
}
