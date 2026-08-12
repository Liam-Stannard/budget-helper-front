import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { REGEX } from '../regex/regex';

export const moneyValidator = Validators.pattern(REGEX.money);
export const freeTextValidator = Validators.pattern(REGEX.freeText);
export const dateValidator = Validators.pattern(REGEX.date);

export const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
};
