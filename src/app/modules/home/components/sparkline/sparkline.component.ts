import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISparklineBucket } from '../../home.utils';

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 32;
const BAR_GAP = 2;
/** Bars never fully collapse to 0 height — a flat baseline of minimum-height bars is the "no
 * data" rendering, rather than invisible bars or a NaN-driven crash. */
const MIN_BAR_HEIGHT = 2;

@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.scss',
})
export class SparklineComponent {
  @Input() buckets: ISparklineBucket[] = [];

  protected readonly viewWidth = VIEW_WIDTH;
  protected readonly viewHeight = VIEW_HEIGHT;

  protected get barWidth(): number {
    if (this.buckets.length === 0) {
      return 0;
    }

    return (
      (VIEW_WIDTH - BAR_GAP * (this.buckets.length - 1)) / this.buckets.length
    );
  }

  protected get maxAmount(): number {
    return Math.max(...this.buckets.map((bucket) => bucket.amount), 0);
  }

  protected barX(index: number): number {
    return index * (this.barWidth + BAR_GAP);
  }

  protected barHeight(amount: number): number {
    const max = this.maxAmount;

    if (max <= 0) {
      return MIN_BAR_HEIGHT;
    }

    return Math.max((amount / max) * VIEW_HEIGHT, MIN_BAR_HEIGHT);
  }

  protected barY(amount: number): number {
    return VIEW_HEIGHT - this.barHeight(amount);
  }
}
