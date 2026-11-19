import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ISpendingPace } from '../../dashboard.utils';

@Component({
  selector: 'app-spending-pace',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './spending-pace.component.html',
  styleUrl: './spending-pace.component.scss',
})
export class SpendingPaceComponent {
  @Input({ required: true }) pace!: ISpendingPace;
  /** Sum of all monthly budgets; undefined when none are set. */
  @Input() totalBudget?: number;

  /** Spend relative to the same point last month: positive means spending faster. */
  protected get differenceToLastMonth(): number {
    return this.pace.spentSoFar - this.pace.lastMonthToSameDay;
  }

  protected get projectedOverBudget(): boolean {
    return (
      this.totalBudget !== undefined &&
      this.pace.projectedTotal > this.totalBudget
    );
  }
}
