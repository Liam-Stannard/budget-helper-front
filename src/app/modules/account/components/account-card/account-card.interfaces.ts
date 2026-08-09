import { FormControl } from '@angular/forms';

export interface IAccountFormValues {
  name?: string;
}

export interface IAccountForm {
  name: FormControl<string | undefined>;
}
