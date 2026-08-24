import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { REGEX } from '../regex/regex';

export const moneyValidator = Validators.pattern(REGEX.money);
export const freeTextValidator = Validators.pattern(REGEX.freeText);
export const dateValidator = Validators.pattern(REGEX.date);

export function passwordsMatchValidator(
  passwordControlName: string,
  confirmControlName: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName);
    const confirmPassword = group.get(confirmControlName);

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({
        ...confirmPassword.errors,
        passwordsMismatch: true,
      });
      return { passwordsMismatch: true };
    }

    if (confirmPassword.hasError('passwordsMismatch')) {
      const { passwordsMismatch, ...errors } = confirmPassword.errors ?? {};
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  };
}
