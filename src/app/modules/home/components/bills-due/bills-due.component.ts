import { Component, Input } from '@angular/core';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { IBillDue } from '../../dashboard.utils';
import { categoryLabel } from '../../../transaction/shared/category.utils';

@Component({
  selector: 'app-bills-due',
  standalone: true,
  imports: [CommonModule, CardComponent, MatListModule, MatIconModule],
  providers: [CurrencyPipe],
  templateUrl: './bills-due.component.html',
  styleUrl: './bills-due.component.scss',
})
export class BillsDueComponent {
  @Input() bills: IBillDue[] = [];

  protected label = categoryLabel;

  protected get subtitle(): string | undefined {
    if (this.bills.length === 0) {
      return undefined;
    }
    return `About ${this.currencyPipe.transform(this.total)} still to go out`;
  }

  constructor(private currencyPipe: CurrencyPipe) {}

  protected get total(): number {
    return this.bills.reduce((sum, bill) => sum + bill.expectedAmount, 0);
  }

  protected dueText(bill: IBillDue): string {
    const days = bill.daysUntilDue;
    if (days === 0) {
      return 'Due today';
    }
    if (days === 1) {
      return 'Due tomorrow';
    }
    if (days > 1) {
      return `Due in ${days} days`;
    }
    return days === -1 ? 'Expected yesterday' : `Expected ${-days} days ago`;
  }
}
