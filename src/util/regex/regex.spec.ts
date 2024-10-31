import { REGEX } from './regex';

describe('regex', () => {
  describe('money', () => {
    it.each`
      value        | expected
      ${'1.00'}    | ${true}
      ${'1'}       | ${true}
      ${'1..00'}   | ${false}
      ${'1.000'}   | ${false}
      ${'a1.00'}   | ${false}
      ${'a'}       | ${false}
      ${'110.0.0'} | ${false}
    `('should return $expected when value is $value', ({ value, expected }) => {
      expect(REGEX.money.test(value)).toStrictEqual(expected);
    });
  });
  describe('freeText', () => {
    it.each`
      value             | expected
      ${'a'}            | ${true}
      ${''}             | ${false}
      ${'a!'}           | ${true}
      ${'a?'}           | ${true}
      ${'a.'}           | ${true}
      ${'a,'}           | ${true}
      ${'a-'}           | ${true}
      ${'a a'}          | ${true}
      ${'a'.repeat(32)} | ${true}
      ${'a'.repeat(33)} | ${false}
      ${'1a'}           | ${false}
      ${'a#'}           | ${false}
      ${'a\n'}          | ${false}
      ${'a@'}           | ${false}
      ${'a{'}           | ${false}
      ${'a}'}           | ${false}
      ${'a['}           | ${false}
      ${'a]'}           | ${false}
    `('should return $expected when value is $value', ({ value, expected }) => {
      expect(REGEX.freeText.test(value)).toStrictEqual(expected);
    });
  });
  describe('date', () => {
    it.each`
      value              | expected
      ${'2000-01-01'}    | ${true}
      ${'2000-01-01'}    | ${true}
      ${'2000'}          | ${false}
      ${'01-01-2000'}    | ${false}
      ${'01/01/2000'}    | ${false}
      ${'2000/01/01'}    | ${false}
      ${'abc'}           | ${false}
      ${'2000-01-01abc'} | ${false}
    `('should return $expected when value is $value', ({ value, expected }) => {
      expect(REGEX.date.test(value)).toStrictEqual(expected);
    });
  });
});
