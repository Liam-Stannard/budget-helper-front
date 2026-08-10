import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ErrorNotificationService } from './error-notification.service';

describe('ErrorNotificationService', () => {
  let service: ErrorNotificationService;
  let snackBar: MatSnackBar;
  let snackBarSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAnimationsAsync()],
    });

    service = TestBed.inject(ErrorNotificationService);
    snackBar = TestBed.inject(MatSnackBar);
    snackBarSpy = jest.spyOn(snackBar, 'open').mockImplementation();
  });

  it('should show the fallback message when there is no backend message', () => {
    service.notify('Failed to load data', new Error('network down'));

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to load data',
      'Dismiss',
      { duration: 3000 }
    );
  });

  it('should show the fallback message when no error is passed', () => {
    service.notify('Failed to load data');

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to load data',
      'Dismiss',
      { duration: 3000 }
    );
  });

  it('should surface the backend message when present', () => {
    service.notify('Failed to load data', {
      error: { message: 'Custom backend message' },
    });

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Custom backend message',
      'Dismiss',
      { duration: 3000 }
    );
  });

  it('should fall back when the backend message is not a string', () => {
    service.notify('Failed to load data', { error: { message: 42 } });

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to load data',
      'Dismiss',
      { duration: 3000 }
    );
  });
});
