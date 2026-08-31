import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import dayjs from 'dayjs';
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

/** Flags the "to" control with a `dateRangeInvalid` error when "from" is after "to". Both
 * controls are left untouched (no error) while either is empty, so `Validators.required`
 * remains the sole source of a "field is required" error. */
export function dateRangeValidator(
  fromControlName: string,
  toControlName: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from = group.get(fromControlName);
    const to = group.get(toControlName);

    if (!from || !to) {
      return null;
    }

    if (!from.value || !to.value) {
      if (to.hasError('dateRangeInvalid')) {
        const { dateRangeInvalid, ...errors } = to.errors ?? {};
        to.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }

    if (dayjs(from.value).isAfter(dayjs(to.value), 'day')) {
      to.setErrors({ ...to.errors, dateRangeInvalid: true });
      return { dateRangeInvalid: true };
    }

    if (to.hasError('dateRangeInvalid')) {
      const { dateRangeInvalid, ...errors } = to.errors ?? {};
      to.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  };
}
