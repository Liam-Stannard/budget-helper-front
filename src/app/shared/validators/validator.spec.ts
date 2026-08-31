import { FormBuilder, FormControl } from '@angular/forms';
import {
  dateRangeValidator,
  dateValidator,
  freeTextValidator,
  moneyValidator,
  passwordsMatchValidator,
} from './validator';
import { REGEX } from '../regex/regex';

describe('validator', () => {
  describe('moneyValidator', () => {
    it.each`
      value        | expected
      ${'1.00'}    | ${null}
      ${'1'}       | ${null}
      ${'1..00'}   | ${{ pattern: { actualValue: '1..00', requiredPattern: REGEX.money.toString() } }}
      ${'1.000'}   | ${{ pattern: { actualValue: '1.000', requiredPattern: REGEX.money.toString() } }}
      ${'a1.00'}   | ${{ pattern: { actualValue: 'a1.00', requiredPattern: REGEX.money.toString() } }}
      ${'a'}       | ${{ pattern: { actualValue: 'a', requiredPattern: REGEX.money.toString() } }}
      ${'110.0.0'} | ${{ pattern: { actualValue: '110.0.0', requiredPattern: REGEX.money.toString() } }}
    `('should return $expected when value is $value', ({ value, expected }) => {
      const control: FormControl<string> = new FormControl(value);
      const result = moneyValidator(control);

      expect(result).toStrictEqual(expected);
    });
  });

  describe('freeTextValidator', () => {
    it.each`
      value             | expected
      ${'a'}            | ${null}
      ${''}             | ${null}
      ${'a!'}           | ${null}
      ${'a?'}           | ${null}
      ${'a.'}           | ${null}
      ${'a,'}           | ${null}
      ${'a-'}           | ${null}
      ${'a a'}          | ${null}
      ${'a'.repeat(32)} | ${null}
      ${'a'.repeat(33)} | ${{ pattern: { actualValue: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', requiredPattern: REGEX.freeText.toString() } }}
      ${'1a'}           | ${{ pattern: { actualValue: '1a', requiredPattern: REGEX.freeText.toString() } }}
      ${'a#'}           | ${{ pattern: { actualValue: 'a#', requiredPattern: REGEX.freeText.toString() } }}
      ${'a\n'}          | ${{ pattern: { actualValue: 'a\n', requiredPattern: REGEX.freeText.toString() } }}
      ${'a@'}           | ${{ pattern: { actualValue: 'a@', requiredPattern: REGEX.freeText.toString() } }}
      ${'a{'}           | ${{ pattern: { actualValue: 'a{', requiredPattern: REGEX.freeText.toString() } }}
      ${'a}'}           | ${{ pattern: { actualValue: 'a}', requiredPattern: REGEX.freeText.toString() } }}
      ${'a['}           | ${{ pattern: { actualValue: 'a[', requiredPattern: REGEX.freeText.toString() } }}
      ${'a]'}           | ${{ pattern: { actualValue: 'a]', requiredPattern: REGEX.freeText.toString() } }}
    `('should return $expected when value is $value', ({ value, expected }) => {
      const control: FormControl<string> = new FormControl(value);
      const result = freeTextValidator(control);

      expect(result).toStrictEqual(expected);
    });
  });

  describe('dateValidator', () => {
    it.each`
      value              | expected
      ${'2000-01-01'}    | ${null}
      ${'2000-01-01'}    | ${null}
      ${'2000'}          | ${{ pattern: { actualValue: '2000', requiredPattern: REGEX.date.toString() } }}
      ${'01-01-2000'}    | ${{ pattern: { actualValue: '01-01-2000', requiredPattern: REGEX.date.toString() } }}
      ${'01/01/2000'}    | ${{ pattern: { actualValue: '01/01/2000', requiredPattern: REGEX.date.toString() } }}
      ${'2000/01/01'}    | ${{ pattern: { actualValue: '2000/01/01', requiredPattern: REGEX.date.toString() } }}
      ${'abc'}           | ${{ pattern: { actualValue: 'abc', requiredPattern: REGEX.date.toString() } }}
      ${'2000-01-01abc'} | ${{ pattern: { actualValue: '2000-01-01abc', requiredPattern: REGEX.date.toString() } }}
    `('should return $expected when value is $value', ({ value, expected }) => {
      const control: FormControl<string> = new FormControl(value);
      const result = dateValidator(control);

      expect(result).toStrictEqual(expected);
    });
  });

  describe('passwordsMatchValidator', () => {
    const fb = new FormBuilder();

    it('should return null when the passwords match', () => {
      const group = fb.group({
        password: 'password123',
        confirmPassword: 'password123',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('confirmPassword')?.errors).toBeNull();
    });

    it('should return a passwordsMismatch error and set it on the confirm control when the passwords do not match', () => {
      const group = fb.group({
        password: 'password123',
        confirmPassword: 'password456',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      const result = validator(group);

      expect(result).toStrictEqual({ passwordsMismatch: true });
      expect(group.get('confirmPassword')?.errors).toStrictEqual({
        passwordsMismatch: true,
      });
    });

    it('should clear a previously set passwordsMismatch error once the passwords match', () => {
      const group = fb.group({
        password: 'password123',
        confirmPassword: 'password456',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      validator(group);
      group.get('confirmPassword')?.setValue('password123');
      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('confirmPassword')?.errors).toBeNull();
    });

    it('should return null when either control is missing from the group', () => {
      const group = fb.group({
        password: 'password123',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      const result = validator(group);

      expect(result).toBeNull();
    });

    it('should preserve other pre-existing errors on the confirm control when clearing passwordsMismatch', () => {
      // Passwords already match from the start, so setValue() (which would trigger a
      // real revalidation and wipe manually-injected errors on a control with no
      // validators of its own) is never called - isolating just the group validator's
      // own error-merging logic.
      const group = fb.group({
        password: 'password123',
        confirmPassword: 'password123',
      });
      // Simulate an unrelated error (e.g. a pattern/minlength validator) coexisting
      // alongside a passwordsMismatch error left over from a previous validation pass.
      group.get('confirmPassword')?.setErrors({
        passwordsMismatch: true,
        someOtherError: true,
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('confirmPassword')?.errors).toStrictEqual({
        someOtherError: true,
      });
    });

    it('should treat trailing-whitespace-only differences as a mismatch (no trimming)', () => {
      const group = fb.group({
        password: 'password123',
        confirmPassword: 'password123 ',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      const result = validator(group);

      expect(result).toStrictEqual({ passwordsMismatch: true });
      expect(group.get('confirmPassword')?.errors).toStrictEqual({
        passwordsMismatch: true,
      });
    });

    it('should match regardless of which control was populated first (order independence)', () => {
      const group = fb.group({
        password: '',
        confirmPassword: 'secret',
      });
      const validator = passwordsMatchValidator('password', 'confirmPassword');

      // confirmPassword filled in before password
      let result = validator(group);
      expect(result).toStrictEqual({ passwordsMismatch: true });

      group.get('password')?.setValue('secret');
      result = validator(group);

      expect(result).toBeNull();
      expect(group.get('confirmPassword')?.errors).toBeNull();
    });
  });

  describe('dateRangeValidator', () => {
    const fb = new FormBuilder();

    it('should return null when "from" is before "to"', () => {
      const group = fb.group({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should return null when "from" and "to" are the same day', () => {
      const group = fb.group({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-01'),
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should return a dateRangeInvalid error and set it on the "to" control when "from" is after "to"', () => {
      const group = fb.group({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toStrictEqual({ dateRangeInvalid: true });
      expect(group.get('to')?.errors).toStrictEqual({
        dateRangeInvalid: true,
      });
    });

    it('should clear a previously set dateRangeInvalid error once the range becomes valid', () => {
      const group = fb.group({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      const validator = dateRangeValidator('from', 'to');
      // Seed the stale error directly on "to", bypassing the validator. Going through
      // "to"'s own setValue() instead would clear the error via Angular's own per-control
      // revalidation (it has no validators of its own) before the group validator below
      // ever runs, masking whether the validator's own clearing logic actually executes.
      group.get('to')?.setErrors({ dateRangeInvalid: true });

      // Change "from" (not "to") so "to" is never independently revalidated - only the
      // explicit group-level validator call can be responsible for clearing its error.
      group.get('from')?.setValue(new Date('2024-01-01'));
      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should return null when either control is missing from the group', () => {
      const group = fb.group({
        from: new Date('2024-02-01'),
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toBeNull();
    });

    it('should return null and not flag an error while either date is empty', () => {
      const group = fb.group({
        from: new Date('2024-02-01'),
        to: null,
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should clear a previously set dateRangeInvalid error once "to" is cleared back to empty', () => {
      const group = fb.group({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      const validator = dateRangeValidator('from', 'to');

      group.get('to')?.setValue(null);
      // Seed the stale error *after* clearing "to"'s value (not before), since setValue()
      // clears any existing error via Angular's own per-control revalidation - seeding it
      // beforehand would just have it wiped out before the group validator below runs,
      // masking whether the validator's own clearing logic actually executes.
      group.get('to')?.setErrors({ dateRangeInvalid: true });

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should clear a stale dateRangeInvalid error on "to" when "from" (not "to") is cleared back to empty', () => {
      // Only "from" changes here - "to" keeps its own manually-set error untouched by any
      // revalidation of "to" itself, exercising the cleanup branch taken when "to.value" is
      // still populated but "from.value" (not "to.value") is what became empty.
      const group = fb.group({
        from: new Date('2024-02-01'),
        to: new Date('2024-01-01'),
      });
      const validator = dateRangeValidator('from', 'to');
      validator(group);
      expect(group.get('to')?.errors).toStrictEqual({ dateRangeInvalid: true });

      group.get('from')?.setValue(null);
      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toBeNull();
    });

    it('should preserve other pre-existing errors on the "to" control when clearing dateRangeInvalid', () => {
      const group = fb.group({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });
      group.get('to')?.setErrors({
        dateRangeInvalid: true,
        someOtherError: true,
      });
      const validator = dateRangeValidator('from', 'to');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('to')?.errors).toStrictEqual({
        someOtherError: true,
      });
    });
  });
});
