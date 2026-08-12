import { FormControl } from '@angular/forms';

export interface IRegisterForm {
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

export interface IRegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}
