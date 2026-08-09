import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  ConfirmDialogComponent,
  IConfirmDialogData,
} from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: { close: jest.Mock };

  const data: IConfirmDialogData = {
    title: 'Delete transaction',
    message: 'Are you sure?',
  };

  beforeEach(async () => {
    dialogRef = { close: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('confirm', () => {
    it('should close the dialog with true', () => {
      component['confirm']();

      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('cancel', () => {
    it('should close the dialog with false', () => {
      component['cancel']();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
