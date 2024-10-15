import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
@Component({
  template: '',
})
export abstract class BaseComponent implements OnInit, OnDestroy {
  protected router: Router;
  protected route: ActivatedRoute;
  protected location: Location;
  protected loading = false;

  constructor() {
    this.router = inject(Router);
    this.location = inject(Location);
    this.route = inject(ActivatedRoute);
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  protected navigate(target: string[]): void {
    this.router.navigate(target);
  }

  protected back(): void {
    this.location.back();
  }
}
