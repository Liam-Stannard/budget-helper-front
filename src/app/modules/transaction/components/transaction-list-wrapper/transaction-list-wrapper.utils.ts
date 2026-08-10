import { Dayjs } from 'dayjs';

export type PeriodType = 'day' | 'week' | 'month' | 'year';

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const DATE_FORMAT = 'YYYY-MM-DD';

export function periodDateRange(
  referenceDate: Dayjs,
  period: PeriodType
): { from: string; to: string } {
  return {
    from: referenceDate.startOf(period).format(DATE_FORMAT),
    to: referenceDate.endOf(period).format(DATE_FORMAT),
  };
}

export function shiftPeriod(
  referenceDate: Dayjs,
  period: PeriodType,
  direction: 1 | -1
): Dayjs {
  return referenceDate.add(direction, period);
}

export function formatPeriodLabel(
  referenceDate: Dayjs,
  period: PeriodType
): string {
  switch (period) {
    case 'day':
      return referenceDate.format('MMM D, YYYY');
    case 'week': {
      const start = referenceDate.startOf('week');
      const end = referenceDate.endOf('week');
      const sameMonth = start.month() === end.month();
      return `Week of ${start.format('MMM D')}–${end.format(
        sameMonth ? 'D' : 'MMM D'
      )}`;
    }
    case 'month':
      return referenceDate.format('MMMM YYYY');
    case 'year':
      return referenceDate.format('YYYY');
  }
}
