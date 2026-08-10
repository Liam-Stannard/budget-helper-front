import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const SNACKBAR_DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  constructor(private snackBar: MatSnackBar) {}

  notify(fallbackMessage: string, err?: unknown): void {
    this.snackBar.open(this.extractMessage(err) ?? fallbackMessage, 'Dismiss', {
      duration: SNACKBAR_DURATION_MS,
    });
  }

  private extractMessage(err: unknown): string | undefined {
    if (!err || typeof err !== 'object' || !('error' in err)) {
      return undefined;
    }

    const message = (err as { error?: { message?: unknown } }).error?.message;
    return typeof message === 'string' ? message : undefined;
  }
}
