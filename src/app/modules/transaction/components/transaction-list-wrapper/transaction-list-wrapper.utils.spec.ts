import dayjs from 'dayjs';
import {
  formatPeriodLabel,
  periodDateRange,
  shiftPeriod,
} from './transaction-list-wrapper.utils';

describe('periodDateRange', () => {
  it('should bound a day to just that day', () => {
    expect(periodDateRange(dayjs('2026-03-15'), 'day')).toEqual({
      from: '2026-03-15',
      to: '2026-03-15',
    });
  });

  it('should bound a week to its Sunday-Saturday span', () => {
    // 2026-03-11 is a Wednesday
    expect(periodDateRange(dayjs('2026-03-11'), 'week')).toEqual({
      from: '2026-03-08',
      to: '2026-03-14',
    });
  });

  it('should bound a month to its first and last day', () => {
    expect(periodDateRange(dayjs('2026-03-15'), 'month')).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('should bound a year to Jan 1 - Dec 31', () => {
    expect(periodDateRange(dayjs('2026-03-15'), 'year')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
});

describe('shiftPeriod', () => {
  it('should move forward a day', () => {
    expect(shiftPeriod(dayjs('2026-03-15'), 'day', 1).format('YYYY-MM-DD')).toBe(
      '2026-03-16'
    );
  });

  it('should move backward a week', () => {
    expect(
      shiftPeriod(dayjs('2026-03-15'), 'week', -1).format('YYYY-MM-DD')
    ).toBe('2026-03-08');
  });

  it('should move forward a month', () => {
    expect(
      shiftPeriod(dayjs('2026-03-15'), 'month', 1).format('YYYY-MM-DD')
    ).toBe('2026-04-15');
  });

  it('should move backward a year', () => {
    expect(
      shiftPeriod(dayjs('2026-03-15'), 'year', -1).format('YYYY-MM-DD')
    ).toBe('2025-03-15');
  });
});

describe('formatPeriodLabel', () => {
  it('should format a day', () => {
    expect(formatPeriodLabel(dayjs('2026-03-15'), 'day')).toBe(
      'Mar 15, 2026'
    );
  });

  it('should format a week within the same month', () => {
    expect(formatPeriodLabel(dayjs('2026-03-11'), 'week')).toBe(
      'Week of Mar 8–14'
    );
  });

  it('should format a week spanning two months', () => {
    // 2026-03-01 is a Sunday, so its week is Mar 1 - Mar 7 -- pick a date
    // whose week actually crosses a month boundary instead.
    // 2026-02-28 is a Saturday; the week containing it is Feb 22 - Feb 28... use
    // a Sunday just before month-end so the week runs into the next month.
    expect(formatPeriodLabel(dayjs('2026-03-29'), 'week')).toBe(
      'Week of Mar 29–Apr 4'
    );
  });

  it('should format a month', () => {
    expect(formatPeriodLabel(dayjs('2026-03-15'), 'month')).toBe(
      'March 2026'
    );
  });

  it('should format a year', () => {
    expect(formatPeriodLabel(dayjs('2026-03-15'), 'year')).toBe('2026');
  });
});
