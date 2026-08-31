import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IDailyCumulativeAmount } from '../../home.utils';

/** A day's running total, plus its plotted SVG coordinates. Keeping `day`/`date` alongside `x`/
 * `y` (rather than reducing straight to a path string) is what lets a future hover/keyboard-nav
 * ticket map a plotted position back to the day it represents. */
export interface ICumulativeSpendPoint extends IDailyCumulativeAmount {
  x: number;
  y: number;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 160;
const PADDING_X = 12;
const PADDING_Y = 12;
/** Half of `.tooltip`'s `min-width` (9rem) in the SCSS -- kept in sync manually since the clamp
 * bound in `tooltipLeft` needs to match how far `translateX(-50%)` shifts the tooltip. */
const TOOLTIP_HALF_WIDTH = '4.5rem';

@Component({
  selector: 'app-cumulative-spend-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './cumulative-spend-chart.component.html',
  styleUrl: './cumulative-spend-chart.component.scss',
})
export class CumulativeSpendChartComponent {
  @Input() currentMonth: IDailyCumulativeAmount[] = [];
  @Input() previousMonth: IDailyCumulativeAmount[] = [];

  protected readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  protected readonly viewWidth = VIEW_WIDTH;
  protected readonly baselineY = VIEW_HEIGHT - PADDING_Y;

  /** The day (1-based) the crosshair/tooltip is currently showing, driven by either mouse hover
   * or arrow-key navigation -- both funnel through this single piece of state rather than each
   * maintaining their own. `null` means nothing is selected (mouse isn't over the chart and the
   * chart doesn't have keyboard focus). */
  protected selectedDay: number | null = null;
  private hasFocus = false;

  constructor(
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe
  ) {}

  private get maxDay(): number {
    return Math.max(this.currentMonth.length, this.previousMonth.length, 1);
  }

  private get maxAmount(): number {
    const amounts = [...this.currentMonth, ...this.previousMonth].map(
      (point) => point.cumulativeAmount
    );

    return Math.max(...amounts, 1);
  }

  private get minAmount(): number {
    const amounts = [...this.currentMonth, ...this.previousMonth].map(
      (point) => point.cumulativeAmount
    );

    return Math.min(...amounts, 0);
  }

  /** Maps a 1-based day to its x coordinate in the shared day-of-month scale. Shared between
   * plotting points and the hover/keyboard crosshair so the crosshair always lines up exactly
   * with the day it represents. */
  private dayToX(day: number): number {
    const xRange = VIEW_WIDTH - 2 * PADDING_X;
    const dayFraction = this.maxDay > 1 ? (day - 1) / (this.maxDay - 1) : 0;
    return PADDING_X + dayFraction * xRange;
  }

  /** Inverse of `dayToX`: maps an x coordinate (in the SVG's internal viewBox units) back to the
   * nearest plotted day, clamped to the full plotted range (`1..maxDay`). Used for mouse hover,
   * which can land on any plotted day, including ones only the previous-month series reaches. */
  private dayFromX(x: number): number {
    const xRange = VIEW_WIDTH - 2 * PADDING_X;
    const dayFraction = xRange > 0 ? (x - PADDING_X) / xRange : 0;
    const day = Math.round(dayFraction * (this.maxDay - 1)) + 1;
    return Math.min(this.maxDay, Math.max(1, day));
  }

  private toPoint(point: IDailyCumulativeAmount): ICumulativeSpendPoint {
    const yRange = VIEW_HEIGHT - 2 * PADDING_Y;
    const amountRange = this.maxAmount - this.minAmount;
    const amountFraction = (point.cumulativeAmount - this.minAmount) / amountRange;

    return {
      ...point,
      x: this.dayToX(point.day),
      y: VIEW_HEIGHT - PADDING_Y - amountFraction * yRange,
    };
  }

  protected get currentPoints(): ICumulativeSpendPoint[] {
    return this.currentMonth.map((point) => this.toPoint(point));
  }

  protected get previousPoints(): ICumulativeSpendPoint[] {
    return this.previousMonth.map((point) => this.toPoint(point));
  }

  protected toPolylinePoints(points: ICumulativeSpendPoint[]): string {
    return points.map((point) => `${point.x},${point.y}`).join(' ');
  }

  protected pointLabel(point: ICumulativeSpendPoint): string {
    const amount = this.currencyPipe.transform(point.cumulativeAmount);
    return `Day ${point.day}: ${amount}`;
  }

  protected get ariaLabel(): string {
    const currentTotal = this.currencyPipe.transform(
      this.currentMonth[this.currentMonth.length - 1]?.cumulativeAmount ?? 0
    );
    const previousTotal = this.currencyPipe.transform(
      this.previousMonth[this.previousMonth.length - 1]?.cumulativeAmount ?? 0
    );

    return `Cumulative daily spend. This month so far: ${currentTotal}. Last month total: ${previousTotal}.`;
  }

  /** Keyboard navigation is bounded to the *current* month's plotted span (`currentMonth.length`),
   * not the full month like the previous-month series can reach. This is a judgment call for an
   * underspecified requirement: the current-month series is what's still "live" and what a day
   * cursor conceptually belongs to, so there's nothing meaningful to arrow right into once it runs
   * out (those days simply haven't happened yet this month). Mouse hover isn't bound by this --
   * it can land on any plotted day, including days only the previous-month series reaches, since
   * hovering is exploratory rather than a stepped cursor tied to "today". */
  private get maxKeyboardDay(): number {
    return this.currentMonth.length;
  }

  protected get crosshairX(): number {
    return this.selectedDay !== null ? this.dayToX(this.selectedDay) : 0;
  }

  protected get crosshairLeftPercent(): number {
    return (this.crosshairX / VIEW_WIDTH) * 100;
  }

  /** The tooltip's `left` position, clamped so it stays fully within the chart wrapper's
   * horizontal bounds even at day 1 or the last plotted day (where naively centering it on
   * `crosshairLeftPercent` would push roughly half of it -- `.tooltip`'s 9rem `min-width` -- past
   * the wrapper's edge). `TOOLTIP_HALF_WIDTH` mirrors that min-width so the clamp bound lines up
   * with the space `translateX(-50%)` actually needs on each side. */
  protected get tooltipLeft(): string {
    return `clamp(${TOOLTIP_HALF_WIDTH}, ${this.crosshairLeftPercent}%, calc(100% - ${TOOLTIP_HALF_WIDTH}))`;
  }

  protected get selectedCurrentPoint(): ICumulativeSpendPoint | null {
    return (
      this.currentPoints.find((point) => point.day === this.selectedDay) ??
      null
    );
  }

  protected get selectedPreviousPoint(): ICumulativeSpendPoint | null {
    return (
      this.previousPoints.find((point) => point.day === this.selectedDay) ??
      null
    );
  }

  protected formattedDate(point: ICumulativeSpendPoint | null): string | null {
    return point ? this.datePipe.transform(point.date, 'MMM d') : null;
  }

  protected amountLabel(point: ICumulativeSpendPoint | null): string {
    if (!point) {
      return 'No data yet';
    }
    return this.currencyPipe.transform(point.cumulativeAmount) ?? '';
  }

  /** Plain-text summary of the current selection, surfaced via an `aria-live` region so hover and
   * arrow-key navigation both announce the selected day's figures to screen readers, not just
   * sighted mouse/keyboard users watching the visual crosshair and tooltip. */
  protected get selectionAnnouncement(): string {
    if (this.selectedDay === null) {
      return '';
    }

    const currentDate = this.formattedDate(this.selectedCurrentPoint);
    const previousDate = this.formattedDate(this.selectedPreviousPoint);
    const currentAmount = this.amountLabel(this.selectedCurrentPoint);
    const previousAmount = this.amountLabel(this.selectedPreviousPoint);

    return (
      `Day ${this.selectedDay}. ` +
      `This month${currentDate ? ` (${currentDate})` : ''}: ${currentAmount}. ` +
      `Last month${previousDate ? ` (${previousDate})` : ''}: ${previousAmount}.`
    );
  }

  protected onChartMouseMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }

    const fraction = (event.clientX - rect.left) / rect.width;
    this.selectedDay = this.dayFromX(fraction * VIEW_WIDTH);
  }

  protected onChartMouseLeave(): void {
    if (!this.hasFocus) {
      this.selectedDay = null;
    }
  }

  protected onChartFocus(): void {
    this.hasFocus = true;
    if (this.selectedDay === null && this.maxKeyboardDay > 0) {
      // Default to the last plotted current-month day (i.e. "today") as the entry point, so
      // tabbing into the chart immediately shows something useful rather than nothing.
      this.selectedDay = this.maxKeyboardDay;
    } else if (
      this.maxKeyboardDay > 0 &&
      this.selectedDay !== null &&
      (this.selectedDay < 1 || this.selectedDay > this.maxKeyboardDay)
    ) {
      // A prior mouse hover can leave `selectedDay` on a previous-month-only day outside the
      // keyboard-navigable range. Reconcile it back into range on focus so arrow keys start from
      // a valid state instead of needing an extra keypress to snap in.
      this.selectedDay = this.maxKeyboardDay;
    }
  }

  protected onChartBlur(): void {
    this.hasFocus = false;
    this.selectedDay = null;
  }

  protected onChartKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();

    if (this.maxKeyboardDay === 0) {
      return;
    }

    // Clamp the baseline into `[1, maxKeyboardDay]` before applying either delta, so a
    // `selectedDay` left out of range by a mouse hover (which isn't bounded to the current
    // month) snaps into range in a single keypress regardless of arrow direction.
    const current = Math.min(this.selectedDay ?? this.maxKeyboardDay, this.maxKeyboardDay);
    if (event.key === 'ArrowLeft') {
      // Day 1 is the left boundary: navigating further left is a no-op rather than wrapping or
      // going negative.
      this.selectedDay = Math.max(1, current - 1);
    } else {
      // The current month's last plotted day is the right boundary -- see `maxKeyboardDay`.
      this.selectedDay = Math.min(this.maxKeyboardDay, current + 1);
    }
  }
}
