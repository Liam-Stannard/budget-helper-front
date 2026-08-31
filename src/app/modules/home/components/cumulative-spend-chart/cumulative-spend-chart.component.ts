import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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

@Component({
  selector: 'app-cumulative-spend-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './cumulative-spend-chart.component.html',
  styleUrl: './cumulative-spend-chart.component.scss',
})
export class CumulativeSpendChartComponent {
  @Input() currentMonth: IDailyCumulativeAmount[] = [];
  @Input() previousMonth: IDailyCumulativeAmount[] = [];

  protected readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  protected readonly viewWidth = VIEW_WIDTH;
  protected readonly baselineY = VIEW_HEIGHT - PADDING_Y;

  constructor(private currencyPipe: CurrencyPipe) {}

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

  private toPoint(point: IDailyCumulativeAmount): ICumulativeSpendPoint {
    const xRange = VIEW_WIDTH - 2 * PADDING_X;
    const yRange = VIEW_HEIGHT - 2 * PADDING_Y;
    const dayFraction =
      this.maxDay > 1 ? (point.day - 1) / (this.maxDay - 1) : 0;
    const amountRange = this.maxAmount - this.minAmount;
    const amountFraction = (point.cumulativeAmount - this.minAmount) / amountRange;

    return {
      ...point,
      x: PADDING_X + dayFraction * xRange,
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
}
