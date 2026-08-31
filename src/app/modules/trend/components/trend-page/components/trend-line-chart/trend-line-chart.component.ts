import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ITrendBucket } from '../../trend-page.utils';

interface IPlotPoint {
  x: number;
  y: number;
  bucket: ITrendBucket;
}

/** Number of x-axis labels to show at most, regardless of bucket count - the chart can have up
 * to ~90 plotted points (see `getBucketGranularity`), and labelling every single one would
 * overlap into an unreadable mess, so only an evenly-spaced subset (always including the first
 * and last bucket) gets a label underneath its point. */
const MAX_X_LABELS = 8;

@Component({
  selector: 'app-trend-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './trend-line-chart.component.html',
  styleUrl: './trend-line-chart.component.scss',
})
export class TrendLineChartComponent {
  @Input() buckets: ITrendBucket[] = [];

  protected readonly viewBoxWidth = 640;
  protected readonly viewBoxHeight = 260;
  private readonly marginTop = 12;
  private readonly marginBottom = 32;
  private readonly marginLeft = 64;
  private readonly marginRight = 16;

  constructor(private currencyPipe: CurrencyPipe) {}

  protected maxAmount(): number {
    // Floored at 1 (rather than 0) so an all-zero series doesn't divide by zero when scaling
    // points to the plot area - it just renders flat along the baseline instead.
    return Math.max(...this.buckets.map((bucket) => bucket.amount), 1);
  }

  protected plotPoints(): IPlotPoint[] {
    const plotWidth = this.viewBoxWidth - this.marginLeft - this.marginRight;
    const plotHeight = this.viewBoxHeight - this.marginTop - this.marginBottom;
    const max = this.maxAmount();
    const lastIndex = Math.max(this.buckets.length - 1, 1);

    return this.buckets.map((bucket, index) => ({
      x:
        this.marginLeft +
        // A single bucket has nowhere to span (dividing by a zero-length span), so it's
        // centred in the plot area instead - rendered as a lone dot rather than a line.
        (this.buckets.length > 1 ? (index / lastIndex) * plotWidth : plotWidth / 2),
      y: this.marginTop + plotHeight - (bucket.amount / max) * plotHeight,
      bucket,
    }));
  }

  protected linePoints(): string {
    return this.plotPoints()
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  /** Gridlines/labels for 0%, 50% and 100% of the max bucket amount. */
  protected yTicks(): { y: number; label: string }[] {
    const plotHeight = this.viewBoxHeight - this.marginTop - this.marginBottom;
    const max = this.maxAmount();

    return [0, 0.5, 1].map((fraction) => ({
      y: this.marginTop + plotHeight - fraction * plotHeight,
      label: this.currencyPipe.transform(max * fraction, undefined, undefined, '1.0-0') ?? '',
    }));
  }

  protected baselineY(): number {
    return this.viewBoxHeight - this.marginBottom;
  }

  /** Indices of the buckets that should render an x-axis label - always the first/last, plus an
   * evenly-spaced subset in between so long ranges don't overlap their labels. */
  protected xLabelIndices(): Set<number> {
    const count = this.buckets.length;

    if (count <= MAX_X_LABELS) {
      return new Set(this.buckets.map((_, index) => index));
    }

    const step = Math.ceil((count - 1) / (MAX_X_LABELS - 1));
    const indices = new Set<number>();

    for (let index = 0; index < count; index += step) {
      indices.add(index);
    }
    indices.add(count - 1);

    return indices;
  }

  protected pointLabel(bucket: ITrendBucket): string {
    return `${bucket.label}: ${this.currencyPipe.transform(bucket.amount)}`;
  }
}
