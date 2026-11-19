import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { AbstractComponent } from '../../../../core/component/abstract/abstract.component';
import { moneyValidator } from '../../../../shared/validators/validator';
import { BudgetApiService } from '../../api/budget-api.service';
import { BudgetCategory, IBudget } from '../../shared/budget.interface';
import { categoryLabel } from '../../../transaction/shared/category.utils';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'FOOD',
  'BILL',
  'SUBSCRIPTION',
  'CLOTHING',
];

type BudgetForm = Record<BudgetCategory, FormControl<string>>;

/** Blank means "no budget"; anything else must be a positive amount. */
const positiveAmountValidator: ValidatorFn = (control) =>
  control.value !== '' && Number(control.value) <= 0 ? { positive: true } : null;

/** Lets a user set, change, or clear the monthly limit for each expense category. */
@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './budget-page.component.html',
  styleUrl: './budget-page.component.scss',
})
export class BudgetPageComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  protected readonly categories = BUDGET_CATEGORIES;
  protected label = categoryLabel;
  protected saving = false;

  protected form = new FormGroup<BudgetForm>(
    Object.fromEntries(
      BUDGET_CATEGORIES.map((category) => [
        category,
        new FormControl('', {
          nonNullable: true,
          validators: [moneyValidator, positiveAmountValidator],
        }),
      ])
    ) as BudgetForm
  );

  /** What the server holds, so save() only sends what changed. */
  private saved = new Map<BudgetCategory, number>();

  constructor(
    private budgetApiService: BudgetApiService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.getData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected get total(): number {
    return BUDGET_CATEGORIES.reduce(
      (sum, category) => sum + (Number(this.form.controls[category].value) || 0),
      0
    );
  }

  protected getData(): void {
    this.budgetApiService.getBudgetList().subscribe({
      next: (res) => {
        this.applySaved(res.budgetList);
        this.loading.set(false);
      },
      error: (err) => this.handleError('Failed to load budgets', err),
    });
  }

  protected clear(category: BudgetCategory): void {
    this.form.controls[category].setValue('');
    this.form.controls[category].markAsDirty();
  }

  protected save(): void {
    if (this.form.invalid) {
      return;
    }

    const requests: Observable<unknown>[] = [];
    for (const category of BUDGET_CATEGORIES) {
      const raw = this.form.controls[category].value.trim();
      const previous = this.saved.get(category);

      if (raw === '') {
        if (previous !== undefined) {
          requests.push(this.budgetApiService.deleteBudget(category));
        }
      } else if (Number(raw) !== previous) {
        requests.push(this.budgetApiService.putBudget(category, raw));
      }
    }

    if (requests.length === 0) {
      this.snackBar.open('No changes to save', 'Dismiss', { duration: 3000 });
      return;
    }

    this.saving = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Budgets saved', 'Dismiss', { duration: 3000 });
        this.loading.set(true);
        this.getData();
      },
      error: (err) => {
        this.saving = false;
        this.errorNotifier.notify('Failed to save budgets', err);
        // Some requests may have succeeded; reload so the form matches the server.
        this.getData();
      },
    });
  }

  private applySaved(budgets: IBudget[]): void {
    this.saved = new Map(
      budgets.map((budget) => [budget.category, Number(budget.monthlyLimit)])
    );
    for (const category of BUDGET_CATEGORIES) {
      const limit = this.saved.get(category);
      this.form.controls[category].setValue(
        limit === undefined ? '' : limit.toFixed(2)
      );
    }
    this.form.markAsPristine();
  }
}
