import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * The app's standard content card: an outlined Material card with an optional header.
 *
 * ```html
 * <app-card title="Accounts" subtitle="Optional" icon="account_balance">
 *   ...body...
 *   <ng-container card-actions>
 *     <a mat-button routerLink="/accounts">View all</a>
 *   </ng-container>
 * </app-card>
 * ```
 *
 * Forms: wrap the body in `<form id="…">` and give the submit button in `[card-actions]` a
 * matching `form="…"` attribute, so it submits the form from outside it.
 *
 * The header is only rendered when `title` is set, and the actions row only when something is
 * projected into `[card-actions]`. The card fills its grid/flex cell, so cards in a row line up.
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  /** Material icon name shown as the header avatar. */
  @Input() icon?: string;
  /** Shows an indeterminate progress bar along the top edge of the card. */
  @Input() loading = false;
}
