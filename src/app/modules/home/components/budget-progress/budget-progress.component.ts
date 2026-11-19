import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { IBudgetProgress } from '../../dashboard.utils';
import { CATEGORY_COLOR_VAR, categoryLabel } from '../../../transaction/shared/category.utils';

@Component({
  selector: 'app-budget-progress',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    MatButtonModule,
    MatProgressBarModule,
    MatListModule,
  ],
  templateUrl: './budget-progress.component.html',
  styleUrl: './budget-progress.component.scss',
})
export class BudgetProgressComponent {
  @Input() rows: IBudgetProgress[] = [];
  /** How far through the month today is (0–100), drawn as a marker on each budget bar. */
  @Input() monthElapsedPercent = 0;

  protected label = categoryLabel;

  protected color(row: IBudgetProgress): string {
    return CATEGORY_COLOR_VAR[row.category];
  }

  /** Over/near-limit budgets switch to the status colour so they stand out from the palette. */
  protected barColor(row: IBudgetProgress): string {
    switch (row.status) {
      case 'over':
        return 'var(--status-bad)';
      case 'warning':
        return 'var(--status-warning)';
      default:
        return this.color(row);
    }
  }

  protected barValue(row: IBudgetProgress): number {
    return Math.min(row.percentUsed ?? 0, 100);
  }
}
