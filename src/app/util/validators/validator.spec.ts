import { FormBuilder, FormControl } from '@angular/forms';
import { dateValidator, freeTextValidator, moneyValidator } from './validator';
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
});
