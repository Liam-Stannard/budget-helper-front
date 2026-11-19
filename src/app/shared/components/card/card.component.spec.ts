import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `
    <app-card [title]="title" [subtitle]="subtitle" [icon]="icon" [loading]="loading">
      <p class="body">Body</p>
      @if (withActions) {
      <ng-container card-actions><button class="action">Go</button></ng-container>
      }
    </app-card>
  `,
})
class HostComponent {
  title?: string = 'Accounts';
  subtitle?: string = 'All of them';
  icon?: string = 'account_balance';
  withActions = true;
  loading = false;
}

describe('CardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('should render an outlined card with header, body and actions', () => {
    fixture.detectChanges();

    expect(element().querySelector('mat-card')?.className).toContain(
      'mat-mdc-card-outlined'
    );
    expect(element().querySelector('mat-card-title')?.textContent).toBe('Accounts');
    expect(element().querySelector('mat-card-subtitle')?.textContent).toBe('All of them');
    expect(element().querySelector('mat-icon')?.textContent).toBe('account_balance');
    expect(element().querySelector('mat-card-content .body')).not.toBeNull();
    expect(element().querySelector('mat-card-actions .action')).not.toBeNull();
  });

  it('should omit the header without a title', () => {
    fixture.componentInstance.title = undefined;
    fixture.detectChanges();

    expect(element().querySelector('mat-card-header')).toBeNull();
  });

  it('should omit the subtitle and icon when not given', () => {
    fixture.componentInstance.subtitle = undefined;
    fixture.componentInstance.icon = undefined;
    fixture.detectChanges();

    expect(element().querySelector('mat-card-subtitle')).toBeNull();
    expect(element().querySelector('mat-icon')).toBeNull();
  });

  it('should show a progress bar only while loading', () => {
    fixture.detectChanges();
    expect(element().querySelector('mat-progress-bar')).toBeNull();

    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    expect(element().querySelector('mat-progress-bar')).not.toBeNull();
  });

  it('should leave the actions row empty when nothing is projected', () => {
    fixture.componentInstance.withActions = false;
    fixture.detectChanges();

    expect(element().querySelector('mat-card-actions')?.children).toHaveLength(0);
  });
});
