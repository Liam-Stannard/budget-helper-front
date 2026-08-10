import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ErrorNotificationService } from '../../services/error-notification.service';
@Component({
  template: '',
})
export abstract class AbstractComponent implements OnInit, OnDestroy {
  protected router: Router;
  protected route: ActivatedRoute;
  protected location: Location;
  protected loading = signal(false);
  protected errorNotifier = inject(ErrorNotificationService);

  constructor() {
    this.router = inject(Router);
    this.location = inject(Location);
    this.route = inject(ActivatedRoute);
  }

  ngOnInit(): void {
    this.loading.set(true);
  }

  ngOnDestroy(): void {}

  protected navigate(target: string[]): void {
    this.router.navigate(target);
  }

  protected back(): void {
    this.location.back();
  }

  /** Stops the loading spinner and shows the user a message when an API call fails. */
  protected handleError(fallbackMessage: string, err?: unknown): void {
    this.loading.set(false);
    this.errorNotifier.notify(fallbackMessage, err);
  }
}
