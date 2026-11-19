import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { BudgetPageComponent } from './budget-page.component';
import { BudgetApiService } from '../../api/budget-api.service';
import { MockBudgetApiService } from '../../../../../test/mockService';

describe('BudgetPageComponent', () => {
  let fixture: ComponentFixture<BudgetPageComponent>;
  let component: BudgetPageComponent;
  let api: MockBudgetApiService;
  let snackBarSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetPageComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' },
        { provide: ActivatedRoute, useValue: {} },
        { provide: BudgetApiService, useClass: MockBudgetApiService },
      ],
    }).compileComponents();

    api = TestBed.inject(BudgetApiService) as unknown as MockBudgetApiService;
    snackBarSpy = jest
      .spyOn(TestBed.inject(MatSnackBar), 'open')
      .mockImplementation();
    fixture = TestBed.createComponent(BudgetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const form = () => component['form'];

  it('should populate the form from the saved budgets', () => {
    expect(component['loading']()).toBe(false);
    expect(form().getRawValue()).toEqual({
      FOOD: '100.00',
      BILL: '',
      SUBSCRIPTION: '',
      CLOTHING: '',
    });
    expect(form().pristine).toBe(true);
  });

  it('should total the entered limits', () => {
    form().controls.BILL.setValue('500');

    expect(component['total']).toBe(600);
  });

  it('should reject zero and malformed amounts but allow blank', () => {
    form().controls.BILL.setValue('0');
    expect(form().controls.BILL.hasError('positive')).toBe(true);

    form().controls.BILL.setValue('12.3');
    expect(form().controls.BILL.hasError('pattern')).toBe(true);

    form().controls.BILL.setValue('');
    expect(form().controls.BILL.valid).toBe(true);
  });

  it('should PUT new or changed limits and DELETE cleared ones, then reload', () => {
    form().controls.BILL.setValue('500');
    component['clear']('FOOD');

    component['save']();

    expect(api.putBudget).toHaveBeenCalledTimes(1);
    expect(api.putBudget).toHaveBeenCalledWith('BILL', '500');
    expect(api.deleteBudget).toHaveBeenCalledWith('FOOD');
    expect(api.getBudgetList).toHaveBeenCalledTimes(2);
    expect(snackBarSpy).toHaveBeenCalledWith('Budgets saved', 'Dismiss', expect.any(Object));
  });

  it('should not send a request for an unchanged value written differently', () => {
    form().controls.FOOD.setValue('100');

    component['save']();

    expect(api.putBudget).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith('No changes to save', 'Dismiss', expect.any(Object));
  });

  it('should notify and reload when a save fails', () => {
    api.putBudget.mockReturnValueOnce(throwError(() => new Error('boom')));
    form().controls.BILL.setValue('500');

    component['save']();

    expect(component['saving']).toBe(false);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to save budgets',
      'Dismiss',
      expect.any(Object)
    );
    expect(api.getBudgetList).toHaveBeenCalledTimes(2);
  });

  it('should stop loading and notify when budgets fail to load', () => {
    api.getBudgetList.mockReturnValueOnce(throwError(() => new Error('down')));

    component['getData']();

    expect(component['loading']()).toBe(false);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to load budgets',
      'Dismiss',
      expect.any(Object)
    );
  });

  it('should submit the form from the Save button in the card actions', () => {
    form().controls.BILL.setValue('500');
    form().markAsDirty();
    fixture.detectChanges();

    const save = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"][form="budget-form"]'
    ) as HTMLButtonElement;
    expect(save.closest('form')).toBeNull();

    save.click();

    expect(api.putBudget).toHaveBeenCalledWith('BILL', '500');
  });

  it('should render a field per expense category', () => {
    api.getBudgetList.mockReturnValueOnce(of({ budgetList: [] }));
    component['getData']();
    fixture.detectChanges();

    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-label')
    ).map((label) => label.textContent?.trim());

    expect(labels).toEqual(['Food', 'Bill', 'Subscription', 'Clothing']);
  });
});
