import { Component, computed, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { AbstractComponent } from '../../../core/component/abstract/abstract.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(
        (event): event is NavigationEnd => event instanceof NavigationEnd
      ),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  private static readonly TOP_LEVEL_ROUTES = [
    '/home',
    '/login',
    '/transactions',
    '/accounts',
    '/trends',
  ];

  protected showBackButton = computed(() =>
    NavComponent.TOP_LEVEL_ROUTES.every(
      (route) => !this.currentUrl().startsWith(route)
    )
  );

  constructor(protected authService: AuthService) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
